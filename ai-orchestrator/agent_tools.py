"""Tool definitions and dispatcher for AI Diplomacy agents."""


class AgentTools:
    """Exposes game state as OpenAI-compatible function tools.

    Tools validate inputs at call time and buffer orders in memory.
    The orchestrator retrieves validated orders via get_orders()
    and submits them to the engine bridge in one batch.
    """

    def __init__(self, player_id: str, bridge):
        self.player_id = player_id
        self.bridge = bridge
        self._pending_orders = {}  # unitId -> Order dict
        self._finalized = False

    # ── Tool definitions (for OpenRouter) ──

    @staticmethod
    def definitions() -> list:
        """Return the tool definitions for the ORDER phase."""
        return [
            {
                "type": "function",
                "function": {
                    "name": "get_my_units",
                    "description": "Get a list of your units with their type, location, and whether they already have an order submitted.",
                    "parameters": {"type": "object", "properties": {}, "required": []}
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_valid_moves",
                    "description": "Get valid move destinations for one of your units.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "unit_id": {
                                "type": "string",
                                "description": "The unit ID (e.g., 'A_PAR_0_france')"
                            }
                        },
                        "required": ["unit_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_visible_units",
                    "description": "Get all units visible on the board — yours and other powers'.",
                    "parameters": {"type": "object", "properties": {}, "required": []}
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_supply_centers",
                    "description": "Get supply center ownership information.",
                    "parameters": {"type": "object", "properties": {}, "required": []}
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "submit_order",
                    "description": "Submit one order for one of your units. Call once per unit.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "unit_id": {"type": "string", "description": "Your unit ID"},
                            "order_type": {
                                "type": "string",
                                "enum": ["HOLD", "MOVE", "SUPPORT"],
                                "description": "Type of order"
                            },
                            "target_location": {
                                "type": "string",
                                "description": "Destination territory for MOVE orders"
                            },
                            "support_unit_id": {
                                "type": "string",
                                "description": "Unit being supported (for SUPPORT orders)"
                            },
                            "support_order_type": {
                                "type": "string",
                                "enum": ["HOLD", "MOVE"],
                                "description": "Type of order being supported"
                            },
                            "support_target_location": {
                                "type": "string",
                                "description": "Target location of supported MOVE"
                            },
                        },
                        "required": ["unit_id", "order_type"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "cancel_order",
                    "description": "Remove a previously submitted order for a unit.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "unit_id": {"type": "string", "description": "The unit ID to cancel the order for"}
                        },
                        "required": ["unit_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "finalize_orders",
                    "description": "Signal that you are finished submitting orders. Call this when all your units have orders.",
                    "parameters": {"type": "object", "properties": {}, "required": []}
                }
            },
        ]

    # ── Tool dispatcher ──

    def dispatch(self, tool_name: str, args: dict) -> dict:
        """Route a tool call to the appropriate handler."""
        method = getattr(self, f"_tool_{tool_name}", None)
        if method is None:
            return {"error": f"Unknown tool: {tool_name}"}
        try:
            return method(args)
        except Exception as e:
            return {"error": str(e)}

    def _tool_get_my_units(self, args: dict) -> dict:
        state = self.bridge.get_state()
        player = state.get("players", {}).get(self.player_id, {})
        units = player.get("units", {})
        result = []
        for uid, u in units.items():
            result.append({
                "id": uid,
                "type": u.get("type"),
                "location": u.get("locationId"),
                "has_order": uid in self._pending_orders,
            })
        return {"units": result, "count": len(result)}

    def _tool_get_valid_moves(self, args: dict) -> dict:
        unit_id = args["unit_id"]
        state = self.bridge.get_state()
        unit = state.get("units", {}).get(unit_id)
        if not unit:
            return {"error": f"Unit '{unit_id}' not found"}
        if unit.get("ownerId") != self.player_id:
            return {"error": f"Unit '{unit_id}' does not belong to you"}

        view = self.bridge.get_player_view(self.player_id)
        moves = view.get("validMoves", {}).get(unit_id, [])
        return {
            "unit_id": unit_id,
            "type": unit.get("type"),
            "location": unit.get("locationId"),
            "valid_moves": moves,
            "supports_possible": True,
        }

    def _tool_get_visible_units(self, args: dict) -> dict:
        view = self.bridge.get_player_view(self.player_id)
        units = view.get("visibleUnits", [])
        result = []
        for u in units:
            result.append({
                "id": u.get("id"),
                "owner": u.get("ownerId"),
                "type": u.get("type"),
                "location": u.get("locationId"),
                "is_mine": u.get("ownerId") == self.player_id,
            })
        return {"units": result}

    def _tool_get_supply_centers(self, args: dict) -> dict:
        state = self.bridge.get_state()
        sc_owners = state.get("supplyCenterOwners", {})
        result = []
        for sc_id, owner_id in sc_owners.items():
            result.append({
                "center": sc_id,
                "owner": owner_id,
                "is_mine": owner_id == self.player_id,
            })
        return {"supply_centers": result}

    def _tool_submit_order(self, args: dict) -> dict:
        unit_id = args["unit_id"]
        order_type = args["order_type"]

        # Validate unit exists, belongs to agent
        state = self.bridge.get_state()
        unit = state.get("units", {}).get(unit_id)
        if not unit:
            return {"ok": False, "error": f"Unit '{unit_id}' not found"}
        if unit.get("ownerId") != self.player_id:
            return {"ok": False, "error": f"Unit '{unit_id}' does not belong to you"}

        # Build order dict
        order = {"unitId": unit_id, "type": order_type}

        if order_type == "MOVE":
            target = args.get("target_location")
            if not target:
                return {"ok": False, "error": "MOVE orders require target_location"}
            # Validate the move is legal
            view = self.bridge.get_player_view(self.player_id)
            valid_moves = view.get("validMoves", {}).get(unit_id, [])
            if target not in valid_moves:
                return {"ok": False, "error": f"'{target}' is not a valid move for {unit_id}. Valid: {valid_moves}"}
            order["targetLocationId"] = target

        elif order_type == "SUPPORT":
            support_unit = args.get("support_unit_id")
            support_type = args.get("support_order_type")
            if not support_unit or not support_type:
                return {"ok": False, "error": "SUPPORT requires support_unit_id and support_order_type"}
            order["supportUnitId"] = support_unit
            order["supportOrderType"] = support_type
            if support_type == "MOVE":
                target = args.get("support_target_location")
                if not target:
                    return {"ok": False, "error": "SUPPORT MOVE requires support_target_location"}
                order["supportTargetLocationId"] = target

        self._pending_orders[unit_id] = order
        return {"ok": True, "order": order}

    def _tool_cancel_order(self, args: dict) -> dict:
        unit_id = args["unit_id"]
        if unit_id in self._pending_orders:
            del self._pending_orders[unit_id]
            return {"ok": True, "cancelled": unit_id}
        return {"ok": False, "error": f"No pending order for {unit_id}"}

    def _tool_finalize_orders(self, args: dict) -> dict:
        state = self.bridge.get_state()
        player = state.get("players", {}).get(self.player_id, {})
        my_units = player.get("units", {})

        # Check all units have orders
        missing = []
        for uid in my_units:
            if uid not in self._pending_orders:
                missing.append(uid)

        if missing:
            return {
                "ok": False,
                "error": f"Missing orders for: {missing}. Use submit_order for each unit before finalizing."
            }

        self._finalized = True
        return {"ok": True, "order_count": len(self._pending_orders), "message": "Orders finalized successfully"}

    # ── Public API for orchestrator ──

    def get_orders(self) -> list:
        """Return the list of validated orders. Call after finalize."""
        return list(self._pending_orders.values())

    def is_finalized(self) -> bool:
        return self._finalized
