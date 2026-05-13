# Cross-Turn Summary Log Implementation Plan

> **For Hermes:** Use TDD — write failing tests first, then implement. Run `python3 -m unittest __tests__.test_summary -v` after each task.

**Goal:** Give each Diplomacy agent persistent memory across turns via a structured JSON summary, so agents don't need to re-read full negotiation histories.

**Architecture:** New `SummaryManager` class handles JSON file I/O and LLM-driven summary generation. Orchestrator triggers parallel summary generation after resolution, injects summaries into negotiation and order generation contexts. Files live in `ai-orchestrator/summaries/{country}.json`, wiped at game start.

**Tech Stack:** Python stdlib (json, threading, pathlib, urllib), existing LLMClient + EngineBridge

---

### Task 1: Create SummaryManager class skeleton

**Objective:** Define SummaryManager with file I/O methods (load, save, delete).

**Files:**
- Create: `ai-orchestrator/summary_manager.py`
- Create: `ai-orchestrator/__tests__/test_summary.py`

**Step 1: Write failing test**

```python
#!/usr/bin/env python3
"""Tests for SummaryManager — cross-turn summary persistence."""
import json
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from summary_manager import SummaryManager, SUMMARY_SCHEMA


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
                {"country": "germany", "status": "active", "since_turn": "Spring 1901",
                 "notes": "Mutual defense pact"}
            ],
            "deals": [],
            "betrayals": [],
            "long_term_plan": "Expand into Scandinavia",
            "turn_history": [
                {"turn": "Spring 1901", "summary": "Opened F NTH, A YOR. Germany proposed alliance."}
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
        self.mgr.save("italy", {"country": "italy", "last_updated": ""})
        self.mgr.delete("italy")
        self.assertIsNone(self.mgr.load("italy"))

    def test_wipe_all_removes_every_country(self):
        """Wipe should clear all summary files at once."""
        for country in ["england", "france", "germany"]:
            self.mgr.save(country, {"country": country, "last_updated": ""})
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
```

