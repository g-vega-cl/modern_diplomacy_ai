#!/usr/bin/env python3
"""Tests for LLMClient tool-calling support (chat_with_tools)."""
import json
import unittest
from unittest import mock
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from orchestrator import LLMClient


class TestLLMClientTools(unittest.TestCase):
    def test_chat_with_tools_dispatches_function_call_and_returns_result(self):
        """When the LLM responds with a tool_call, the client should dispatch it
        and continue the conversation until the LLM returns text."""
        client = LLMClient("fake-key")

        # Simulate: LLM calls tool, gets result, responds with text
        responses = [
            # First call: LLM requests tool call
            {"choices": [{"message": {
                "role": "assistant",
                "content": None,
                "tool_calls": [{
                    "id": "call_1",
                    "type": "function",
                    "function": {"name": "get_my_units", "arguments": "{}"}
                }]
            }}]},
            # Second call: LLM receives tool result, responds final
            {"choices": [{"message": {
                "role": "assistant",
                "content": "All units have orders. Finalizing."
            }}]}
        ]

        tools = [{
            "type": "function",
            "function": {
                "name": "get_my_units",
                "description": "Get my units",
                "parameters": {"type": "object", "properties": {}}
            }
        }]

        def tool_handler(tool_name, args):
            self.assertEqual(tool_name, "get_my_units")
            return {"units": [{"id": "A_PAR_0_france", "type": "A", "location": "PAR"}]}

        call_count = [0]
        request_bodies = []

        class MockResponse:
            def __init__(self, body_bytes):
                self._body = body_bytes
            def read(self):
                return self._body
            def __enter__(self):
                return self
            def __exit__(self, *args):
                pass

        def mock_urlopen(req, timeout=None):
            call_count[0] += 1
            body = req.data.decode("utf-8") if isinstance(req.data, bytes) else req.data
            request_bodies.append(json.loads(body))
            idx = call_count[0] - 1
            return MockResponse(json.dumps(responses[idx]).encode("utf-8"))

        with mock.patch("urllib.request.urlopen", mock_urlopen):
            result = client.chat_with_tools(
                model="test/model",
                messages=[{"role": "user", "content": "Submit orders."}],
                tools=tools,
                tool_handler=tool_handler,
                max_turns=5,
            )

        self.assertIn("Finalizing", result)
        self.assertEqual(call_count[0], 2)
        # Verify the first request included tools
        self.assertIn("tools", request_bodies[0])
        self.assertEqual(len(request_bodies[0]["tools"]), 1)

    def test_chat_with_tools_handles_multiple_tool_calls_in_one_turn(self):
        """Some models batch tool calls. All should be dispatched before continuing."""
        client = LLMClient("fake-key")

        responses = [
            {"choices": [{"message": {
                "content": None,
                "tool_calls": [
                    {"id": "c1", "type": "function", "function": {"name": "get_my_units", "arguments": "{}"}},
                    {"id": "c2", "type": "function", "function": {"name": "get_visible_units", "arguments": "{}"}},
                ]
            }}]},
            {"choices": [{"message": {"content": "Done."}}]}
        ]

        tools = [
            {"type": "function", "function": {"name": "get_my_units", "description": "", "parameters": {"type": "object", "properties": {}}}},
            {"type": "function", "function": {"name": "get_visible_units", "description": "", "parameters": {"type": "object", "properties": {}}}},
        ]

        calls = []
        def handler(name, args):
            calls.append(name)
            return {"result": name}

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
        def mock_urlopen(req, timeout=None):
            i = idx[0]; idx[0] += 1
            return MockResponse(json.dumps(responses[i]).encode("utf-8"))

        with mock.patch("urllib.request.urlopen", mock_urlopen):
            result = client.chat_with_tools(
                model="test/model",
                messages=[{"role": "user", "content": "go"}],
                tools=tools,
                tool_handler=handler,
                max_turns=5,
            )

        self.assertEqual(calls, ["get_my_units", "get_visible_units"])
        self.assertEqual(result, "Done.")
        self.assertEqual(idx[0], 2)  # two requests: tool call + final


if __name__ == "__main__":
    unittest.main()
