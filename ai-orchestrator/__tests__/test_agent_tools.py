#!/usr/bin/env python3
"""Tests for AgentTools — tool dispatcher with validation."""
import unittest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from agent_tools import AgentTools


class FakeBridge:
    """Minimal fake for EngineBridge — returns canned game state."""
    def __init__(self):
        self.state = {
            "year": 1901, "season": "SPRING", "phase": "ORDER",
            "players": {
                "france": {
                    "id": "france", "name": "France",
                    "supplyCenterCount": 3, "eliminated": False,
                    "units": {
                        "A_PAR_0_france": {"id": "A_PAR_0_france", "type": "A", "locationId": "PAR"},
                        "A_MAR_1_france": {"id": "A_MAR_1_france", "type": "A", "locationId": "MAR"},
                        "F_BRE_2_france": {"id": "F_BRE_2_france", "type": "F", "locationId": "BRE"},
                    },
                },
                "germany": {
                    "id": "germany", "name": "Germany",
                    "supplyCenterCount": 3, "eliminated": False,
                    "units": {
                        "A_BER_0_germany": {"id": "A_BER_0_germany", "type": "A", "locationId": "BER"},
                        "F_KIE_1_germany": {"id": "F_KIE_1_germany", "type": "F", "locationId": "KIE"},
                        "A_MUN_2_germany": {"id": "A_MUN_2_germany", "type": "A", "locationId": "MUN"},
                    },
                },
            },
            "units": {
                "A_PAR_0_france": {"id": "A_PAR_0_france", "type": "A", "ownerId": "france", "locationId": "PAR"},
                "A_MAR_1_france": {"id": "A_MAR_1_france", "type": "A", "ownerId": "france", "locationId": "MAR"},
                "F_BRE_2_france": {"id": "F_BRE_2_france", "type": "F", "ownerId": "france", "locationId": "BRE"},
                "A_BER_0_germany": {"id": "A_BER_0_germany", "type": "A", "ownerId": "germany", "locationId": "BER"},
                "F_KIE_1_germany": {"id": "F_KIE_1_germany", "type": "F", "ownerId": "germany", "locationId": "KIE"},
                "A_MUN_2_germany": {"id": "A_MUN_2_germany", "type": "A", "ownerId": "germany", "locationId": "MUN"},
            },
            "supplyCenterOwners": {
                "PAR": "france", "MAR": "france", "BRE": "france",
                "BER": "germany", "KIE": "germany", "MUN": "germany",
            },
            "retreatsNeeded": [],
        }
        self.valid_moves = {
            "A_PAR_0_france": ["BUR", "PIC", "GAS", "BRE"],
            "A_MAR_1_france": ["PIE", "GAS", "BUR", "SPA"],
            "F_BRE_2_france": ["MAO", "ENG", "PIC", "GAS"],
        }
        self.submitted_orders = []

    def get_state(self):
        return self.state

    def get_player_view(self, player_id):
        player = self.state["players"].get(player_id, {})
        return {
            "player": player,
            "visibleUnits": list(self.state["units"].values()),
            "validMoves": {
                uid: moves for uid, moves in self.valid_moves.items()
                if uid in player.get("units", {})
            },
            "validBuilds": [],
            "validPlacements": [],
        }

    def submit_orders(self, player_id, orders):
        self.submitted_orders.append((player_id, orders))
        return {}


