# Tool-Based Agent Order Submission — Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Replace text-prompt-to-JSON order generation with tool-calling — agents explore state and submit orders through validated tool calls, eliminating JSON parsing fragility.

**Architecture:** A new `AgentTools` class exposes the game state as OpenRouter-compatible function tools. `LLMClient` gains a `chat_with_tools()` loop. `DiplomacyAgent.generate_orders()` switches from one-shot text completion to an interactive tool loop. The engine bridge and engine itself are unchanged — tools validate at the Python layer, then submit to the bridge.

**Tech Stack:** Python 3.9+ (stdlib only, same as existing), OpenRouter tool-calling API (OpenAI-compatible), TypeScript game engine (unchanged)

**Key decision — validation layer:** Tools validate order correctness at call time (unit ownership, valid destinations, order counts). The engine bridge only sees validated orders. This means no new bridge methods are needed — tools buffer orders in memory and call `bridge.submitOrders()` once at finalization.

**Key decision — phased rollout:** Start with the ORDER phase only. Move placement, build, and retreat to tools in follow-up tasks once the pattern proves itself.

---

## Architecture Sketch

```
┌──────────────────────────────────────────────────────┐
│ Orchestrator._run_order_phase()                       │
│  ┌──────────────────────────────────────────────┐    │
│  │ DiplomacyAgent.run_order_tools()              │    │
│  │  ┌─────────────────────────────────────┐     │    │
│  │  │ LLMClient.chat_with_tools()          │     │    │
│  │  │  ┌──────────────────────────────┐   │     │    │
│  │  │  │ Tool loop:                   │   │     │    │
│  │  │  │  1. send tools+prompt        │   │     │    │
│  │  │  │  2. if tool_call → dispatch  │   │     │    │
│  │  │  │     → AgentTools.dispatch()  │   │     │    │
│  │  │  │  3. if text → done           │   │     │    │
│  │  │  └──────────────────────────────┘   │     │    │
│  │  └─────────────────────────────────────┘     │    │
│  │  AgentTools.get_orders() → list[Order]       │    │
│  └──────────────────────────────────────────────┘    │
│  bridge.submitOrders(pid, orders)                     │
└──────────────────────────────────────────────────────┘
```

### Tools exposed (ORDER phase)

| Tool | Purpose | Validation |
|------|---------|------------|
| `get_my_units` | List agent's units (id, type, location) | None |
| `get_valid_moves` | Valid move destinations per unit | Verifies unit belongs to agent |
| `get_visible_units` | All units on the board (owner, type, loc) | None |
| `get_supply_centers` | SC ownership: who controls what | None |
| `submit_order` | Submit one order for one unit | Validates unit ownership, move adjacency, order type |
| `cancel_order` | Remove a previously submitted order | Verifies order exists |
| `finalize_orders` | Signal completion | Checks all units have orders |

---

## Task 1: LLMClient — add tool-calling support (chat_with_tools)

**Objective:** Add `chat_with_tools()` to `LLMClient` that handles the multi-turn tool-calling loop.

**Files:**
- Modify: `ai-orchestrator/orchestrator.py` (LLMClient class)
- Create: `ai-orchestrator/__tests__/test_tool_client.py`

### Step 1a: Write failing test — single tool call

```python
# ai-orchestrator/__tests__/test_tool_client.py
import json
import unittest
from unittest import mock
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
        
        with mock.patch("urllib.request.urlopen") as mock_urlopen:
            # Set up sequential responses
            call_count = [0]
            def side_effect(req, timeout=None):
                idx = call_count[0]
                call_count[0] += 1
                body = json.dumps(responses[idx]).encode()
                mock_resp = mock.MagicMock()
                mock_resp.read.return_value = body
                mock_resp.__enter__.return_value = mock_resp
                return mock_resp
            mock_urlopen.side_effect = side_effect
            
            result = client.chat_with_tools(
                model="test/model",
                messages=[{"role": "user", "content": "Submit orders."}],
                tools=tools,
                tool_handler=tool_handler,
                max_turns=5,
            )
        
        self.assertIn("Finalizing", result)
        self.assertEqual(call_count[0], 2)
```

### Step 1b: Run test to verify failure

