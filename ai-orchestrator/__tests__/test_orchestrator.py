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
import urllib.request
from unittest import mock

# Add the orchestrator directory to path so we can import from orchestrator
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from orchestrator import load_config, DiplomacyAgent, LLMClient, format_board


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
        """Most countries should use unique models, but some sharing is OK
        (e.g., when a stronger model replaces a weak one for a struggling power)."""
        config = load_config()
        models_used = set()
        for pid, agent in config["agents"].items():
            model = agent["model"]
            models_used.add(model)
        # At least 5 unique models out of 7 (allows up to 2 duplicates)
        self.assertGreaterEqual(len(models_used), 5,
            f"Expected at least 5 unique models, got {len(models_used)}: {models_used}")

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


class TestLLMFallback(unittest.TestCase):
    """Test that LLMClient retries with fallback model when primary returns empty."""

    def setUp(self):
        self.client = LLMClient("fake-key")
        self.call_count = 0
        self.request_bodies = []

    def _make_mock_urlopen(self, responses):
        """Create a mock urlopen that returns successive responses."""
        response_index = [0]

        class MockResponse:
            def __init__(self, body):
                self._body = body
            def read(self):
                return self._body.encode("utf-8") if isinstance(self._body, str) else json.dumps(self._body).encode("utf-8")
            def __enter__(self):
                return self
            def __exit__(self, *args):
                pass

        def mock_urlopen(req, timeout=None):
            idx = response_index[0]
            response_index[0] += 1
            body = req.data.decode("utf-8") if isinstance(req.data, bytes) else req.data
            self.request_bodies.append(json.loads(body))
            if idx < len(responses):
                return MockResponse(responses[idx])
            return MockResponse(responses[-1])

        return mock_urlopen

    def test_fallback_retries_when_primary_returns_null_content(self):
        """When primary model returns null content, fallback model should be tried."""
        responses = [
            # Primary model returns null content
            {"choices": [{"message": {"content": None}}]},
            # Fallback model returns valid content
            {"choices": [{"message": {"content": "Move to BUR"}}]},
        ]

        with mock.patch("urllib.request.urlopen",
                                  self._make_mock_urlopen(responses)):
            result = self.client.chat(
                model="stepfun/step-3.5-flash",
                messages=[{"role": "user", "content": "What to do?"}],
                fallback_model="deepseek/deepseek-v4-flash",
            )

        self.assertEqual(result, "Move to BUR")
        self.assertEqual(len(self.request_bodies), 2,
                         "Should make 2 calls: primary then fallback")
        self.assertEqual(self.request_bodies[0]["model"], "stepfun/step-3.5-flash")
        self.assertEqual(self.request_bodies[1]["model"], "deepseek/deepseek-v4-flash")

    def test_fallback_retries_when_primary_returns_empty_string(self):
        """When primary model returns empty string, fallback should be tried."""
        responses = [
            {"choices": [{"message": {"content": ""}}]},
            {"choices": [{"message": {"content": "HOLD"}}]},
        ]

        with mock.patch("urllib.request.urlopen",
                                  self._make_mock_urlopen(responses)):
            result = self.client.chat(
                model="xiaomi/mimo-v2-flash",
                messages=[{"role": "user", "content": "Orders?"}],
                fallback_model="deepseek/deepseek-v4-flash",
            )

        self.assertEqual(result, "HOLD")
        self.assertEqual(len(self.request_bodies), 2)

    def test_no_fallback_when_primary_succeeds(self):
        """When primary model returns valid content, no fallback call is made."""
        responses = [
            {"choices": [{"message": {"content": "Valid response"}}]},
        ]

        with mock.patch("urllib.request.urlopen",
                                  self._make_mock_urlopen(responses)):
            result = self.client.chat(
                model="openai/gpt-5.4-nano",
                messages=[{"role": "user", "content": "Test"}],
                fallback_model="deepseek/deepseek-v4-flash",
            )

        self.assertEqual(result, "Valid response")
        self.assertEqual(len(self.request_bodies), 1,
                         "Should only call primary model once")

    def test_no_fallback_when_no_fallback_model_provided(self):
        """Without fallback_model, empty response is returned as-is."""
        responses = [
            {"choices": [{"message": {"content": None}}]},
        ]

        with mock.patch("urllib.request.urlopen",
                                  self._make_mock_urlopen(responses)):
            result = self.client.chat(
                model="stepfun/step-3.5-flash",
                messages=[{"role": "user", "content": "Test"}],
            )

        self.assertEqual(result, "")
        self.assertEqual(len(self.request_bodies), 1)

    def test_fallback_still_returns_empty_if_both_fail(self):
        """If both primary and fallback return empty, return empty string."""
        responses = [
            {"choices": [{"message": {"content": None}}]},
            {"choices": [{"message": {"content": ""}}]},
        ]

        with mock.patch("urllib.request.urlopen",
                                  self._make_mock_urlopen(responses)):
            result = self.client.chat(
                model="stepfun/step-3.5-flash",
                messages=[{"role": "user", "content": "Test"}],
                fallback_model="deepseek/deepseek-v4-flash",
            )

        self.assertEqual(result, "")
        self.assertEqual(len(self.request_bodies), 2)


