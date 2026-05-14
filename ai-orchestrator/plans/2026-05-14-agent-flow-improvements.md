# Agent Flow Improvements Implementation Plan

> **For Hermes:** Implement these three features in `orchestrator.py`. All changes
> are additive — no existing logic is removed or restructured.

**Goal:** Three quality-of-life improvements: verbal order reasoning, clearer chat
channel display, and single-agent move conflict detection with auto-retry.

**Architecture:** All changes live in the Python orchestrator. No bridge or engine
changes needed. Idea 3's audit runs in orchestrator before submitting orders to
the bridge. One new pure function (`audit_orders`), one new agent method
(`generate_order_reasoning`), and terminal display enhancements.

**Tech Stack:** Python 3.9+ stdlib (no new dependencies)

---

## Task 1: Verbal Order Reasoning

**Objective:** After an agent generates orders, have it explain its strategic intent
in 1-2 sentences. Print this to the terminal so the human operator understands
what each power is trying to do.

**Files:**
- Modify: `ai-orchestrator/orchestrator.py` (add method to DiplomacyAgent, call it in Orchestrator._run_order_phase)

**Step 1: Add `generate_order_reasoning` method to `DiplomacyAgent`**

Insert after the `generate_orders` method (after line 511). The method takes the
orders list and returns a reasoning string:

```python
    def generate_order_reasoning(self, orders: list) -> str:
        """Ask the LLM to explain its order choices in 1-2 sentences."""
        if not orders:
            return ""

        # Build a readable summary of orders
        state = self.bridge.get_state()
        units = state.get("units", {})
        order_lines = []
        for o in orders:
            uid = o.get("unitId", "?")
            otype = o.get("type", "?")
            unit = units.get(uid, {})
            loc = unit.get("locationId", "?")
            if otype == "MOVE":
                tgt = o.get("targetLocationId", "?")
                order_lines.append(f"  {uid} at {loc}: MOVE → {tgt}")
            elif otype == "SUPPORT":
                sup_u = o.get("supportUnitId", "?")
                sup_ot = o.get("supportOrderType", "?")
                sup_tgt = o.get("supportTargetLocationId", "")
                if sup_ot == "MOVE" and sup_tgt:
                    order_lines.append(f"  {uid} at {loc}: SUPPORT {sup_u} MOVE → {sup_tgt}")
                else:
                    order_lines.append(f"  {uid} at {loc}: SUPPORT {sup_u} {sup_ot}")
            else:
                order_lines.append(f"  {uid} at {loc}: {otype}")

        prompt = f"""You are {self.country_name}. You just submitted these orders:

{chr(10).join(order_lines)}

In EXACTLY 1-2 sentences, briefly explain your strategic intent for this turn.
What are you trying to accomplish? Be direct and in-character.

Your response must be ONLY the explanation text. No JSON, no reasoning tags."""

        response = self.llm.chat(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            system=self.system_prompt,
            temperature=0.5,
            max_tokens=100,
            fallback_model=self.fallback_model,
        )
        if response:
            return response.strip()
        return ""
```

**Step 2: Call `generate_order_reasoning` in `_run_order_phase`**

After `orders = agent.generate_orders()` and the conflict audit, generate reasoning,
then feed it into the self-review loop BEFORE calling `self.bridge.submit_orders`:

```python
                # --- Self-Review: show agent its intent BEFORE locking in orders ---
                reasoning = agent.generate_order_reasoning(orders)
                if reasoning:
                    print(f"  🧠 {agent.country_name} intent: {reasoning}", flush=True)

                orders = agent.self_review_orders(orders, reasoning)

                self.bridge.submit_orders(pid, orders)
```

**Verification:** Run the orchestrator for one turn and confirm:
- After each agent generates orders, a 🧠 intent line appears
- The agent self-reviews and may revise before orders are locked in
- Orders still submit and resolve correctly

---

## Task 2: Clearer Channel Names in Terminal Display

**Objective:** When agents send chat messages, always show which channel they're
posting in (with the friendly name, not raw ID). Also improve the channel list
shown to agents during initiation.

**Files:**
- Modify: `ai-orchestrator/orchestrator.py` (two print statements, one prompt)

**Step 1: Fix `_handle_messages` terminal output to show channel name**

Line 747 currently:
```python
            print(f"  💬 {self.country_name}: \"{short}...\"", flush=True)
```

Change to include channel name. The channel is `recent[-1][0]` which is a dict
with `id` and `name`:
```python
            ch = recent[-1][0] if recent else {"name": "?", "id": "?"}
            ch_name = ch.get("name", ch.get("id", "?"))
            print(f"  💬 {self.country_name} [{ch_name}]: \"{short}...\"", flush=True)
```

