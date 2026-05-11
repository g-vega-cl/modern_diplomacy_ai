#!/usr/bin/env python3
"""
Unit tests for the Diplomacy AI Orchestrator.
Tests config loading, order parsing, state formatting, and LLM response extraction.
No API keys needed — pure function tests only.
"""
import json
import sys
import os
import tempfile
import unittest

# Add the orchestrator directory to path so we can import from orchestrator
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from orchestrator import load_config, DiplomacyAgent, LLMClient


class TestConfigLoading(unittest.TestCase):
    def test_load_default_config(self):
        """Default agents.json should load with all 7 countries."""
        config = load_config()
        self.assertIn("game", config)
        self.assertIn("agents", config)
        self.assertIn("global_instructions", config)
        
        game = config["game"]
        self.assertEqual(game["negotiation_window_seconds"], 240)
        self.assertEqual(game["max_negotiation_messages_per_agent"], 15)
        self.assertIn("max_years", game)
        
        agents = config["agents"]
        self.assertEqual(len(agents), 7)
        
        required = ["england", "france", "germany", "italy", "austria", "russia", "turkey"]
        for country in required:
            self.assertIn(country, agents)
            self.assertIn("model", agents[country])
            self.assertIn("country_name", agents[country])
            self.assertIn("persona", agents[country])
    
    def test_load_custom_config(self):
        """Custom config file should load correctly."""
        custom = {
            "game": {
                "server_url": "http://localhost:9999",
                "negotiation_window_seconds": 60,
                "max_negotiation_messages_per_agent": 5,
                "max_years": 10,
            },
            "global_instructions": "Custom instructions for {country_name}",
            "agents": {
                "england": {
                    "model": "openai/gpt-4o",
                    "country_name": "England",
                    "persona": "Test persona",
                },
            },
        }
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            json.dump(custom, f)
            path = f.name
        
        try:
            config = load_config(path)
            self.assertEqual(config["game"]["negotiation_window_seconds"], 60)
            self.assertEqual(len(config["agents"]), 1)
            self.assertEqual(config["agents"]["england"]["model"], "openai/gpt-4o")
        finally:
            os.unlink(path)