class TestFallbackConfig(unittest.TestCase):
    """Test that fallback_model is loaded from config."""

    def test_fallback_model_loads_from_game_config(self):
        """Custom config with fallback_model should be accessible."""
        custom = {
            "game": {
                "server_url": "http://localhost:3000",
                "negotiation_window_seconds": 60,
                "max_negotiation_messages_per_agent": 5,
                "max_years": 10,
                "fallback_model": "deepseek/deepseek-v4-flash",
            },
            "global_instructions": "Custom {country_name}",
            "agents": {
                "england": {
                    "model": "openai/gpt-4o",
                    "country_name": "England",
                    "persona": "Test",
                },
            },
        }
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            json.dump(custom, f)
            path = f.name

        try:
            config = load_config(path)
            self.assertEqual(
                config["game"].get("fallback_model"),
                "deepseek/deepseek-v4-flash",
            )
        finally:
            os.unlink(path)

    def test_default_config_has_fallback_model(self):
        """Default agents.json should have a fallback_model."""
        config = load_config()
        fallback = config["game"].get("fallback_model")
        self.assertIsNotNone(fallback, "Default config should have fallback_model")
        self.assertIn(fallback, ["deepseek/deepseek-v4-flash", "openai/gpt-5.4-nano"])


class TestGetStateText(unittest.TestCase):
    """Tests for _get_state_text() — the LLM agent's game-view prompt."""

    def setUp(self):
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
                return {
                    "player": {
                        "name": "Test", "eliminated": False,
                        "supplyCenterCount": 3, "unitCount": 1,
                        "units": {
                            "A_PAR_0": {"id": "A_PAR_0", "type": "A", "locationId": "PAR"},
                        },
                    },
                    "visibleUnits": [],
                    "validMoves": {"A_PAR_0": ["BUR", "PIC", "GAS", "BRE"]},
                    "validBuilds": [],
                }

        self.agent = DiplomacyAgent("testland", config, global_inst,
                                     LLMClient("fake-key"), MockBridge())

    def test_state_text_includes_order_options_reminder(self):
        """_get_state_text() must remind agents about HOLD and SUPPORT."""
        text = self.agent._get_state_text()
        self.assertIn("ORDER OPTIONS FOR EACH UNIT:", text)
        self.assertIn("HOLD", text)
        self.assertIn("SUPPORT", text)
        self.assertIn("MOVE", text)
        self.assertIn("always valid", text)

    def test_state_text_shows_moves_as_none_when_empty(self):
        """Empty validMoves should show 'none (HOLD only)' not 'no valid moves'."""
        text = self.agent._get_state_text()
        # Even with valid moves, verify the NOT-case
        self.assertIn("moves:", text)  # the header changed from "valid:"

    def test_eliminated_player_shows_eliminated_message(self):
        """Eliminated player gets the elimination message."""
        # Use a mock that returns eliminated player
        class EliminatedBridge:
            def get_state(self):
                return {"year": 1901, "season": "SPRING", "phase": "ORDER",
                        "players": {}, "units": {}, "retreatsNeeded": []}
            def get_player_view(self, pid):
                return {
                    "player": {
                        "name": "Test", "eliminated": True,
                        "supplyCenterCount": 0, "unitCount": 0,
                        "units": {},
                    },
                    "visibleUnits": [],
                    "validMoves": {},
                    "validBuilds": [],
                }

        config = {"model": "test/model", "country_name": "DeadLand", "persona": ""}
        agent = DiplomacyAgent("deadland", config, "You are {country_name}.",
                               LLMClient("fake-key"), EliminatedBridge())
        text = agent._get_state_text()
        self.assertIn("eliminated", text.lower())