class TestAgentTools(unittest.TestCase):
    def setUp(self):
        self.bridge = FakeBridge()
        self.tools = AgentTools("france", self.bridge)

    def test_get_my_units_returns_agent_units(self):
        result = self.tools.dispatch("get_my_units", {})
        self.assertIn("units", result)
        self.assertEqual(len(result["units"]), 3)
        unit_ids = [u["id"] for u in result["units"]]
        self.assertIn("A_PAR_0_france", unit_ids)
        self.assertIn("A_MAR_1_france", unit_ids)
        self.assertIn("F_BRE_2_france", unit_ids)

    # ── get_valid_moves ──

    def test_get_valid_moves_returns_destinations(self):
        result = self.tools.dispatch("get_valid_moves", {"unit_id": "A_PAR_0_france"})
        self.assertIn("valid_moves", result)
        self.assertIn("BUR", result["valid_moves"])
        self.assertIn("PIC", result["valid_moves"])

    def test_get_valid_moves_rejects_enemy_unit(self):
        result = self.tools.dispatch("get_valid_moves", {"unit_id": "A_BER_0_germany"})
        self.assertIn("error", result)
        self.assertIn("does not belong to you", result["error"])

    def test_get_valid_moves_rejects_nonexistent_unit(self):
        result = self.tools.dispatch("get_valid_moves", {"unit_id": "A_NOPE_99"})
        self.assertIn("error", result)
        self.assertIn("not found", result["error"])

    # ── submit_order ──

    def test_submit_order_hold_succeeds(self):
        result = self.tools.dispatch("submit_order", {
            "unit_id": "A_PAR_0_france", "order_type": "HOLD"
        })
        self.assertTrue(result["ok"])
        orders = self.tools.get_orders()
        self.assertEqual(len(orders), 1)
        self.assertEqual(orders[0]["unitId"], "A_PAR_0_france")
        self.assertEqual(orders[0]["type"], "HOLD")

    def test_submit_order_move_rejects_invalid_destination(self):
        result = self.tools.dispatch("submit_order", {
            "unit_id": "A_PAR_0_france", "order_type": "MOVE",
            "target_location": "ZOMBIE"
        })
        self.assertFalse(result["ok"])
        self.assertIn("not a valid move", result["error"])

    def test_submit_order_move_succeeds_with_valid_target(self):
        result = self.tools.dispatch("submit_order", {
            "unit_id": "A_PAR_0_france", "order_type": "MOVE",
            "target_location": "BUR"
        })
        self.assertTrue(result["ok"])
        self.assertEqual(self.tools.get_orders()[0]["targetLocationId"], "BUR")

    def test_submit_order_move_requires_target(self):
        result = self.tools.dispatch("submit_order", {
            "unit_id": "A_PAR_0_france", "order_type": "MOVE",
        })
        self.assertFalse(result["ok"])
        self.assertIn("target_location", result["error"].lower())

    def test_submit_order_support_requires_fields(self):
        result = self.tools.dispatch("submit_order", {
            "unit_id": "A_PAR_0_france", "order_type": "SUPPORT",
        })
        self.assertFalse(result["ok"])
        self.assertIn("support_unit_id", result["error"].lower())

    def test_submit_order_support_move_requires_target(self):
        result = self.tools.dispatch("submit_order", {
            "unit_id": "A_MAR_1_france", "order_type": "SUPPORT",
            "support_unit_id": "A_PAR_0_france",
            "support_order_type": "MOVE",
        })
        self.assertFalse(result["ok"])
        self.assertIn("support_target_location", result["error"].lower())

    def test_submit_order_rejects_enemy_unit(self):
        result = self.tools.dispatch("submit_order", {
            "unit_id": "A_BER_0_germany", "order_type": "HOLD"
        })
        self.assertFalse(result["ok"])
        self.assertIn("does not belong to you", result["error"])

    # ── cancel_order ──

    def test_cancel_order_removes_pending(self):
        self.tools.dispatch("submit_order", {
            "unit_id": "A_PAR_0_france", "order_type": "HOLD"
        })
        self.assertEqual(len(self.tools.get_orders()), 1)
        result = self.tools.dispatch("cancel_order", {"unit_id": "A_PAR_0_france"})
        self.assertTrue(result["ok"])
        self.assertEqual(len(self.tools.get_orders()), 0)

    def test_cancel_nonexistent_order(self):
        result = self.tools.dispatch("cancel_order", {"unit_id": "A_PAR_0_france"})
        self.assertFalse(result["ok"])

    # ── finalize_orders ──

    def test_finalize_fails_when_units_missing_orders(self):
        result = self.tools.dispatch("finalize_orders", {})
        self.assertFalse(result["ok"])
        self.assertIn("Missing orders", result["error"])

    def test_finalize_succeeds_when_all_units_have_orders(self):
        for uid in ["A_PAR_0_france", "A_MAR_1_france", "F_BRE_2_france"]:
            self.tools.dispatch("submit_order", {"unit_id": uid, "order_type": "HOLD"})
        result = self.tools.dispatch("finalize_orders", {})
        self.assertTrue(result["ok"])
        self.assertTrue(self.tools.is_finalized())

    # ── get_visible_units ──

    def test_get_visible_units_includes_all_powers(self):
        result = self.tools.dispatch("get_visible_units", {})
        self.assertIn("units", result)
        owners = {u["owner"] for u in result["units"]}
        self.assertIn("france", owners)
        self.assertIn("germany", owners)

    # ── get_supply_centers ──

    def test_get_supply_centers_shows_ownership(self):
        result = self.tools.dispatch("get_supply_centers", {})
        self.assertIn("supply_centers", result)
        scs = result["supply_centers"]
        par = next(sc for sc in scs if sc["center"] == "PAR")
        self.assertEqual(par["owner"], "france")
        self.assertTrue(par["is_mine"])
        ber = next(sc for sc in scs if sc["center"] == "BER")
        self.assertEqual(ber["owner"], "germany")
        self.assertFalse(ber["is_mine"])

    # ── unknown tool ──

    def test_unknown_tool_returns_error(self):
        result = self.tools.dispatch("nonexistent_tool", {})
        self.assertIn("error", result)
        self.assertEqual(result["error"], "Unknown tool: nonexistent_tool")