**Step 2: Fix `_maybe_initiate` terminal output to show friendly channel name instead of raw ID**

Line 831 currently:
```python
                    print(f"  💬 {self.country_name} (init in {channel_id}): \"{short}...\"", flush=True)
```

At this point, `channel_id` might be "global" (fine) or a raw group ID like "group_a1b2c3".
Look up the friendly name from the channels list passed into this method:
```python
                    # Resolve friendly channel name
                    ch_name_lookup = {ch["id"]: ch.get("name", ch["id"]) for ch in channels}
                    ch_display = ch_name_lookup.get(channel_id, channel_id)
                    print(f"  💬 {self.country_name} [{ch_display}]: \"{short}...\"", flush=True)
```

**Step 3: Improve `_maybe_initiate` channel list prompt to show names clearly**

Lines 758-761 currently show channel names but say "this channel's ID is..." —
simplify to just show the friendly name, since the LLM can use that:
```python
            channel_list = "\n".join(
                f"  • \"{ch.get('name', ch['id'])}\""
                for ch in channels
            )
```

**Verification:** Run the orchestrator and confirm:
- All 💬 terminal lines show `[channel_name]` after the country name
- Initiation messages show `[DM: France ↔ Germany]` not `[group_abc123]`
- Agents still find and post to correct channels

---

## Task 3: Single-Agent Move Audit with Auto-Retry

**Objective:** Before submitting orders to the engine, detect if an agent ordered
two of its own units to move to the same destination. If found, tell the LLM about
the conflict and let it retry once. If the retry still has the conflict, auto-fix
by turning one of the conflicting moves into a HOLD.

**Files:**
- Modify: `ai-orchestrator/orchestrator.py` (add audit function, add retry logic in `_run_order_phase`)

**Step 1: Add `_audit_agent_orders` static method to `Orchestrator`**

Insert after the `_run_order_phase` method (around line 1384). Pure function —
takes orders list, returns conflicts dict:

```python
    @staticmethod
    def _audit_agent_orders(orders: list) -> dict:
        """Check for same-power same-destination conflicts in an agent's orders.
        
        Returns {conflicting_unit_ids: [id1, id2, ...], destination: "XXX"}
        or empty dict if no conflicts.
        """
        dest_map = {}  # destination -> list of (unitId, order)
        for o in orders:
            if o.get("type") == "MOVE":
                dest = o.get("targetLocationId")
                if dest:
                    dest_map.setdefault(dest, []).append(o)
        
        for dest, moves in dest_map.items():
            if len(moves) >= 2:
                return {
                    "conflicting_unit_ids": [m["unitId"] for m in moves],
                    "destination": dest,
                }
        return {}
```

**Step 2: Add conflict retry in `_run_order_phase`**

In `_run_order_phase`, after `orders = agent.generate_orders()` (line 1359),
add the audit → retry loop. The full block replaces lines 1359-1361:

```python
                orders = agent.generate_orders()

                # Audit for self-conflicts (same agent, same destination)
                conflict = Orchestrator._audit_agent_orders(orders)
                if conflict:
                    c_units = conflict["conflicting_unit_ids"]
                    c_dest = conflict["destination"]
                    print(f"  ⚠ {agent.country_name}: CONFLICT — {c_units} both → {c_dest}", flush=True)
                    print(f"  ↻ Retrying with conflict info...", flush=True)

                    # Build a retry prompt that tells the agent about the conflict
                    state = agent.bridge.get_state()
                    player = state.get("players", {}).get(pid, {})
                    units = player.get("units", {})

                    conflict_msg = (
                        f"⚠️ ORDER CONFLICT DETECTED ⚠️\n"
                        f"The following units both tried to MOVE to {c_dest}:\n"
                    )
                    for uid in c_units:
                        u = units.get(uid, {})
                        conflict_msg += f"  • {uid} at {u.get('locationId', '?')} ({u.get('type', '?')})\n"
                    conflict_msg += (
                        f"\nOnly ONE unit can move to a province per turn. "
                        f"One of these units must MOVE somewhere else or HOLD. "
                        f"Please re-submit orders for these units."
                    )

                    # Use chat_with_tools retry with conflict context
                    from agent_tools import AgentTools
                    retry_tools = AgentTools(pid, agent.bridge)
                    state_text = agent._get_state_text()
                    retry_prompt = f"""{state_text}

{conflict_msg}

Use the tools to fix your orders. Only re-submit orders for the conflicting units
(use cancel_order if needed). When all units have valid orders, call finalize_orders."""

                    agent.llm.chat_with_tools(
                        model=agent.model,
                        messages=[{"role": "user", "content": retry_prompt}],
                        tools=AgentTools.definitions(),
                        tool_handler=retry_tools.dispatch,
                        system=agent.system_prompt,
                        temperature=0.3,
                        max_tokens=1000,
                        max_turns=10,
                        fallback_model=agent.fallback_model,
                    )
                    retry_orders = retry_tools.get_orders()
                    
                    # If retry produced orders, merge them (replace conflicting ones)
                    if retry_orders:
                        # Build map of retry orders by unitId
                        retry_map = {o["unitId"]: o for o in retry_orders}
                        merged = []
                        for o in orders:
                            if o.get("unitId") in retry_map:
                                merged.append(retry_map.pop(o["unitId"]))
                            elif o.get("unitId") in c_units:
                                # Conflicting unit not in retry → HOLD fallback
                                merged.append({"unitId": o["unitId"], "type": "HOLD"})
                            else:
                                merged.append(o)
                        # Add any new orders from retry
                        merged.extend(retry_map.values())
                        orders = merged
                        
                        # Re-audit after retry
                        conflict2 = Orchestrator._audit_agent_orders(orders)
                        if conflict2:
                            c2_units = conflict2["conflicting_unit_ids"]
                            c2_dest = conflict2["destination"]
                            print(f"  ⚠ {agent.country_name}: still conflicted → auto-fixing {c2_units[1]} to HOLD", flush=True)
                            # Auto-fix: turn the second conflicting move into HOLD
                            for i, o in enumerate(orders):
                                if o.get("unitId") == c2_units[1]:
                                    orders[i] = {"unitId": o["unitId"], "type": "HOLD"}
                                    break
                    else:
                        # Retry produced nothing → auto-fix conflicting moves to HOLD
                        print(f"  ⚠ {agent.country_name}: retry empty → auto-fixing to HOLD", flush=True)
                        for i, o in enumerate(orders):
                            if o.get("unitId") in c_units[1:]:
                                orders[i] = {"unitId": o["unitId"], "type": "HOLD"}

                self.bridge.submit_orders(pid, orders)
```

**Step 3: Restore the self-review logic after the audit block**

After the audit/retry block and before `self.bridge.submit_orders`, insert the
self-review flow from Task 1:

```python
                # --- Self-Review: show agent its intent BEFORE locking in orders ---
                reasoning = agent.generate_order_reasoning(orders)
                if reasoning:
                    print(f"  🧠 {agent.country_name} intent: {reasoning}", flush=True)

                orders = agent.self_review_orders(orders, reasoning)

                self.bridge.submit_orders(pid, orders)
```

**Verification:** Run the orchestrator and:
- If an agent ever orders two units to the same destination, you'll see:
  ```
  ⚠ England: CONFLICT — ['A_LON_0_england', 'F_EDI_1_england'] both → NWG
  ↻ Retrying with conflict info...
  ```
- After retry, either the conflict is resolved or auto-fixed to HOLD
- No engine errors from same-power duplicate destinations
- Normal turns (no conflicts) proceed unchanged

---

## Task 4: Integration Verification

**Objective:** Run the orchestrator for 1-2 turns and verify all three changes work
together without breaking anything.

**Step 1: Run the orchestrator**

```bash
cd /Users/cesarvega/Documents/p-code/modern_diplomacy_ai
python3 ai-orchestrator/orchestrator.py
```

**Step 2: Verify during execution**

- [ ] Placement phase shows placement choices normally
- [ ] Negotiation messages show `[channel_name]` in terminal (Task 2)
- [ ] After each agent generates orders, 🧠 intent + self-review runs (Task 1)
- [ ] If any agent has self-conflict, audit/retry fires (Task 3)
- [ ] Resolution displays correctly
- [ ] Board prints correctly after resolution

**Step 3: Run existing tests to confirm no regressions**

```bash
cd /Users/cesarvega/Documents/p-code/modern_diplomacy_ai/ai-orchestrator
python3 -m pytest __tests__/ -v 2>&1 | tail -20
```

Expected: All previously-passing tests still pass.

---

## Summary of Changes

| File | What Changes | Lines Added |
|------|-------------|-------------|
| `orchestrator.py` | `generate_order_reasoning()` method | ~45 |
| `orchestrator.py` | `self_review_orders()` method | ~80 |
| `orchestrator.py` | Enhanced terminal prints (channel names) | ~8 |
| `orchestrator.py` | `_audit_agent_orders()` static method | ~20 |
| `orchestrator.py` | Audit + self-review logic in `_run_order_phase` | ~75 |

**Total:** ~228 lines added, zero lines removed.