```bash
python3 -m pytest ai-orchestrator/__tests__/test_tool_client.py::TestLLMClientTools::test_chat_with_tools_dispatches_function_call_and_returns_result -v
```
Expected: FAIL — `AttributeError: 'LLMClient' object has no attribute 'chat_with_tools'`

### Step 1c: Write minimal implementation

Add to `LLMClient` class in `orchestrator.py`:

```python
def chat_with_tools(self, model: str, messages: list, tools: list,
                    tool_handler, system: str = None,
                    temperature: float = 0.3, max_tokens: int = 2000,
                    max_turns: int = 10) -> str:
    """Run a tool-calling conversation loop.
    
    Sends messages + tools to the LLM. When the LLM responds with
    tool_calls, dispatches to tool_handler and feeds results back.
    Continues until the LLM responds with text (no tool_calls) or
    max_turns is reached.
    
    Returns the final text response, or empty string on exhaustion.
    """
    turn = 0
    while turn < max_turns:
        turn += 1
        
        payload = {
            "model": model,
            "messages": messages,
            "tools": tools,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if system:
            payload["messages"] = [{"role": "system", "content": system}] + payload["messages"]
        
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(self.BASE, data=data, method="POST")
        req.add_header("Authorization", f"Bearer {self.api_key}")
        req.add_header("Content-Type", "application/json")
        req.add_header("HTTP-Referer", "https://github.com/diplomacy-ai")
        req.add_header("X-Title", "Diplomacy AI Orchestrator")
        
        with urllib.request.urlopen(req, timeout=120) as resp:
            result = json.loads(resp.read())
        
        if "error" in result:
            raise RuntimeError(f"OpenRouter error: {json.dumps(result['error'])}")
        
        msg = result["choices"][0]["message"]
        
        # Check for tool calls
        tool_calls = msg.get("tool_calls", [])
        if tool_calls:
            # Add assistant message with tool_calls to conversation
            messages.append({
                "role": "assistant",
                "content": msg.get("content"),
                "tool_calls": tool_calls,
            })
            
            # Dispatch each tool call and collect results
            for tc in tool_calls:
                fn = tc["function"]
                fn_name = fn["name"]
                try:
                    fn_args = json.loads(fn.get("arguments", "{}"))
                except json.JSONDecodeError:
                    fn_args = {}
                
                try:
                    fn_result = tool_handler(fn_name, fn_args)
                except Exception as e:
                    fn_result = {"error": str(e)}
                
                messages.append({
                    "role": "tool",
                    "tool_call_id": tc["id"],
                    "content": json.dumps(fn_result),
                })
            
            continue  # loop back for next LLM response
        
        # Text response — conversation complete
        content = msg.get("content", "")
        if content is None:
            content = ""
        return content
    
    return ""  # exhausted max_turns
```

### Step 1d: Run test to verify pass

```bash
python3 -m pytest ai-orchestrator/__tests__/test_tool_client.py::TestLLMClientTools::test_chat_with_tools_dispatches_function_call_and_returns_result -v
```
Expected: PASS

### Step 1e: Write test — multiple tool calls in one turn

```python
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
    
    with mock.patch("urllib.request.urlopen") as m:
        idx = [0]
        def side_effect(req, timeout=None):
            i = idx[0]; idx[0] += 1
            mr = mock.MagicMock()
            mr.read.return_value = json.dumps(responses[i]).encode()
            mr.__enter__.return_value = mr
            return mr
        m.side_effect = side_effect
        
        client.chat_with_tools("test", [{"role": "user", "content": "go"}], tools, handler)
    
    self.assertEqual(calls, ["get_my_units", "get_visible_units"])
```

### Step 1f: Verify, implement, commit

Run test, watch it pass (our implementation already handles multiple tool calls), verify all existing tests still pass, commit.

---

## Task 2: AgentTools class — tool dispatcher with validation

**Objective:** Create `AgentTools` that holds tool definitions, validates inputs, buffers orders, and bridges to the game engine.

**Files:**
- Create: `ai-orchestrator/agent_tools.py`
- Create: `ai-orchestrator/__tests__/test_agent_tools.py`

### Step 2a: Write failing test — get_my_units

