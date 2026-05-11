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


if __name__ == "__main__":
    unittest.main(verbosity=2)