class TestOrderParsing(unittest.TestCase):
    """Test the _parse_json method that extracts orders from LLM responses."""
    
    def setUp(self):
        # Create minimal mock objects
        config = {
            "model": "test/model",
            "country_name": "TestLand",
            "persona": "You are a test.",
        }
        global_inst = "You are {country_name}."
        
        class MockBridge:
            def get_state(self):
                return {"year": 1901, "season": "SPRING", "phase": "ORDER",
                        "players": {}, "units": {}, "retreatsNeeded": []}
            def get_player_view(self, pid):
                return {"player": {"name": "Test", "units": {}, "eliminated": False,
                        "supplyCenterCount": 3, "unitCount": 0},
                        "visibleUnits": [], "validMoves": {}, "validBuilds": []}
        
        self.agent = DiplomacyAgent("testland", config, global_inst,
                                     LLMClient("fake-key"), MockBridge())
    
    def test_parse_clean_json_array(self):
        """Clean JSON array should parse correctly."""
        response = '[{"unitId": "A_PAR", "type": "MOVE", "targetLocationId": "BUR"}]'
        orders = self.agent._parse_json(response)
        self.assertEqual(len(orders), 1)
        self.assertEqual(orders[0]["unitId"], "A_PAR")
        self.assertEqual(orders[0]["type"], "MOVE")
        self.assertEqual(orders[0]["targetLocationId"], "BUR")
    
    def test_parse_json_with_markdown_fence(self):
        """JSON inside markdown code fences should parse."""
        response = '```json\n[{"unitId": "A_PAR", "type": "HOLD"}]\n```'
        orders = self.agent._parse_json(response)
        self.assertEqual(len(orders), 1)
        self.assertEqual(orders[0]["type"], "HOLD")
    
    def test_parse_json_with_plain_fence(self):
        """JSON inside plain markdown fences should parse."""
        response = '```\n[{"unitId": "F_LON", "type": "MOVE", "targetLocationId": "NTH"}]\n```'
        orders = self.agent._parse_json(response)
        self.assertEqual(len(orders), 1)
        self.assertEqual(orders[0]["unitId"], "F_LON")
    
    def test_parse_multiple_orders(self):
        """Multiple orders in one array."""
        response = '''[
            {"unitId": "A_PAR", "type": "MOVE", "targetLocationId": "BUR"},
            {"unitId": "F_BRE", "type": "MOVE", "targetLocationId": "MAO"},
            {"unitId": "A_MAR", "type": "SUPPORT", "supportUnitId": "A_PAR", "supportOrderType": "MOVE", "supportTargetLocationId": "BUR"}
        ]'''
        orders = self.agent._parse_json(response)
        self.assertEqual(len(orders), 3)
        self.assertEqual(orders[2]["type"], "SUPPORT")
        self.assertEqual(orders[2]["supportUnitId"], "A_PAR")
    
    def test_parse_json_with_explanatory_text(self):
        """JSON with surrounding text should still extract the array."""
        response = '''Here are my orders:
        [{"unitId": "A_WAR", "type": "MOVE", "targetLocationId": "GAL"}]
        I think this is the best strategy.'''
        orders = self.agent._parse_json(response)
        self.assertEqual(len(orders), 1)
        self.assertEqual(orders[0]["unitId"], "A_WAR")
    
    def test_parse_invalid_json_returns_empty(self):
        """Invalid JSON should return empty list."""
        response = "I'm not sure what to do, let me think..."
        orders = self.agent._parse_json(response)
        self.assertEqual(orders, [])
    
    def test_parse_empty_string(self):
        """Empty response should return empty list."""
        orders = self.agent._parse_json("")
        self.assertEqual(orders, [])
    
    def test_parse_none_returns_empty(self):
        """None response (LLM returned null content) should return empty list without crashing."""
        orders = self.agent._parse_json(None)
        self.assertEqual(orders, [])
    
    def test_parse_no_array(self):
        """JSON object without array should return empty."""
        response = '{"message": "I submit my orders"}'
        orders = self.agent._parse_json(response)
        self.assertEqual(orders, [])
    
    def test_parse_support_order(self):
        """Support order with all fields."""
        response = '''[{
            "unitId": "A_MUN",
            "type": "SUPPORT",
            "supportUnitId": "A_BER",
            "supportOrderType": "MOVE",
            "supportTargetLocationId": "SIL"
        }]'''
        orders = self.agent._parse_json(response)
        self.assertEqual(len(orders), 1)
        self.assertEqual(orders[0]["type"], "SUPPORT")
        self.assertEqual(orders[0]["supportOrderType"], "MOVE")
        self.assertEqual(orders[0]["supportTargetLocationId"], "SIL")


class TestSystemPrompt(unittest.TestCase):
    """Test that the system prompt is built correctly."""
    
    def test_country_name_substitution(self):
        """{country_name} should be replaced."""
        config = {
            "model": "test/model",
            "country_name": "France",
            "persona": "You are France. Be elegant.",
        }
        global_inst = "You are playing as {country_name}."
        
        class MockBridge:
            pass
        
        agent = DiplomacyAgent("france", config, global_inst,
                               LLMClient("fake-key"), MockBridge())
        
        self.assertIn("France", agent.system_prompt)
        self.assertIn("elegant", agent.system_prompt)
        self.assertNotIn("{country_name}", agent.system_prompt)


class TestRetreatParsing(unittest.TestCase):
    """Test retreat decision parsing."""
    
    def setUp(self):
        config = {
            "model": "test/model",
            "country_name": "Austria",
            "persona": "You are Austria.",
        }
        global_inst = "You are {country_name}."
        
        class MockBridge:
            def get_state(self):
                return {"year": 1901, "season": "SPRING", "phase": "RETREAT",
                        "players": {}, "units": {}, "retreatsNeeded": []}
            def get_player_view(self, pid):
                return {"player": {"name": "Austria", "units": {}, "eliminated": False,
                        "supplyCenterCount": 3, "unitCount": 0},
                        "visibleUnits": [], "validMoves": {}, "validBuilds": []}
        
        self.agent = DiplomacyAgent("austria", config, global_inst,
                                     LLMClient("fake-key"), MockBridge())
    
    def test_handle_retreat_no_options(self):
        """No valid retreats → must disband."""
        result = self.agent.handle_retreat("A_VIE", {"validRetreats": []})
        self.assertEqual(result, "disband")
    
    def test_handle_retreat_missing_options_key(self):
        """Missing validRetreats key → must disband."""
        result = self.agent.handle_retreat("A_VIE", {})
        self.assertEqual(result, "disband")