```python
# ai-orchestrator/__tests__/test_agent_tools.py
import unittest
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
            },
            "units": {
                "A_PAR_0_france": {"id": "A_PAR_0_france", "type": "A", "ownerId": "france", "locationId": "PAR"},
                "A_MAR_1_france": {"id": "A_MAR_1_france", "type": "A", "ownerId": "france", "locationId": "MAR"},
                "F_BRE_2_france": {"id": "F_BRE_2_france", "type": "F", "ownerId": "france", "locationId": "BRE"},
                "A_BER_0_germany": {"id": "A_BER_0_germany", "type": "A", "ownerId": "germany", "locationId": "BER"},
                "F_KIE_1_germany": {"id": "F_KIE_1_germany", "type": "F", "ownerId": "germany", "locationId": "KIE"},
            },
            "supplyCenterOwners": {"PAR": "france", "MAR": "france", "BRE": "france", "BER": "germany", "KIE": "germany"},
            "retreatsNeeded": [],
        }
        self.valid_moves = {
            "A_PAR_0_france": ["BUR", "PIC", "GAS", "BRE"],
            "A_MAR_1_france": ["PIE", "GAS", "BUR", "SPA"],
            "F_BRE_2_france": ["MAO", "ENG", "PIC", "GAS"],
        }
        self.submitted_orders = []
        self.submitted_placements = []
    
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
```

### Step 2b: Run test to verify failure

```bash
python3 -m pytest ai-orchestrator/__tests__/test_agent_tools.py::TestAgentTools::test_get_my_units_returns_agent_units -v
```
Expected: FAIL — ModuleNotFoundError or AttributeError

### Step 2c: Write minimal AgentTools implementation

```python
# ai-orchestrator/agent_tools.py
"""Tool definitions and dispatcher for AI Diplomacy agents."""

import json

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
            "supports_possible": bool(moves) or True,  # HOLD support always possible
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
        
        # elif order_type == "HOLD": no extra validation needed
        
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
        return getattr(self, "_finalized", False)
```

### Step 2d: Run test to verify pass

```bash
python3 -m pytest ai-orchestrator/__tests__/test_agent_tools.py::TestAgentTools::test_get_my_units_returns_agent_units -v
```
Expected: PASS

### Step 2e: Write and implement remaining tool tests (RED → GREEN per test)

Test each tool in sequence:

- `test_get_valid_moves_returns_destinations` — calls dispatch("get_valid_moves", {"unit_id": "A_PAR_0_france"}), expects valid_moves array
- `test_get_valid_moves_rejects_enemy_unit` — calls dispatch with german unit, expects error
- `test_get_valid_moves_rejects_nonexistent_unit` — expects error
- `test_submit_order_hold_succeeds` — holds a unit, checks it appears in get_orders()
- `test_submit_order_move_validates_destination` — tries invalid move, expects error
- `test_submit_order_move_succeeds_with_valid_target` — moves to valid location
- `test_submit_order_support_requires_fields` — missing support fields, expects error
- `test_cancel_order_removes_pending` — submit then cancel, verify gone
- `test_finalize_fails_when_units_missing_orders` — finalize with un-ordered units
- `test_finalize_succeeds_when_all_units_have_orders` — all units ordered, finalize succeeds
- `test_get_visible_units_includes_all_powers` — verifies cross-power visibility
- `test_get_supply_centers_shows_ownership` — verifies SC ownership data

### Step 2f: Commit

---

## Task 3: DiplomacyAgent — replace generate_orders with tool loop

**Objective:** Modify `DiplomacyAgent.generate_orders()` to use `chat_with_tools()` + `AgentTools` instead of text prompt + JSON parsing.

**Files:**
- Modify: `ai-orchestrator/orchestrator.py` (DiplomacyAgent.generate_orders, plus imports)
- Modify: `ai-orchestrator/__tests__/test_orchestrator.py` (new tests for tool-based flow)

### Step 3a: Write failing test — generate_orders uses tools