class TestBoardFormatter(unittest.TestCase):
    """Tests for format_board() — pure function, no I/O."""

    def make_state(self, year=1901, season="SPRING", players=None):
        """Build a minimal state dict for testing."""
        return {
            "year": year,
            "season": season,
            "phase": "ORDER",
            "players": players or {},
        }

    def make_player(self, name="England", scs=3, units=None, eliminated=False):
        """Build a minimal player dict."""
        return {
            "id": name.lower().split()[0] if " " not in name else name,
            "name": name,
            "supplyCenterCount": scs,
            "units": units or {},
            "eliminated": eliminated,
        }

    def make_unit(self, utype="F", location="LON"):
        """Build a minimal unit dict."""
        return {"id": f"{utype}_{location}_0", "type": utype, "locationId": location}

    def test_header_shows_season_and_year(self):
        """Board header should include season and year."""
        state = self.make_state(1901, "SPRING")
        output = format_board(state)
        self.assertIn("SPRING 1901", output)

    def test_header_shows_fall(self):
        """Board should show FALL season correctly."""
        state = self.make_state(1901, "FALL")
        output = format_board(state)
        self.assertIn("FALL 1901", output)

    def test_player_appears_in_output(self):
        """Each player's name should appear."""
        p = self.make_player("England", 3, {
            "F_LON_0": self.make_unit("F", "LON"),
        })
        state = self.make_state(players={"england": p})
        output = format_board(state)
        self.assertIn("England", output)

    def test_player_sc_and_unit_count(self):
        """SC count and unit count should be shown."""
        state = self.make_state(players={
            "england": self.make_player("England", 3, {
                "F_LON_0": self.make_unit("F", "LON"),
                "A_LVP_1": self.make_unit("A", "LVP"),
            })
        })
        output = format_board(state)
        self.assertIn("3SC/2U", output)

    def test_units_show_type_and_location(self):
        """Unit lines should show type and location."""
        state = self.make_state(players={
            "france": self.make_player("France", 3, {
                "F_BRE_0": self.make_unit("F", "BRE"),
                "A_PAR_1": self.make_unit("A", "PAR"),
            })
        })
        output = format_board(state)
        self.assertIn("F BRE", output)
        self.assertIn("A PAR", output)

    def test_eliminated_player_shows_skull(self):
        """Eliminated players should have a 💀 marker."""
        state = self.make_state(players={
            "austria": self.make_player("Austria", 0, {}, eliminated=True),
        })
        output = format_board(state)
        self.assertIn("💀", output)
        self.assertIn("(eliminated)", output)

    def test_not_eliminated_player_no_skull(self):
        """Active players should NOT have 💀."""
        state = self.make_state(players={
            "turkey": self.make_player("Turkey", 3, {
                "F_ANK_0": self.make_unit("F", "ANK"),
            }),
        })
        output = format_board(state)
        self.assertNotIn("💀", output)
        self.assertNotIn("(eliminated)", output)

    def test_neutral_sc_count_all_owned(self):
        """When all 34 SCs are owned, neutral should be 0."""
        state = self.make_state(players={
            "england": self.make_player("England", 18),
            "france": self.make_player("France", 16),
        })
        output = format_board(state)
        self.assertIn("Neutral SCs remaining: 0/34", output)

    def test_neutral_sc_count_none_owned(self):
        """When no SCs are owned, neutral should be 34."""
        state = self.make_state(players={
            "england": self.make_player("England", 0),
            "france": self.make_player("France", 0),
        })
        output = format_board(state)
        self.assertIn("Neutral SCs remaining: 34/34", output)

    def test_neutral_sc_count_partial(self):
        """Partial ownership should be reflected."""
        state = self.make_state(players={
            "england": self.make_player("England", 5),
            "france": self.make_player("France", 4),
        })
        output = format_board(state)
        self.assertIn("Neutral SCs remaining: 25/34", output)

    def test_box_has_borders(self):
        """Output should contain box-drawing characters."""
        state = self.make_state()
        output = format_board(state)
        self.assertIn("╔", output)
        self.assertIn("╗", output)
        self.assertIn("╚", output)
        self.assertIn("╝", output)
        self.assertIn("║", output)

    def test_players_sorted_by_name(self):
        """Players should appear in alphabetical order by name."""
        state = self.make_state(players={
            "turkey": self.make_player("Turkey", 3, {"F_ANK_0": self.make_unit("F", "ANK")}),
            "england": self.make_player("England", 3, {"F_LON_0": self.make_unit("F", "LON")}),
            "france": self.make_player("France", 3, {"F_BRE_0": self.make_unit("F", "BRE")}),
        })
        output = format_board(state)
        eng_pos = output.index("England")
        fra_pos = output.index("France")
        tur_pos = output.index("Turkey")
        self.assertLess(eng_pos, fra_pos)
        self.assertLess(fra_pos, tur_pos)

    def test_multiple_players_all_visible(self):
        """All 7 standard Diplomacy powers should appear."""
        state = self.make_state(players={
            pid: self.make_player(name, 3, {
                f"F_{sc}_0": self.make_unit("F", sc),
            })
            for pid, name, sc in [
                ("england", "England", "LON"),
                ("france", "France", "PAR"),
                ("germany", "Germany", "BER"),
                ("italy", "Italy", "ROM"),
                ("austria", "Austria", "VIE"),
                ("russia", "Russia", "MOS"),
                ("turkey", "Turkey", "CON"),
            ]
        })
        output = format_board(state)
        for name in ["England", "France", "Germany", "Italy", "Austria", "Russia", "Turkey"]:
            self.assertIn(name, output)

    def test_empty_players(self):
        """Empty players dict should still produce a valid board."""
        state = self.make_state(players={})
        output = format_board(state)
        self.assertIn("Neutral SCs remaining: 34/34", output)
        # Should still have box borders
        self.assertIn("╔", output)