class TestLLMClient(unittest.TestCase):
    """Test LLM client construction and configuration."""
    
    def test_client_creation(self):
        """Client should store API key."""
        client = LLMClient("sk-or-v1-test123")
        self.assertEqual(client.api_key, "sk-or-v1-test123")
        self.assertTrue(client.BASE.startswith("https://"))


class TestConfigValidation(unittest.TestCase):
    """Test that the config has required fields."""
    
    def test_all_models_are_valid_openrouter_paths(self):
        """Each agent should have a model in provider/model format."""
        config = load_config()
        for pid, agent in config["agents"].items():
            model = agent["model"]
            self.assertIn("/", model, 
                f"{pid}: model '{model}' should be in provider/model format")
            provider, name = model.split("/", 1)
            self.assertTrue(provider, f"{pid}: provider is empty in '{model}'")
            self.assertTrue(name, f"{pid}: model name is empty in '{model}'")
    
    def test_all_models_are_unique(self):
        """Every country must use a different model — no duplicates."""
        config = load_config()
        models_used = set()
        for pid, agent in config["agents"].items():
            model = agent["model"]
            self.assertNotIn(model, models_used,
                f"Duplicate model '{model}' used by {pid} and another country")
            models_used.add(model)
        self.assertEqual(len(models_used), 7, "All 7 countries must use unique models")

    def test_all_required_countries_present(self):
        """All 7 standard Diplomacy powers must be configured."""
        config = load_config()
        required = {"england", "france", "germany", "italy", "austria", "russia", "turkey"}
        actual = set(config["agents"].keys())
        self.assertEqual(actual, required, f"Missing countries: {required - actual}")


class TestFallbackPlacements(unittest.TestCase):
    """Test that when the LLM returns empty, valid placements are still submitted."""

    def setUp(self):
        config = {
            "model": "test/model",
            "country_name": "Italy",
            "persona": "You are Italy.",
        }
        global_inst = "You are {country_name}."

        class MockBridge:
            def get_state(self):
                return {"year": 1901, "season": "SPRING", "phase": "PLACEMENT",
                        "players": {}, "units": {}, "retreatsNeeded": []}
            def get_player_view(self, pid):
                return {
                    "player": {"name": "Italy", "units": {}, "eliminated": False,
                               "supplyCenterCount": 3, "unitCount": 0},
                    "visibleUnits": [],
                    "validMoves": {},
                    "validBuilds": [],
                    "validPlacements": [
                        {"type": "F", "locationId": "NAP"},
                        {"type": "A", "locationId": "NAP"},
                        {"type": "F", "locationId": "ROM"},
                        {"type": "A", "locationId": "ROM"},
                        {"type": "F", "locationId": "VEN"},
                        {"type": "A", "locationId": "VEN"},
                    ],
                }

        self.agent = DiplomacyAgent("italy", config, global_inst,
                                     LLMClient("fake-key"), MockBridge())

    def test_fallback_placements_when_llm_returns_empty(self):
        """When LLM returns empty, fallback should pick one placement per location."""
        # Simulate the orchestrator's fallback logic:
        # when generate_placements() returns [], pull validPlacements from view
        view = self.agent.bridge.get_player_view(self.agent.player_id)
        valid = view.get("validPlacements", [])
        fallback = self.agent._build_fallback_placements(valid)

        self.assertEqual(len(fallback), 3,
                         f"Should have 3 placements, got {len(fallback)}: {fallback}")

        # Each location should appear exactly once
        locations = [p["locationId"] for p in fallback]
        self.assertEqual(sorted(locations), ["NAP", "ROM", "VEN"])

        # Each placement should have type and locationId
        for p in fallback:
            self.assertIn("type", p)
            self.assertIn("locationId", p)

    def test_fallback_uses_first_valid_type_per_location(self):
        """Fallback should pick the first valid type for each location."""
        valid = [
            {"type": "F", "locationId": "NAP"},
            {"type": "A", "locationId": "NAP"},
            {"type": "F", "locationId": "ROM"},
        ]
        fallback = self.agent._build_fallback_placements(valid)
        self.assertEqual(len(fallback), 2)
        self.assertEqual(fallback[0], {"type": "F", "locationId": "NAP"})
        self.assertEqual(fallback[1], {"type": "F", "locationId": "ROM"})

    def test_fallback_empty_when_no_valid_placements(self):
        """Should return empty list when there are no valid placements."""
        fallback = self.agent._build_fallback_placements([])
        self.assertEqual(fallback, [])