```python
# In test_orchestrator.py, add to existing test classes or create new:

class TestToolBasedOrderGeneration(unittest.TestCase):
    """Test that generate_orders uses the tool-based flow."""
    
    def setUp(self):
        from orchestrator import DiplomacyAgent, LLMClient
        from agent_tools import AgentTools
        
        config = {
            "model": "test/model",
            "country_name": "France",
            "persona": "You are France.",
        }
        global_inst = "You are {country_name}."
        
        # Bridge that returns standard French units
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
                    "player": {"id": "france", "name": "France", "supplyCenterCount": 3, "eliminated": False,
                               "units": {
                                   "A_PAR_0_france": {"id": "A_PAR_0_france", "type": "A", "locationId": "PAR"},
                                   "A_MAR_1_france": {"id": "A_MAR_1_france", "type": "A", "locationId": "MAR"},
                                   "F_BRE_2_france": {"id": "F_BRE_2_france", "type": "F", "locationId": "BRE"},
                               }},
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
        from agent_tools import AgentTools
        
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
        
        idx = [0]
        def side_effect(req, timeout=None):
            i = idx[0]; idx[0] += 1
            mr = mock.MagicMock()
            mr.read.return_value = json.dumps(responses[i]).encode()
            mr.__enter__.return_value = mr
            return mr
        mock_urlopen.side_effect = side_effect
        
        orders = self.agent.generate_orders()
        
        self.assertEqual(len(orders), 3)
        unit_ids = [o["unitId"] for o in orders]
        self.assertIn("A_PAR_0_france", unit_ids)
        self.assertIn("A_MAR_1_france", unit_ids)
        self.assertIn("F_BRE_2_france", unit_ids)
```

### Step 3b: Run to verify failure