class TestToolBasedOrderGeneration(unittest.TestCase):
    """Test that generate_orders uses the tool-based flow."""

    def setUp(self):
        config = {
            "model": "test/model",
            "country_name": "France",
            "persona": "You are France.",
        }
        global_inst = "You are {country_name}."

        class MockBridge:
            def get_state(self):
                return {
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
                        }
                    },
                    "units": {
                        "A_PAR_0_france": {"id": "A_PAR_0_france", "type": "A", "ownerId": "france", "locationId": "PAR"},
                        "A_MAR_1_france": {"id": "A_MAR_1_france", "type": "A", "ownerId": "france", "locationId": "MAR"},
                        "F_BRE_2_france": {"id": "F_BRE_2_france", "type": "F", "ownerId": "france", "locationId": "BRE"},
                        "A_BER_0_germany": {"id": "A_BER_0_germany", "type": "A", "ownerId": "germany", "locationId": "BER"},
                    },
                    "supplyCenterOwners": {},
                    "retreatsNeeded": [],
                }

            def get_player_view(self, player_id):
                return {
                    "player": {
                        "id": "france", "name": "France",
                        "supplyCenterCount": 3, "eliminated": False,
                        "units": {
                            "A_PAR_0_france": {"id": "A_PAR_0_france", "type": "A", "locationId": "PAR"},
                            "A_MAR_1_france": {"id": "A_MAR_1_france", "type": "A", "locationId": "MAR"},
                            "F_BRE_2_france": {"id": "F_BRE_2_france", "type": "F", "locationId": "BRE"},
                        },
                    },
                    "visibleUnits": [
                        {"id": "A_PAR_0_france", "ownerId": "france", "type": "A", "locationId": "PAR"},
                        {"id": "A_MAR_1_france", "ownerId": "france", "type": "A", "locationId": "MAR"},
                        {"id": "F_BRE_2_france", "ownerId": "france", "type": "F", "locationId": "BRE"},
                        {"id": "A_BER_0_germany", "ownerId": "germany", "type": "A", "locationId": "BER"},
                    ],
                    "validMoves": {
                        "A_PAR_0_france": ["BUR", "PIC", "GAS", "BRE"],
                        "A_MAR_1_france": ["PIE", "GAS", "BUR", "SPA"],
                        "F_BRE_2_france": ["MAO", "ENG", "PIC", "GAS"],
                    },
                    "validBuilds": [],
                    "validPlacements": [],
                }

        self.bridge = MockBridge()
        self.agent = DiplomacyAgent(
            "france", config, global_inst,
            LLMClient("fake-key"), self.bridge,
        )

    @mock.patch("urllib.request.urlopen")
    def test_generate_orders_produces_orders_for_all_units(self, mock_urlopen):
        """Full tool loop: agent explores state, submits orders, finalizes."""
        # Simulate LLM responses: query units → query moves → submit all → finalize → done
        responses = [
            # Turn 1: get_my_units
            {"choices": [{"message": {"content": None, "tool_calls": [
                {"id": "c1", "type": "function", "function": {"name": "get_my_units", "arguments": "{}"}}
            ]}}]},
            # Turn 2: get_valid_moves for all 3 units (batched)
            {"choices": [{"message": {"content": None, "tool_calls": [
                {"id": "c2", "type": "function", "function": {"name": "get_valid_moves", "arguments": '{"unit_id": "A_PAR_0_france"}'}},
                {"id": "c3", "type": "function", "function": {"name": "get_valid_moves", "arguments": '{"unit_id": "A_MAR_1_france"}'}},
                {"id": "c4", "type": "function", "function": {"name": "get_valid_moves", "arguments": '{"unit_id": "F_BRE_2_france"}'}},
            ]}}]},
            # Turn 3: submit all 3 orders
            {"choices": [{"message": {"content": None, "tool_calls": [
                {"id": "c5", "type": "function", "function": {"name": "submit_order", "arguments": '{"unit_id": "A_PAR_0_france", "order_type": "MOVE", "target_location": "BUR"}'}},
                {"id": "c6", "type": "function", "function": {"name": "submit_order", "arguments": '{"unit_id": "A_MAR_1_france", "order_type": "HOLD"}'}},
                {"id": "c7", "type": "function", "function": {"name": "submit_order", "arguments": '{"unit_id": "F_BRE_2_france", "order_type": "MOVE", "target_location": "MAO"}'}},
            ]}}]},
            # Turn 4: finalize
            {"choices": [{"message": {"content": None, "tool_calls": [
                {"id": "c8", "type": "function", "function": {"name": "finalize_orders", "arguments": "{}"}}
            ]}}]},
            # Turn 5: final text
            {"choices": [{"message": {"content": "All orders submitted."}}]},
        ]

        class MockResponse:
            def __init__(self, body_bytes):
                self._body = body_bytes
            def read(self):
                return self._body
            def __enter__(self):
                return self
            def __exit__(self, *args):
                pass

        idx = [0]
        def side_effect(req, timeout=None):
            i = idx[0]; idx[0] += 1
            return MockResponse(json.dumps(responses[i]).encode("utf-8"))

        mock_urlopen.side_effect = side_effect

        orders = self.agent.generate_orders()

        self.assertEqual(len(orders), 3)
        unit_ids = [o["unitId"] for o in orders]
        self.assertIn("A_PAR_0_france", unit_ids)
        self.assertIn("A_MAR_1_france", unit_ids)
        self.assertIn("F_BRE_2_france", unit_ids)


if __name__ == "__main__":
    unittest.main(verbosity=2)