class TestChatMessageSanitization(unittest.TestCase):
    """Test that LLM chat responses are sanitized before posting to channels."""

    def setUp(self):
        config = {
            "model": "test/model",
            "country_name": "Germany",
            "persona": "You are Germany.",
        }
        global_inst = "You are {country_name}."
        # Minimal bridge — just needs to exist
        class MockBridge:
            pass
        self.agent = DiplomacyAgent("germany", config, global_inst,
                                     LLMClient("fake-key"), MockBridge())

    def test_strips_meta_reasoning(self):
        """Models outputting 'We need to decide: respond or PASS' should be sanitized."""
        text = "We need to decide: respond or PASS. The last message in Global Diplomacy is from Turkey. We should reply. The Kaiser shares the desire for Balkan stability."
        result = self.agent._sanitize_chat_message(text)
        self.assertNotIn("We need to decide", result,
                         "Meta-reasoning should be stripped")
        self.assertNotIn("respond or PASS", result,
                         "PASS instruction to self should be stripped")

    def test_strips_raw_json_content(self):
        """Austria outputting [{channelId: global, content: ...}] should be fixed."""
        text = '[{"channelId": "global", "content": "Austria welcomes Turkey\'s willingness to coordinate."}]'
        result = self.agent._sanitize_chat_message(text)
        self.assertNotIn("channelId", result, "Raw JSON should be stripped")
        self.assertIn("Austria welcomes", result, "Message content should be preserved")

    def test_strips_own_markup_prefixes(self):
        """Models shouldn't invent their own '[Global Diplomacy — Country]:' markup."""
        text = "Global Diplomacy — Turkey: Welcome, Austria, and thank you, Germany."
        result = self.agent._sanitize_chat_message(text)
        self.assertNotEqual(result[:20].lower(), "global diplomacy —",
                           "Self-invented channel prefix should be stripped")

    def test_strips_markdown_strong_bold_markers(self):
        """'**[Global Diplomacy — Country]:**' should be stripped."""
        text = "**[Global Diplomacy — England]:** The British Crown observes these continental maneuvers."
        result = self.agent._sanitize_chat_message(text)
        self.assertNotIn("**", result, "Markdown bold markers should be stripped")
        self.assertIn("The British Crown", result[:50], "Message body should be preserved")

    def test_preserves_valid_in_character_message(self):
        """A clean in-character message should pass through unchanged."""
        text = "The Kaiser shares the Sultan's desire for stability. From our side, we see no immediate conflict in the Balkans."
        result = self.agent._sanitize_chat_message(text)
        self.assertEqual(text.strip(), result.strip())

    def test_handles_empty_string(self):
        """Empty string should return empty string."""
        self.assertEqual(self.agent._sanitize_chat_message(""), "")

    def test_handles_none(self):
        """None should return empty string without crashing."""
        self.assertEqual(self.agent._sanitize_chat_message(None), "")

    def test_strips_leading_json_prefix(self):
        """A message that starts with JSON-like structure but has text after."""
        text = '[{"channelId": "global"}]\nAustria welcomes Turkey\'s willingness to coordinate.'
        result = self.agent._sanitize_chat_message(text)
        self.assertNotIn("[{", result, "JSON prefix should be stripped")
        self.assertIn("Austria welcomes", result, "Text after JSON should remain")


if __name__ == "__main__":
    unittest.main(verbosity=2)