```bash
python3 -m pytest ai-orchestrator/__tests__/test_orchestrator.py::TestToolBasedOrderGeneration::test_generate_orders_produces_orders_for_all_units -v
```
Expected: FAIL (old generate_orders doesn't use tools)

### Step 3c: Implement new generate_orders

```python
# In DiplomacyAgent class, replace generate_orders:

def generate_orders(self) -> list:
    """Use the tool-based flow to generate orders."""
    from agent_tools import AgentTools
    
    tools = AgentTools(self.player_id, self.bridge)
    
    state_text = self._get_state_text()
    
    initial_prompt = f"""{state_text}

Negotiation is over. Use the available tools to explore the board and submit your orders.
For each of your units, call get_valid_moves to see where it can go, then call submit_order.
When all units have orders, call finalize_orders.

Strategic notes:
- MOVE only to valid destinations returned by get_valid_moves
- HOLD is always valid — use it to defend or when no good move exists
- SUPPORT a friendly unit's MOVE or HOLD to increase its strength
- For fleet moves to Spain/StP/Bulgaria, you must specify the exact coast"""

    result = self.llm.chat_with_tools(
        model=self.model,
        messages=[{"role": "user", "content": initial_prompt}],
        tools=AgentTools.definitions(),
        tool_handler=tools.dispatch,
        system=self.system_prompt,
        temperature=0.3,
        max_tokens=1000,
        max_turns=20,
        fallback_model=self.fallback_model,
    )
    
    orders = tools.get_orders()
    
    if not orders:
        # Fallback: if tool loop produced nothing, HOLD all units
        state = self.bridge.get_state()
        player = state.get("players", {}).get(self.player_id, {})
        units = player.get("units", {})
        if units:
            orders = [{"unitId": uid, "type": "HOLD"} for uid in units]
    
    return orders
```

### Step 3d: Also update LLMClient.chat_with_tools to support fallback_model

Add fallback support to the tool loop: if the primary model returns empty content with no tool_calls, retry with fallback. This matches existing behavior.

### Step 3e: Verify all tests pass

```bash
python3 -m pytest ai-orchestrator/__tests__/ -v
```
Expected: all existing + new tests pass.

### Step 3f: Commit

---

## Task 4: Orchestrator — adapt _run_order_phase for tool-based flow

**Objective:** The orchestrator no longer needs to call `_parse_json`, retry, or fallback for orders. The tool loop handles validation internally.

**Files:**
- Modify: `ai-orchestrator/orchestrator.py` (Orchestrator._run_order_phase)

### Step 4a: The change is minimal

The existing `_run_order_phase` already calls `agent.generate_orders()`. Since we replaced that method, the orchestrator code mostly stays the same. The key simplification: remove the fallback HOLD logic from `_run_order_phase` because `generate_orders` now handles its own fallback.

Before (current `_run_order_phase`, lines 918-946):
```python
orders = agent.generate_orders()
if orders:
    self.bridge.submit_orders(pid, orders)
    # ... print orders ...
else:
    print(f"  ⚠ {agent.country_name}: fallback HOLD")
    hold_orders = [{"unitId": uid, "type": "HOLD"} for uid in units]
    self.bridge.submit_orders(pid, hold_orders)
```

After:
```python
orders = agent.generate_orders()
# generate_orders() now always returns a valid list (HOLD fallback built-in)
self.bridge.submit_orders(pid, orders)
# ... print orders ...
```

### Step 4b: Verify existing tests still pass

```bash
pnpm test
python3 -m pytest ai-orchestrator/__tests__/ -v
```

### Step 4c: Commit

---

## Task 5: Integration — run a full tool loop against a real LLM

**Objective:** Verify the tool loop works end-to-end with a real OpenRouter model.

**Files:**
- Create: `ai-orchestrator/__tests__/test_tool_integration.py` (manual, needs API key)

### Step 5a: Write integration smoke test

```python
# ai-orchestrator/__tests__/test_tool_integration.py
"""Integration test: runs the tool loop against a real LLM via OpenRouter.
Requires OPENROUTER_API_KEY. Skips if not set."""

import os
import unittest
from orchestrator import LLMClient

@unittest.skipIf(not os.environ.get("OPENROUTER_API_KEY"), "No API key")
class TestToolIntegration(unittest.TestCase):
    def test_llm_responds_to_tool_calls(self):
        """OpenRouter model should call get_my_units and respond to result."""
        client = LLMClient(os.environ["OPENROUTER_API_KEY"])
        
        tools = [{
            "type": "function",
            "function": {
                "name": "get_my_units",
                "description": "Get your units",
                "parameters": {"type": "object", "properties": {}}
            }
        }]
        
        def handler(name, args):
            return {"units": [
                {"id": "A_PAR", "type": "A", "location": "PAR"},
                {"id": "F_BRE", "type": "F", "location": "BRE"},
            ], "count": 2}
        
        result = client.chat_with_tools(
            model="deepseek/deepseek-v4-flash",
            messages=[{"role": "user", "content": "You are France. Use tools to see your units and tell me how many you have."}],
            tools=tools,
            tool_handler=handler,
            max_turns=5,
        )
        
        self.assertIn("2", result)  # should mention unit count
```

### Step 5b: Run manually

```bash
OPENROUTER_API_KEY=sk-or-v1-... python3 -m pytest ai-orchestrator/__tests__/test_tool_integration.py -v -s
```

### Step 5c: Commit

---

## Risks and Tradeoffs

| Risk | Mitigation |
|------|-----------|
| Some flash models don't support tool calling | Keep `fallback_model` (gpt-5.4-nano) in the tool loop; fallback model definitely supports tools |
| Tool loop runs many turns → cost | Max 20 turns, flash models are cheap. Current approach already makes 2 calls (primary + retry) |
| Agent calls tools in an infinite loop | `max_turns=20` hard limit; if exhausted, fallback HOLD |
| Tool schema changes over time | Tool definitions are versioned in code alongside implementations |
| Negotiation phase still text-based | Keep current negotiation as-is; tool-ify it in a follow-up PR |

## Follow-up Tasks (not in this plan)

1. **Tool-ify placement phase** — Agents use `get_valid_placements` + `submit_placement` + `finalize_placements`
2. **Tool-ify build phase** — Agents use `get_build_options` + `submit_build` + `finalize_builds`
3. **Tool-ify retreat phase** — Agents use `get_retreat_options` + `submit_retreat`
4. **Tool-ify negotiation** — Agents use `get_channels` + `get_messages` + `send_message`
5. **Remove dead code** — Once all phases use tools, remove `_parse_json`, `_sanitize_chat_message`, retry loops, JSON prompt templates
6. **Remove `_get_state_text`** — No longer needed once full state is queryable via tools
