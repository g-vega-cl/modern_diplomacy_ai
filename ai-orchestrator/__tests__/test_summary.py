#!/usr/bin/env python3
"""Tests for SummaryManager — cross-turn summary persistence."""
import json
import os
import sys
import tempfile
import unittest
from unittest import mock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from summary_manager import SummaryManager, SUMMARY_SCHEMA
from orchestrator import LLMClient


class TestSummaryFileIO(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.mkdtemp()
        self.mgr = SummaryManager(self.tmpdir)

    def tearDown(self):
        import shutil
        shutil.rmtree(self.tmpdir, ignore_errors=True)

    def test_save_and_load_summary(self):
        """SummaryManager should save JSON and load it back identically."""
        summary = {
            "country": "england",
            "last_updated": "Fall 1901 (after resolution)",
            "alliances": [
                {"country": "germany", "status": "active",
                 "since_turn": "Spring 1901",
                 "notes": "Mutual defense pact"}
            ],
            "deals": [],
            "betrayals": [],
            "long_term_plan": "Expand into Scandinavia",
            "turn_history": [
                {"turn": "Spring 1901",
                 "summary": "Opened F NTH, A YOR. Germany proposed alliance."}
            ]
        }
        self.mgr.save("england", summary)
        loaded = self.mgr.load("england")
        self.assertEqual(loaded, summary)

    def test_load_nonexistent_returns_none(self):
        """Loading a country with no summary file should return None."""
        result = self.mgr.load("france")
        self.assertIsNone(result)

    def test_delete_removes_file(self):
        """Delete should remove the summary file."""
        self.mgr.save("italy", {"country": "italy", "last_updated": "",
                                 "alliances": [], "deals": [], "betrayals": [],
                                 "long_term_plan": "", "turn_history": []})
        self.mgr.delete("italy")
        self.assertIsNone(self.mgr.load("italy"))

    def test_wipe_all_removes_every_country(self):
        """Wipe should clear all summary files at once."""
        for country in ["england", "france", "germany"]:
            self.mgr.save(country, {"country": country, "last_updated": "",
                                     "alliances": [], "deals": [], "betrayals": [],
                                     "long_term_plan": "", "turn_history": []})
        self.mgr.wipe_all()
        for country in ["england", "france", "germany"]:
            self.assertIsNone(self.mgr.load(country))

    def test_turn_history_capped_at_max(self):
        """When turn_history exceeds max_turns, oldest entries are dropped."""
        summary = {
            "country": "england",
            "last_updated": "",
            "alliances": [],
            "deals": [],
            "betrayals": [],
            "long_term_plan": "",
            "turn_history": [
                {"turn": f"Turn {i}", "summary": f"Event {i}"}
                for i in range(1, 15)  # 14 entries
            ]
        }
        capped = self.mgr._cap_turn_history(summary, max_turns=8)
        self.assertEqual(len(capped["turn_history"]), 8)
        self.assertEqual(capped["turn_history"][0]["turn"], "Turn 7")
        self.assertEqual(capped["turn_history"][-1]["turn"], "Turn 14")


class TestSummaryValidation(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.mkdtemp()
        self.mgr = SummaryManager(self.tmpdir)

    def tearDown(self):
        import shutil
        shutil.rmtree(self.tmpdir, ignore_errors=True)

    def test_validate_accepts_complete_summary(self):
        """A fully populated summary should pass validation."""
        summary = {
            "country": "england",
            "last_updated": "Fall 1901",
            "alliances": [],
            "deals": [],
            "betrayals": [],
            "long_term_plan": "Conquer Scandinavia",
            "turn_history": []
        }
        result = self.mgr.validate(summary)
        self.assertTrue(result)

    def test_validate_rejects_missing_required_field(self):
        """Missing 'alliances' should fail validation."""
        summary = {
            "country": "england",
            "last_updated": "",
            "deals": [],
            "betrayals": [],
            "long_term_plan": "",
            "turn_history": []
        }
        result = self.mgr.validate(summary)
        self.assertFalse(result)

    def test_validate_rejects_wrong_type(self):
        """alliances should be a list, not a string."""
        summary = {
            "country": "england",
            "last_updated": "",
            "alliances": "germany",  # wrong type
            "deals": [],
            "betrayals": [],
            "long_term_plan": "",
            "turn_history": []
        }
        result = self.mgr.validate(summary)
        self.assertFalse(result)

    def test_empty_summary_is_valid(self):
        """A minimal summary with empty fields should pass validation."""
        summary = {
            "country": "france",
            "last_updated": "Spring 1901",
            "alliances": [],
            "deals": [],
            "betrayals": [],
            "long_term_plan": "",
            "turn_history": []
        }
        result = self.mgr.validate(summary)
        self.assertTrue(result)

    def test_save_rejects_invalid_summary(self):
        """Saving an invalid summary should raise ValueError."""
        summary = {"country": "england"}  # missing all other fields
        with self.assertRaises(ValueError):
            self.mgr.save("england", summary)


class MockLLMResponse:
    """Concrete mock for urllib.request.urlopen — works with 'with' statement."""
    def __init__(self, body_bytes):
        self._body = body_bytes
    def read(self):
        return self._body
    def __enter__(self):
        return self
    def __exit__(self, *args):
        pass


class TestSummaryGeneration(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.mkdtemp()
        self.mgr = SummaryManager(self.tmpdir)
        self.llm = LLMClient("fake-key")

    def tearDown(self):
        import shutil
        shutil.rmtree(self.tmpdir, ignore_errors=True)

    @mock.patch("urllib.request.urlopen")
    def test_generate_summary_produces_valid_json(self, mock_urlopen):
        """generate_summary should call the LLM and return a valid summary dict."""
        mock_summary = {
            "country": "england",
            "last_updated": "Fall 1901 (after resolution)",
            "alliances": [
                {"country": "germany", "status": "active",
                 "since_turn": "Spring 1901", "notes": "Defense pact"}
            ],
            "deals": [],
            "betrayals": [],
            "long_term_plan": "Push into Scandinavia",
            "turn_history": [
                {"turn": "Spring 1901",
                 "summary": "Opened F NTH, A YOR. Allied with Germany."},
                {"turn": "Fall 1901",
                 "summary": "Took Norway. France is hostile."}
            ]
        }
        response_body = json.dumps(mock_summary)

        mock_urlopen.return_value = MockLLMResponse(
            json.dumps({
                "choices": [{"message": {"content": response_body}}]
            }).encode("utf-8")
        )

        result = self.mgr.generate_summary(
            llm=self.llm,
            model="test/model",
            country="england",
            country_name="England",
            persona="You are the British Empire.",
            system_prompt="You are playing Diplomacy as England.",
            turn_label="Fall 1901",
            board_state="F NTH, A YOR, F LON",
            resolution_text="Took Norway. No dislodges.",
            chat_log="[DM:england:germany — England]: I propose an alliance.",
            previous_summary=None,
        )

        self.assertIsNotNone(result)
        self.assertEqual(result["country"], "england")
        self.assertEqual(result["last_updated"], "Fall 1901 (after resolution)")

    @mock.patch("urllib.request.urlopen")
    def test_generate_summary_appends_turn_history(self, mock_urlopen):
        """When previous_summary exists, new turn should be appended."""
        new_summary = {
            "country": "england",
            "last_updated": "Fall 1901 (after resolution)",
            "alliances": [],
            "deals": [],
            "betrayals": [],
            "long_term_plan": "",
            "turn_history": [
                {"turn": "Spring 1901", "summary": "Opened F NTH, A YOR."},
                {"turn": "Fall 1901", "summary": "Took Norway."}
            ]
        }

        mock_urlopen.return_value = MockLLMResponse(
            json.dumps({
                "choices": [{"message": {"content": json.dumps(new_summary)}}]
            }).encode("utf-8")
        )

        previous = {
            "country": "england",
            "last_updated": "Spring 1901 (after resolution)",
            "alliances": [],
            "deals": [],
            "betrayals": [],
            "long_term_plan": "",
            "turn_history": [
                {"turn": "Spring 1901", "summary": "Opened F NTH, A YOR."}
            ]
        }

        result = self.mgr.generate_summary(
            llm=self.llm,
            model="test/model",
            country="england",
            country_name="England",
            persona="You are the British Empire.",
            system_prompt="You are playing Diplomacy as England.",
            turn_label="Fall 1901",
            board_state="F NTH, A YOR",
            resolution_text="Took Norway.",
            chat_log="",
            previous_summary=previous,
        )

        self.assertEqual(len(result["turn_history"]), 2)

    @mock.patch("urllib.request.urlopen")
    def test_generate_summary_handles_empty_llm_response(self, mock_urlopen):
        """Empty LLM response should return None."""
        mock_urlopen.return_value = MockLLMResponse(
            json.dumps({
                "choices": [{"message": {"content": None}}]
            }).encode("utf-8")
        )

        result = self.mgr.generate_summary(
            llm=self.llm,
            model="test/model",
            country="england",
            country_name="England",
            persona="",
            system_prompt="",
            turn_label="Spring 1901",
            board_state="",
            resolution_text="",
            chat_log="",
            previous_summary=None,
        )

        self.assertIsNone(result)

    @mock.patch("urllib.request.urlopen")
    def test_parse_json_response_handles_markdown_fences(self, mock_urlopen):
        """JSON wrapped in ```json``` fences should be parsed correctly."""
        mock_summary = {
            "country": "england",
            "last_updated": "Spring 1901",
            "alliances": [],
            "deals": [],
            "betrayals": [],
            "long_term_plan": "",
            "turn_history": []
        }
        response_text = "```json\n" + json.dumps(mock_summary) + "\n```"

        mock_urlopen.return_value = MockLLMResponse(
            json.dumps({
                "choices": [{"message": {"content": response_text}}]
            }).encode("utf-8")
        )

        result = self.mgr.generate_summary(
            llm=self.llm,
            model="test/model",
            country="england",
            country_name="England",
            persona="",
            system_prompt="",
            turn_label="Spring 1901",
            board_state="",
            resolution_text="",
            chat_log="",
            previous_summary=None,
        )

        self.assertIsNotNone(result)
        self.assertEqual(result["country"], "england")


class TestSummaryIntegration(unittest.TestCase):
    """Integration test: summary flows through a simulated turn cycle."""

    def setUp(self):
        self.tmpdir = tempfile.mkdtemp()
        self.mgr = SummaryManager(self.tmpdir)

    def tearDown(self):
        import shutil
        shutil.rmtree(self.tmpdir, ignore_errors=True)

    def test_summary_persists_across_turns(self):
        """Summary saved in Turn 1 should be loadable in Turn 2 with appended history."""
        t1_summary = {
            "country": "england",
            "last_updated": "Spring 1901 (after resolution)",
            "alliances": [
                {"country": "germany", "status": "active",
                 "since_turn": "Spring 1901", "notes": "Defense pact"}
            ],
            "deals": [],
            "betrayals": [],
            "long_term_plan": "Expand north",
            "turn_history": [
                {"turn": "Spring 1901", "summary": "Opened. Allied with Germany."}
            ]
        }
        self.mgr.save("england", t1_summary)

        # Simulate Turn 2 — load and append
        loaded = self.mgr.load("england")
        self.assertIsNotNone(loaded)
        self.assertEqual(len(loaded["turn_history"]), 1)

        loaded["turn_history"].append(
            {"turn": "Fall 1901", "summary": "Took Norway. France hostile."}
        )
        loaded["last_updated"] = "Fall 1901 (after resolution)"
        loaded["alliances"].append(
            {"country": "russia", "status": "tentative",
             "since_turn": "Fall 1901", "notes": "Non-aggression pact"}
        )
        self.mgr.save("england", loaded)

        # Verify Turn 2 data
        final = self.mgr.load("england")
        self.assertEqual(len(final["turn_history"]), 2)
        self.assertEqual(len(final["alliances"]), 2)
        self.assertEqual(final["turn_history"][1]["turn"], "Fall 1901")

    def test_format_resolution_for_summary(self):
        """_format_resolution_for_summary should produce readable text."""
        from orchestrator import Orchestrator
        resolution = {
            "successfulMoves": [
                {"unitId": "F_NTH", "fromLocationId": "NTH", "toLocationId": "NWY"}
            ],
            "bouncedMoves": [
                {"unitId": "A_YOR", "attemptedLocationId": "BEL"}
            ],
            "dislodgedUnits": [],
            "destroyedUnits": ["F_LON"]
        }
        # Create a minimal Orchestrator instance to access the method
        # Use a null bridge pattern — we just need the method
        orch = Orchestrator.__new__(Orchestrator)
        text = orch._format_resolution_for_summary(resolution)
        self.assertIn("F_NTH", text)
        self.assertIn("NWY", text)
        self.assertIn("A_YOR", text)
        self.assertIn("BEL", text)
        self.assertIn("F_LON", text)
        self.assertIn("DESTROYED", text)


if __name__ == "__main__":
    unittest.main(verbosity=2)