**Step 2: Run test to verify failure**
```bash
cd ai-orchestrator && python3 -m unittest __tests__.test_summary.TestSummaryFileIO -v
```
Expected: ImportError (module doesn't exist yet)

**Step 3: Write minimal SummaryManager**

Create `ai-orchestrator/summary_manager.py`:

```python
"""Summary persistence for Diplomacy AI agents — cross-turn memory."""
import json
import os
from pathlib import Path


# Schema version — bump if format changes
SUMMARY_SCHEMA = "1.0"


class SummaryManager:
    """Manages per-country summary JSON files on disk.
    
    Each country gets one file: summaries/{country}.json
    Wiped at game start, updated after each turn's resolution.
    """
    
    DEFAULT_MAX_TURN_HISTORY = 8
    
    def __init__(self, summaries_dir: str):
        self.dir = Path(summaries_dir)
        self.dir.mkdir(parents=True, exist_ok=True)
    
    def _path(self, country: str) -> Path:
        return self.dir / f"{country}.json"
    
    def load(self, country: str) -> dict | None:
        """Load a country's summary. Returns None if no file exists."""
        path = self._path(country)
        if not path.exists():
            return None
        with open(path) as f:
            return json.load(f)
    
    def save(self, country: str, summary: dict):
        """Save a country's summary to disk. Caps turn_history."""
        summary = self._cap_turn_history(summary)
        with open(self._path(country), "w") as f:
            json.dump(summary, f, indent=2)
    
    def delete(self, country: str):
        """Remove one country's summary file."""
        path = self._path(country)
        if path.exists():
            path.unlink()
    
    def wipe_all(self):
        """Remove ALL summary files (called at game start)."""
        for path in self.dir.glob("*.json"):
            path.unlink()
    
    def _cap_turn_history(self, summary: dict, max_turns: int = None) -> dict:
        """Truncate turn_history to at most max_turns, keeping most recent."""
        if max_turns is None:
            max_turns = self.DEFAULT_MAX_TURN_HISTORY
        history = summary.get("turn_history", [])
        if len(history) > max_turns:
            summary["turn_history"] = history[-max_turns:]
        return summary
```

**Step 4: Run tests to verify pass**
```bash
cd ai-orchestrator && python3 -m unittest __tests__.test_summary.TestSummaryFileIO -v
```
Expected: 5 tests pass

**Step 5: Commit**
```bash
git add ai-orchestrator/summary_manager.py ai-orchestrator/__tests__/test_summary.py
git commit -m "feat: add SummaryManager with file I/O and turn history capping"
```

---

### Task 2: Add summary format validation

**Objective:** Validate loaded JSON matches expected schema so corrupted files don't crash the orchestrator.

**Files:**
- Modify: `ai-orchestrator/summary_manager.py`
- Modify: `ai-orchestrator/__tests__/test_summary.py`

**Step 1: Write failing test**

```python
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

    REQUIRED_FIELDS = {
        "country": str,
        "last_updated": str,
        "alliances": list,
        "deals": list,
        "betrayals": list,
        "long_term_plan": str,
        "turn_history": list,
    }
```

Add `validate()` method to SummaryManager:

```python
REQUIRED_FIELDS = {
    "country": str,
    "last_updated": str,
    "alliances": list,
    "deals": list,
    "betrayals": list,
    "long_term_plan": str,
    "turn_history": list,
}

def validate(self, summary: dict) -> bool:
    """Check that a summary dict has all required fields with correct types."""
    if not isinstance(summary, dict):
        return False
    for field, expected_type in self.REQUIRED_FIELDS.items():
        if field not in summary:
            return False
        if not isinstance(summary[field], expected_type):
            return False
    return True
```

Update `save()` to validate before writing, and `load()` to validate after reading.

**Step 2: Run test to verify failure**
```bash
cd ai-orchestrator && python3 -m unittest __tests__.test_summary.TestSummaryValidation -v
```

**Step 3: Implement validation**

**Step 4: Run tests to verify pass**

**Step 5: Commit**

---

### Task 3: Add summary generation via LLM

**Objective:** `SummaryManager.generate_summary()` calls the LLM to produce an updated summary from the current turn's context.

**Files:**
- Modify: `ai-orchestrator/summary_manager.py`
- Modify: `ai-orchestrator/__tests__/test_summary.py`

**Step 1: Write failing test**

```python
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
        
        class MockResponse:
            def __init__(self, body_bytes):
                self._body = body_bytes
            def read(self):
                return self._body
            def __enter__(self):
                return self
            def __exit__(self, *args):
                pass

        mock_urlopen.return_value = MockResponse(
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
        """When previous_summary exists, new turn should be appended to turn_history."""
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
        
        class MockResponse:
            def __init__(self, body_bytes):
                self._body = body_bytes
            def read(self):
                return self._body
            def __enter__(self):
                return self
            def __exit__(self, *args):
                pass

        mock_urlopen.return_value = MockResponse(
            json.dumps({
                "choices": [{"message": {"content": json.dumps(new_summary)}}]
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
            board_state="F NTH, A YOR",
            resolution_text="Took Norway.",
            chat_log="",
            previous_summary=previous,
        )
        
        self.assertEqual(len(result["turn_history"]), 2)
```

**Step 2: Run test to verify failure**

**Step 3: Implement `generate_summary()`**

The method builds a prompt, calls the LLM, parses the JSON response, and returns the updated summary. Key details:

```python
def generate_summary(self, llm, model, country, country_name, persona,
                     system_prompt, turn_label, board_state,
                     resolution_text, chat_log, previous_summary=None) -> dict | None:
    """Generate an updated summary for one country via LLM."""
    
    previous_json = ""
    if previous_summary:
        previous_json = json.dumps(previous_summary, indent=2)
    
    prompt = f"""You are {country_name}. Update your strategic summary after this turn's resolution.

YOUR PERSONA:
{persona}

CURRENT BOARD STATE:
{board_state}

THIS TURN'S RESOLUTION (what actually happened):
{resolution_text}

THIS TURN'S NEGOTIATION CHAT LOG:
{chat_log if chat_log else "(no messages this turn)"}

PREVIOUS SUMMARY (from prior turns):
{previous_json if previous_json else "(this is the first turn — no prior summary)"}

---

Produce an UPDATED summary in this exact JSON format:

{{
  "country": "{country}",
  "last_updated": "{turn_label} (after resolution)",
  "alliances": [
    {{"country": "...", "status": "active|broken|tentative",
      "since_turn": "...", "notes": "..."}}
  ],
  "deals": [
    {{"country": "...", "deal": "...", "my_part": "...",
      "turn_made": "...", "status": "pending|fulfilled|betrayed"}}
  ],
  "betrayals": [
    {{"country": "...", "incident": "...", "turn": "..."}}
  ],
  "long_term_plan": "2-3 sentence strategic vision",
  "turn_history": [
    {{"turn": "...", "summary": "1-2 sentence summary of that turn's key events"}}
  ]
}}

RULES:
- ALLIANCES: Record every active pact, tentative understanding, or broken alliance.
- DEALS: Record specific agreements (e.g., support coordination). Mark fulfilled if the other party did their part, betrayed if they didn't, pending if outcome is unknown.
- BETRAYALS: Record when another power breaks a deal or attacks unexpectedly.
- LONG_TERM_PLAN: Your current strategic vision. Be honest — this is private memory only you see.
- TURN_HISTORY: Append one new entry for this turn. Keep ALL prior entries from the previous summary — do not drop old history.

Respond with ONLY the JSON object — no markdown, no explanation."""

    response = llm.chat(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        system=system_prompt,
        temperature=0.5,
        max_tokens=2000,
    )
    
    if not response:
        return None
    
    # Parse JSON from response
    summary = self._parse_json_response(response)
    if summary:
        return self._cap_turn_history(summary)
    return None

def _parse_json_response(self, text: str) -> dict | None:
    """Extract a JSON object from LLM response text."""
    import re
    if not text:
        return None
    text = text.strip()
    # Strip markdown code fences
    for prefix in ["```json", "```"]:
        if text.startswith(prefix):
            text = text[len(prefix):]
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()
            break
    # Find JSON object
    start = text.find("{")
    end = text.rfind("}")
    if start >= 0 and end > start:
        try:
            parsed = json.loads(text[start:end+1])
            if isinstance(parsed, dict):
                return parsed
        except json.JSONDecodeError:
            pass
    return None
```

Note: `generate_summary` takes a `fallback_model` parameter too (from game config). Add it.

**Step 4: Run tests to verify pass**

**Step 5: Commit**

---

### Task 4: Integrate SummaryManager into Orchestrator

**Objective:** Wire SummaryManager into the Orchestrator: wipe at game start, generate after resolution, inject into contexts.

**Files:**
- Modify: `ai-orchestrator/orchestrator.py`

**Step 1: Add SummaryManager to Orchestrator.__init__**

```python
from summary_manager import SummaryManager

class Orchestrator:
    def __init__(self, config, api_key):
        # ... existing init ...
        self.summaries = SummaryManager(str(SCRIPT_DIR / "summaries"))
        self.summaries.wipe_all()  # Clean start
```

**Step 2: Add method `_generate_summaries()` to Orchestrator**

```python
def _generate_summaries(self, state, result):
    """Generate post-resolution summaries for all non-eliminated agents in parallel."""
    season = state.get("season", "?")
    year = state.get("year", "?")
    turn_label = f"{season} {year}"
    
    resolution = result.get("result", {})
    resolution_text = self._format_resolution_for_summary(resolution)
    
    def summarize_one(agent):
        try:
            player = state.get("players", {}).get(agent.player_id, {})
            if player.get("eliminated"):
                return
            
            # Gather this turn's chat
            chat_log = self._get_agent_chat_log(agent.player_id)
            
            # Get board state
            board_state = agent._get_state_text()
            
            # Load previous summary
            previous = self.summaries.load(agent.player_id)
            
            summary = self.summaries.generate_summary(
                llm=self.llm,
                model=agent.model,
                country=agent.player_id,
                country_name=agent.country_name,
                persona=agent.persona,
                system_prompt=agent.system_prompt,
                turn_label=turn_label,
                board_state=board_state,
                resolution_text=resolution_text,
                chat_log=chat_log,
                previous_summary=previous,
                fallback_model=self.game_cfg.get("fallback_model"),
            )
            
            if summary:
                self.summaries.save(agent.player_id, summary)
                print(f"  📝 {agent.country_name}: summary updated", flush=True)
            else:
                print(f"  ⚠ {agent.country_name}: summary generation failed", flush=True)
        except Exception as e:
            print(f"  ⚠ {agent.country_name}: summary error: {e}", flush=True)
    
    # Run all in parallel threads with 120s timeout
    threads = []
    for agent in self.agents.values():
        t = threading.Thread(target=summarize_one, args=(agent,), daemon=True)
        t.start()
        threads.append(t)
    
    deadline = time.time() + 120  # 2 minutes
    for t in threads:
        remaining = deadline - time.time()
        if remaining > 0:
            t.join(timeout=remaining)
        if t.is_alive():
            print(f"  ⚠ Summary generation timed out for an agent", flush=True)
    
    print(f"  ✅ Summaries generated", flush=True)

def _format_resolution_for_summary(self, resolution: dict) -> str:
    """Convert resolution dict into a human-readable text block for the LLM."""
    parts = []
    moves = resolution.get("successfulMoves", [])
    bounced = resolution.get("bouncedMoves", [])
    dislodged = resolution.get("dislodgedUnits", [])
    destroyed = resolution.get("destroyedUnits", [])
    
    for m in moves:
        parts.append(f"  {m['unitId']}: moved from {m['fromLocationId']} → {m['toLocationId']}")
    for b in bounced:
        parts.append(f"  {b['unitId']}: bounced from {b['attemptedLocationId']}")
    for d in dislodged:
        parts.append(f"  {d['unitId']}: DISLODGED from {d['fromLocationId']}")
    for d in destroyed:
        parts.append(f"  {d}: DESTROYED")
    
    return "\n".join(parts) if parts else "(no changes)"

def _get_agent_chat_log(self, player_id: str) -> str:
    """Collect all chat messages visible to this player for the current turn."""
    try:
        channels = self.bridge.chat_get_channels(player_id)
        lines = []
        for ch in channels:
            msgs = self.bridge.chat_get_messages(ch["id"])
            for m in msgs:
                sender = m.get("senderName", m.get("senderId", "?"))
                content = m.get("content", "")[:200]
                ch_name = ch.get("name", ch.get("id", "?"))
                lines.append(f"[{ch_name} — {sender}]: {content}")
        return "\n".join(lines)
    except Exception:
        return "(chat log unavailable)"
```

**Step 3: Trigger summary generation after resolution**

In `_run_order_phase`, after `self._show_resolution(result)`, add:

```python
# Generate cross-turn summaries for all agents
self._generate_summaries(state, result)
```

Also trigger after BUILD phase resolution (in `_run_build_phase`, after `advance_builds`):

```python
# After BUILD phase, state is updated — generate summaries if this is a full turn
# (Build happens after Fall, which is the end of a game year)
state = self.bridge.get_state()
# Build phase results still matter for strategic memory
```

Actually, let me think about this more carefully. The BUILD phase already prints the board. Summaries should be generated after ORDER resolution (which includes retreats that happened inline). BUILD happens at the end of Fall years. So:

- After ORDER + RESOLUTION (in `_run_order_phase`): generate summaries
- After BUILD (in `_run_build_phase`): generate summaries again? Or skip?

The user said "after every turn." Let me generate after ORDER resolution always, and after BUILD phase too (since builds change the strategic picture). But to keep it simple, let's just generate after ORDER resolution for now.

**Step 4: Inject summary into negotiation context**

In `DiplomacyAgent.negotiate()`, the `_handle_messages()` and `_maybe_initiate()` methods need access to the summary. The Orchestrator should pass it in.

Simplest approach: Add a `current_summary_text` attribute to `DiplomacyAgent` that the Orchestrator sets before negotiation begins.

In Orchestrator._run_order_phase, before starting negotiation threads:

```python
# Load summaries for all agents
for pid, agent in self.agents.items():
    summary = self.summaries.load(pid)
    if summary:
        agent.current_summary_text = json.dumps(summary, indent=2)
    else:
        agent.current_summary_text = None
```

In `DiplomacyAgent.__init__`:

```python
self.current_summary_text = None  # Set by orchestrator before negotiation
```

In `_handle_messages` and `_maybe_initiate`, prepend the summary to the prompt:

```python
summary_block = ""
if self.current_summary_text:
    summary_block = f"""YOUR STRATEGIC MEMORY (summary of all prior turns):
{self.current_summary_text}

"""

prompt = f"""{summary_block}You are {self.country_name}. The negotiation channels available to you:
...
```

**Step 5: Inject summary into order generation**

In `DiplomacyAgent.generate_orders()`, add the summary to the prompt:

```python
summary_block = ""
if self.current_summary_text:
    summary_block = f"\n\nYOUR STRATEGIC MEMORY (summary of all prior turns):\n{self.current_summary_text}\n"

initial_prompt = f"""{state_text}
{summary_block}
Negotiation is over. Use the available tools to explore the board and submit your orders.
...
"""
```

---

### Task 5: Integration test

**Objective:** End-to-end test that a summary file is created, survives across simulated turns, and gets injected.

**Files:**
- Modify: `ai-orchestrator/__tests__/test_summary.py`

**Step 1: Write integration test**

```python
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
        # Simulate Turn 1
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
        # We can't easily instantiate Orchestrator, so test the static method style
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
        # Test that it doesn't crash
        text = Orchestrator._format_resolution_for_summary(None, resolution)
        self.assertIn("F_NTH", text)
        self.assertIn("NWY", text)
        self.assertIn("A_YOR", text)
        self.assertIn("BEL", text)
        self.assertIn("F_LON", text)
        self.assertIn("DESTROYED", text)
```

---

### Task 6: Commit and verify full suite

**Run all tests:**
```bash
cd ai-orchestrator && python3 -m unittest discover -s __tests__ -v
```

**Expected:** All existing tests pass, new summary tests pass.

---

## Summary of Changes

| File | Action | Purpose |
|------|--------|---------|
| `ai-orchestrator/summary_manager.py` | CREATE | SummaryManager class — I/O, validation, LLM generation |
| `ai-orchestrator/__tests__/test_summary.py` | CREATE | Tests for SummaryManager and integration |
| `ai-orchestrator/orchestrator.py` | MODIFY | Wire summaries into Orchestrator + agent contexts |
| `ai-orchestrator/summaries/` | CREATE | Directory for summary JSON files (gitignored) |

## Config Additions (agents.json)

Optional — can start with hardcoded defaults:

```json
{
  "game": {
    "summary_window_seconds": 120,
    "max_turn_history": 8,
    ...
  }
}
```

Default to 120s (2 min) and 8 turns if not present.
