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

    # ── Build phase tools ───────────────────────────────────────────

    @staticmethod
    def build_definitions() -> list:
        """Return the tool definitions for the BUILD phase."""
        return [
            {
                "type": "function",
                "function": {
                    "name": "get_my_units",
                    "description": "Get a list of your current units with their type and location.",
                    "parameters": {"type": "object", "properties": {}, "required": []}
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_valid_builds",
                    "description": "Get your open home centers where you can build new units. Only empty home SCs you own are listed.",
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
                    "name": "submit_build",
                    "description": "Submit one build action: CREATE a new unit in an open home center, or DESTROY one of your existing units.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "action": {
                                "type": "string",
                                "enum": ["CREATE", "DESTROY"],
                                "description": "CREATE a new unit or DESTROY an existing one"
                            },
                            "unit_type": {
                                "type": "string",
                                "enum": ["A", "F"],
                                "description": "Unit type for CREATE (A=Army, F=Fleet). Not needed for DESTROY."
                            },
                            "location_id": {
                                "type": "string",
                                "description": "Home SC to build in (for CREATE) or location of unit to destroy (for DESTROY)"
                            },
                        },
                        "required": ["action", "location_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "cancel_build",
                    "description": "Remove a previously submitted build action for a location.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "location_id": {"type": "string", "description": "The location to cancel the build for"}
                        },
                        "required": ["location_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "finalize_builds",
                    "description": "Signal that you are finished submitting build actions. Call when you've submitted the required number.",
                    "parameters": {"type": "object", "properties": {}, "required": []}
                }
            },
        ]

    def _tool_get_valid_builds(self, args: dict) -> dict:
        view = self.bridge.get_player_view(self.player_id)
        valid = view.get("validBuilds", [])
        # Enrich with province type info so agents know fleet eligibility
        state = self.bridge.get_state()
        enriched = []
        for loc in valid:
            province = state.get("provinces", {}).get(loc)
            ptype = province.get("type", "?") if province else "?"
            fleet_ok = ptype in ("COAST", "SEA")
            enriched.append({
                "location": loc,
                "province_type": ptype,
                "can_build_fleet": fleet_ok,
                "can_build_army": True,
            })
        return {"valid_builds": enriched, "count": len(enriched)}

    def _tool_submit_build(self, args: dict) -> dict:
        action = args["action"]
        location_id = args["location_id"]

        if action == "CREATE":
            unit_type = args.get("unit_type", "A")
            if unit_type not in ("A", "F"):
                return {"ok": False, "error": "unit_type must be 'A' or 'F'"}

            # Validate location is a valid build target
            view = self.bridge.get_player_view(self.player_id)
            valid = view.get("validBuilds", [])
            if location_id not in valid:
                return {"ok": False, "error": f"'{location_id}' is not a valid build location. Valid: {valid}"}

            # No duplicate builds in same location
            for existing in self._pending_orders.values():
                if existing.get("locationId") == location_id:
                    return {"ok": False, "error": f"Already submitted a build for {location_id}"}

            build = {
                "type": "CREATE",
                "unitType": unit_type,
                "locationId": location_id,
            }

        elif action == "DESTROY":
            # Validate the unit exists and belongs to this player
            state = self.bridge.get_state()
            found = False
            for uid, u in state.get("units", {}).items():
                if u.get("ownerId") == self.player_id and u.get("locationId") == location_id:
                    found = True
                    break
            if not found:
                return {"ok": False, "error": f"No unit of yours found at {location_id}"}

            build = {
                "type": "DESTROY",
                "locationId": location_id,
            }
        else:
            return {"ok": False, "error": f"Unknown action: {action}"}

        # Use location as key (only one build per location)
        key = f"build_{action}_{location_id}"
        self._pending_orders[key] = build
        return {"ok": True, "build": build}

    def _tool_cancel_build(self, args: dict) -> dict:
        location_id = args["location_id"]
        for key in list(self._pending_orders.keys()):
            val = self._pending_orders[key]
            if val.get("locationId") == location_id:
                del self._pending_orders[key]
                return {"ok": True, "cancelled": location_id}
        return {"ok": False, "error": f"No pending build for {location_id}"}

    def _tool_finalize_builds(self, args: dict) -> dict:
        state = self.bridge.get_state()
        player = state.get("players", {}).get(self.player_id, {})
        sc_count = player.get("supplyCenterCount", 0)
        unit_count = len(player.get("units", {}))
        delta = sc_count - unit_count

        creates = [b for b in self._pending_orders.values() if b.get("type") == "CREATE"]
        destroys = [b for b in self._pending_orders.values() if b.get("type") == "DESTROY"]

        if delta > 0:
            expected = delta
            actual = len(creates)
        elif delta < 0:
            expected = abs(delta)
            actual = len(destroys)
        else:
            self._finalized = True
            return {"ok": True, "order_count": 0, "message": "No builds needed — unit count matches SC count"}

        if actual != expected:
            return {
                "ok": False,
                "error": f"Wrong number of builds: need {expected} {'CREATE' if delta > 0 else 'DESTROY'}(s) but have {actual}. Submitted: {list(self._pending_orders.values())}"
            }

        self._finalized = True
        return {"ok": True, "order_count": actual, "message": "Builds finalized successfully"}

    def get_builds(self) -> list:
        """Return the list of validated build orders."""
        return list(self._pending_orders.values())
