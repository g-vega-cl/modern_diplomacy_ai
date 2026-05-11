#!/usr/bin/env python3
"""
Diplomacy AI Orchestrator — runs AI-vs-AI Diplomacy games.
Seven AI agents negotiate via chat, then simultaneously submit orders.
Uses OpenRouter for LLM access. Zero external dependencies (stdlib only).

Architecture:
  Python orchestrator ←→ Node.js engine-bridge.js (JSON-line subprocess)
  Each country = one DiplomacyAgent with its own LLM model from OpenRouter
"""

import json
import os
import sys
import time
import threading
import subprocess
import urllib.request
from pathlib import Path

# ─── Config ─────────────────────────────────────────────────────────

SCRIPT_DIR = Path(__file__).parent
BRIDGE_SCRIPT = SCRIPT_DIR / "engine-bridge.ts"
BRIDGE_CMD = ["npx", "tsx", str(BRIDGE_SCRIPT)]

def load_config(path=None):
    if path is None:
        path = SCRIPT_DIR / "agents.json"
    with open(path) as f:
        return json.load(f)

# ─── OpenRouter LLM Client ──────────────────────────────────────────

class LLMClient:
    BASE = "https://openrouter.ai/api/v1/chat/completions"
    
    def __init__(self, api_key: str):
        self.api_key = api_key
    
    def chat(self, model: str, messages: list, system: str = None,
             temperature: float = 0.8, max_tokens: int = 2000, 
             response_format: dict = None) -> str:
        """Send chat completion to OpenRouter, return response text."""
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if system:
            payload["messages"] = [{"role": "system", "content": system}] + payload["messages"]
        if response_format:
            payload["response_format"] = response_format
        
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
        
        content = result["choices"][0]["message"].get("content")
        if content is None:
            # Some models return null content (rate limits, degenerate responses)
            return ""
        return content

# ─── Engine Bridge (subprocess) ─────────────────────────────────────

class EngineBridge:
    """Communicates with the Node.js engine-bridge via JSON-line subprocess."""
    
    def __init__(self):
        self._counter = 0
        self.proc = subprocess.Popen(
            BRIDGE_CMD,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            cwd=str(SCRIPT_DIR.parent),
        )
        # Wait for ready signal
        ready = self.proc.stderr.readline()
        if "ENGINE_BRIDGE_READY" not in ready:
            raise RuntimeError(f"Bridge failed to start: {ready}")
    
    def _call(self, method: str, params: dict = None) -> dict:
        self._counter += 1
        req = {"id": self._counter, "method": method}
        if params:
            req["params"] = params
        
        self.proc.stdin.write(json.dumps(req) + "\n")
        self.proc.stdin.flush()
        
        line = self.proc.stdout.readline()
        if not line:
            raise RuntimeError("Bridge process died")
        
        resp = json.loads(line)
        if not resp.get("ok"):
            raise RuntimeError(f"Bridge error: {resp.get('error', 'unknown')}")
        return resp
    
    def reset(self):
        return self._call("reset")
    
    def get_state(self) -> dict:
        return self._call("getState")["state"]
    
    def get_player_view(self, player_id: str) -> dict:
        return self._call("getPlayerView", {"playerId": player_id})["view"]
    
    def get_status(self) -> dict:
        return self._call("getStatus")["status"]
    
    def submit_orders(self, player_id: str, orders: list):
        return self._call("submitOrders", {"playerId": player_id, "orders": orders})
    
    def submit_placements(self, player_id: str, placements: list):
        return self._call("submitPlacements", {"playerId": player_id, "placements": placements})
    
    def advance_phase(self) -> dict:
        return self._call("advancePhase")
    
    def resolve(self) -> dict:
        return self._call("resolve")
    
    def submit_retreat(self, unit_id: str, location_id: str = "", disband: bool = False):
        return self._call("submitRetreat", {
            "unitId": unit_id,
            "locationId": location_id,
            "disband": disband,
        })
    
    def submit_build(self, player_id: str, builds: list):
        return self._call("submitBuild", {"playerId": player_id, "builds": builds})
    
    def advance_builds(self):
        return self._call("advanceBuilds")
    
    # Chat methods
    def chat_get_channels(self, player_id: str) -> list:
        return self._call("chat_getChannels", {"playerId": player_id}).get("channels", [])
    
    def chat_get_messages(self, channel_id: str, since: int = 0) -> list:
        return self._call("chat_getMessages", {
            "channelId": channel_id, "since": since
        }).get("messages", [])
    
    def chat_send(self, channel_id: str, sender_id: str, sender_name: str, content: str):
        return self._call("chat_sendMessage", {
            "channelId": channel_id,
            "senderId": sender_id,
            "senderName": sender_name,
            "content": content,
        })
    
    def chat_create_group(self, name: str, created_by: str, member_ids: list):
        return self._call("chat_createGroup", {
            "name": name, "createdBy": created_by, "memberIds": member_ids
        })
    
    def shutdown(self):
        try:
            self._call("quit")
        except:
            pass
        self.proc.terminate()

# ─── AI Agent ───────────────────────────────────────────────────────

class DiplomacyAgent:
    """One country played by an LLM."""
    
    def __init__(self, player_id: str, config: dict, global_instructions: str,
                 llm: LLMClient, bridge: EngineBridge):
        self.player_id = player_id
        self.model = config["model"]
        self.country_name = config["country_name"]
        self.persona = config.get("persona", "")
        self.llm = llm
        self.bridge = bridge
        
        self.system_prompt = global_instructions.replace("{country_name}", self.country_name)
        if self.persona:
            self.system_prompt += f"\n\nYOUR PERSONA:\n{self.persona}"
        
        # Negotiation state
        self.msg_count = 0
        self.max_msgs = 0
        self.running = False
        self.last_poll = 0
    
    def _get_state_text(self) -> str:
        """Text representation of current game state from this player's perspective."""
        try:
            state = self.bridge.get_state()
            view = self.bridge.get_player_view(self.player_id)
        except Exception as e:
            return f"[Error fetching game state: {e}]"
        
        player = view.get("player", {})
        units = player.get("units", {})
        valid_moves = view.get("validMoves", {})
        visible_units = view.get("visibleUnits", [])
        
        parts = []
        parts.append(f"=== GAME STATE === Year {state.get('year')}, {state.get('season')} ===")
        parts.append(f"Phase: {state.get('phase')}")
        parts.append(f"Your supply centers: {player.get('supplyCenterCount', '?')}")
        parts.append("")
        parts.append("=== YOUR UNITS ===")
        
        if not units:
            parts.append("  (You have been eliminated)")
        else:
            for uid, u in units.items():
                moves = valid_moves.get(uid, [])
                moves_str = ", ".join(moves[:8]) if moves else "no valid moves"
                parts.append(f"  {uid} at {u.get('locationId', '?')} ({u.get('type', '?')}) → valid: {moves_str}")
        
        parts.append("")
        parts.append("=== ALL VISIBLE UNITS ===")
        for u in visible_units:
            owner = u.get("ownerId", "?")
            marker = " ← YOU" if owner == self.player_id else ""
            parts.append(f"  {u.get('id', '?')}: {owner} {u.get('type', '?')} at {u.get('locationId', '?')}{marker}")
        
        return "\n".join(parts)
    
    def generate_orders(self) -> list:
        """Ask the LLM to generate orders based on current game state."""
        state_text = self._get_state_text()
        
        prompt = f"""{state_text}

=== YOUR TASK ===
Negotiation is over. Submit your orders NOW.

For each of your units, issue exactly ONE order. 

Order types:
- HOLD: {{"unitId": "A_PAR_0_france", "type": "HOLD"}}
- MOVE: {{"unitId": "A_PAR_0_france", "type": "MOVE", "targetLocationId": "BUR"}}
- SUPPORT HOLD: {{"unitId": "A_MAR_1_france", "type": "SUPPORT", "supportUnitId": "A_PAR_0_france", "supportOrderType": "HOLD"}}
- SUPPORT MOVE: {{"unitId": "A_MAR_1_france", "type": "SUPPORT", "supportUnitId": "A_PAR_0_france", "supportOrderType": "MOVE", "supportTargetLocationId": "BUR"}}

IMPORTANT:
- One order per unit. No more, no less.
- MOVE only to valid adjacent territories listed above.
- SUPPORT a specific unit's action, not a territory.
- For fleet moves to Spain/StP/Bulgaria, specify coast: SPA_NC, SPA_SC, STP_NC, STP_SC, BUL_EC, BUL_SC.

Respond with a JSON array of orders. Nothing else."""

        response = self.llm.chat(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            system=self.system_prompt,
            temperature=0.3,
            max_tokens=1000,
        )
        return self._parse_json(response)
    
    def generate_placements(self) -> list:
        """Ask the LLM to choose where to place its initial units."""
        try:
            view = self.bridge.get_player_view(self.player_id)
        except Exception as e:
            return []
        
        valid_placements = view.get("validPlacements", [])
        if not valid_placements:
            return []
        
        # Group valid placements by location
        by_location = {}
        for p in valid_placements:
            loc = p.get("locationId", "?")
            by_location.setdefault(loc, []).append(p.get("type", "?"))
        
        placement_lines = []
        for loc, types in by_location.items():
            placement_lines.append(f"  {loc}: can place {' or '.join(types)}")
        
        home_count = len(by_location)  # number of home SCs = placements needed
        
        prompt = f"""You are the Grand Strategist of {self.country_name}. It is Spring 1901.

Your home supply centers (you must place exactly {home_count} unit(s), one per center):
{chr(10).join(placement_lines)}

Choose wisely — this determines your opening strategy:
- Army (A): strong on land, conquers interior territories
- Fleet (F): controls seas, threatens coastal centers
- A fleet must be placed on a COASTAL center only
- Each center gets exactly ONE unit

Respond with a JSON array of placements. Example:
[{{"type": "A", "locationId": "VIE"}}, {{"type": "F", "locationId": "TRI"}}, {{"type": "A", "locationId": "BUD"}}]

Respond with JSON array only."""

        response = self.llm.chat(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            system=self.system_prompt,
            temperature=0.5,
            max_tokens=500,
        )
        return self._parse_json(response)
    
    def negotiate(self, max_msgs: int):
        """Run negotiation loop in a thread."""
        self.max_msgs = max_msgs
        self.running = True
        self.msg_count = 0
        self.last_poll = 0
        
        print(f"  {self.country_name} ({self.model}): entering negotiations...", flush=True)
        
        # Stagger start so agents don't all fire simultaneously
        time.sleep(hash(self.player_id) % 500 / 100.0)
        
        while self.running and self.msg_count < self.max_msgs:
            try:
                channels = self.bridge.chat_get_channels(self.player_id)
                
                new_messages = []
                for ch in channels:
                    msgs = self.bridge.chat_get_messages(ch["id"], self.last_poll)
                    for m in msgs:
                        if m.get("senderId") != self.player_id:
                            new_messages.append((ch, m))
                
                if new_messages:
                    self.last_poll = max(m["timestamp"] for _, m in new_messages)
                    self._handle_messages(channels, new_messages)
                else:
                    self._maybe_initiate(channels)
                
            except Exception as e:
                if self.running:
                    print(f"  ⚠ {self.country_name} neg error: {e}", flush=True)
            
            time.sleep(4 + hash(self.player_id + str(int(time.time() / 4))) % 4)
        
        self.running = False
        print(f"  {self.country_name}: ended ({self.msg_count} msgs)", flush=True)
    
    def _handle_messages(self, channels: list, new_messages: list):
        if self.msg_count >= self.max_msgs:
            return
        
        # Build a channel name lookup
        ch_names = {}
        for ch in channels:
            ch_names[ch["id"]] = ch.get("name", ch["id"])
        
        # Build context from recent messages with channel info
        recent = new_messages[-5:]
        msgs_text = "\n".join(
            f"[{ch_names.get(ch.get('id', '?'), ch.get('id', '?'))} — {m.get('senderName', m.get('senderId'))}]: {m.get('content', '')[:300]}"
            for ch, m in recent if isinstance(ch, dict)
        )
        
        # Build list of available channels for the agent to know its options
        channel_list = "\n".join(
            f"  • \"{ch.get('name', ch['id'])}\" (id: {ch['id']})"
            for ch in channels
        )
        
        prompt = f"""You are {self.country_name}. The negotiation channels available to you:

{channel_list}

New messages:

{msgs_text}

Should you respond? If so, write your message text (1-3 sentences, strategic, in character).
If replying, you will respond in the same channel as the last message. 
Or reply with just "PASS" to stay silent.

Your response:"""
        
        response = self.llm.chat(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            system=self.system_prompt,
            temperature=0.9,
            max_tokens=300,
        )
        
        if not response:
            return
        response = response.strip()
        if response.upper() == "PASS" or not response:
            return
        
        channel_id = recent[-1][0]["id"] if recent else "global"
        try:
            self.bridge.chat_send(channel_id, self.player_id, self.country_name, response)
            self.msg_count += 1
            short = response[:80].replace("\n", " ")
            print(f"  💬 {self.country_name}: \"{short}...\"", flush=True)
        except Exception as e:
            print(f"  ⚠ {self.country_name} send err: {e}", flush=True)
    
    def _maybe_initiate(self, channels: list):
        if self.msg_count >= self.max_msgs or self.msg_count > 0:
            return
        
        # ~25% chance to initiate when quiet
        if hash(self.player_id + str(int(time.time() / 8))) % 10 < 2.5:
            # Show available channels
            channel_list = "\n".join(
                f"  • \"{ch.get('name', ch['id'])}\" — this channel's ID is \"{ch['id']}\""
                for ch in channels
            )
            
            prompt = f"""You are {self.country_name}. Negotiation has begun and no one has spoken.
Start the conversation. Propose an alliance, make an opening statement, 
or probe another power's intentions. Be in character. 1-2 sentences.

Available channels:
{channel_list}

IMPORTANT: Your reply must be EXACTLY two lines. First line: the channel ID you want to post in.
Second line: your message. Example:
global
Greetings, fellow powers. France seeks peaceful cooperation in the west.

Your response:"""
            
            response = self.llm.chat(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                system=self.system_prompt,
                temperature=0.9,
                max_tokens=200,
            )
            
            if not response:
                return
            response = response.strip()
            if not response or response.upper() == "PASS":
                return
            
            # Parse: first line = channel ID, rest = message
            lines = response.split("\n", 1)
            if len(lines) == 2:
                channel_id = lines[0].strip()
                message_text = lines[1].strip()
            else:
                # Fallback: use global and the whole response as message
                channel_id = "global"
                message_text = lines[0].strip()
            
            if message_text:
                try:
                    self.bridge.chat_send(channel_id, self.player_id, self.country_name, message_text)
                    self.msg_count += 1
                    short = message_text[:80].replace("\n", " ")
                    ch_name = channel_id
                    print(f"  💬 {self.country_name} (init in {ch_name}): \"{short}...\"", flush=True)
                except Exception as e:
                    print(f"  ⚠ {self.country_name} send err: {e}", flush=True)
    
    def handle_retreat(self, unit_id: str, unit_info: dict) -> str:
        """Returns 'disband' or a location ID."""
        state_text = self._get_state_text()
        
        options = unit_info.get("validRetreats", [])
        if not options:
            return "disband"
        
        prompt = f"""{state_text}

Your unit {unit_id} was DISLODGED and must retreat or disband.

Valid retreat options: {', '.join(options)}

Reply with ONE word: either the territory ID to retreat to, or "DISBAND".

Choice:"""
        
        response = self.llm.chat(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            system=self.system_prompt,
            temperature=0.3,
            max_tokens=20,
        )
        
        response = response.strip().upper()
        if response == "DISBAND":
            return "disband"
        return response
    
    def _parse_json(self, text: str) -> list:
        """Extract JSON array from LLM response."""
        if not text:
            print(f"  ⚠ {self.country_name}: empty response from LLM", flush=True)
            return []
        text = text.strip()
        for prefix in ["```json", "```"]:
            if text.startswith(prefix):
                text = text[len(prefix):]
                if text.endswith("```"):
                    text = text[:-3]
                text = text.strip()
                break
        
        start = text.find("[")
        end = text.rfind("]")
        if start >= 0 and end > start:
            try:
                parsed = json.loads(text[start:end+1])
                if isinstance(parsed, list):
                    return parsed
            except json.JSONDecodeError:
                pass
        
        print(f"  ⚠ {self.country_name}: parse error. Raw: {text[:200]}", flush=True)
        return []

# ─── Orchestrator ───────────────────────────────────────────────────

class Orchestrator:
    def __init__(self, config: dict, api_key: str):
        self.config = config
        self.game_cfg = config["game"]
        self.llm = LLMClient(api_key)
        self.bridge = EngineBridge()
        
        self.agents = {}
        for pid, acfg in config["agents"].items():
            self.agents[pid] = DiplomacyAgent(
                pid, acfg, config["global_instructions"], self.llm, self.bridge
            )
        
        self.neg_window = self.game_cfg["negotiation_window_seconds"]
        self.max_msgs = self.game_cfg["max_negotiation_messages_per_agent"]
        self.max_years = self.game_cfg["max_years"]
    
    def run(self):
        print("=" * 60)
        print("  DIPLOMACY AI ORCHESTRATOR")
        print("  Seven AI powers. OpenRouter. No mercy.")
        print("=" * 60)
        print()
        
        self.bridge.reset()
        
        for pid, agent in self.agents.items():
            print(f"  {agent.country_name}: {agent.model}")
        print()
        
        try:
            while True:
                status = self.bridge.get_status()
                
                if status.get("winner"):
                    print(f"\n{'=' * 60}")
                    print(f"  🏆 {status['winner']['name']} WINS!")
                    print(f"{'=' * 60}")
                    break
                
                state = self.bridge.get_state()
                year = state.get("year", 1901)
                
                if year > 1900 + self.max_years:
                    print(f"\n⏰ Max years ({self.max_years}) reached. Draw.")
                    break
                
                phase = state.get("phase")
                season = state.get("season")
                
                print(f"\n{'─' * 50}")
                print(f"  {season} {year} — Phase: {phase}")
                print(f"{'─' * 50}")
                
                if phase == "PLACEMENT":
                    self._run_placement_phase()
                    self.bridge.advance_phase()  # PLACEMENT → ORDER
                
                elif phase == "ORDER":
                    self._run_order_phase()
                    result = self.bridge.resolve()
                    self._show_resolution(result)
                    
                    if result.get("winner"):
                        print(f"\n{'=' * 60}")
                        print(f"  🏆 {result['winner']['name']} WINS!")
                        print(f"{'=' * 60}")
                        break
                
                elif phase == "RETREAT":
                    self._run_retreat_phase(state)
                
                elif phase == "BUILD":
                    self._run_build_phase(state)
                    self.bridge.advance_builds()
                
                else:
                    print(f"  Unknown phase: {phase}")
                    break
        finally:
            self.bridge.shutdown()
    
    def _run_placement_phase(self):
        print(f"\n  🎯 PLACEMENT — Each power chooses its starting positions")
        print(f"  (Armies vs Fleets — strategic opening decisions)")
        
        for pid, agent in self.agents.items():
            try:
                placements = agent.generate_placements()
                if placements:
                    self.bridge.submit_placements(pid, placements)
                    print(f"  ✓ {agent.country_name}: {len(placements)} placements")
                    for p in placements:
                        print(f"      {p.get('type', '?')} at {p.get('locationId', '?')}")
                else:
                    print(f"  ⚠ {agent.country_name}: parse error, fallback needed")
            except Exception as e:
                print(f"  ❌ {agent.country_name}: {e}", flush=True)
    
    def _run_order_phase(self):
        print(f"\n  🗣 NEGOTIATION WINDOW ({self.neg_window}s)")
        print(f"  Max {self.max_msgs} messages/agent")
        
        # Pre-create private DM channels between all pairs
        agent_ids = list(self.agents.keys())
        dm_channels = {}  # (a, b) -> channel dict
        pair_names = {}   # (a, b) -> short name for LLM prompts
        for i, a in enumerate(agent_ids):
            for b in agent_ids[i+1:]:
                pair_key = (a, b)
                name_a = self.agents[a].country_name
                name_b = self.agents[b].country_name
                channel_name = f"DM: {name_a} ↔ {name_b}"
                short_name = f"DM:{a}:{b}"
                try:
                    result = self.bridge.chat_create_group(channel_name, a, [b])
                    ch = result.get("channel", {})
                    dm_channels[pair_key] = ch
                    pair_names[pair_key] = short_name
                except Exception as e:
                    print(f"  ⚠ Failed DM {a}-{b}: {e}", flush=True)
        
        # Store on the bridge for agents to look up channel names
        self._dm_pair_names = pair_names
        self._dm_channels = dm_channels
        print(f"  📨 {len(dm_channels)} private channels created", flush=True)
        
        # Start all agents in parallel threads
        threads = []
        for agent in self.agents.values():
            t = threading.Thread(target=agent.negotiate, args=(self.max_msgs,), daemon=True)
            t.start()
            threads.append(t)
        
        # Countdown
        start = time.time()
        while time.time() - start < self.neg_window:
            elapsed = int(time.time() - start)
            remaining = self.neg_window - elapsed
            if remaining % 60 == 0 and remaining > 0:
                mins = remaining // 60
                print(f"  ⏳ {mins} min remaining...", flush=True)
            time.sleep(15)
        
        print("  🔒 NEGOTIATION CLOSED", flush=True)
        
        # Stop all agents
        for agent in self.agents.values():
            agent.running = False
        
        for t in threads:
            t.join(timeout=5)
        
        # Generate and submit orders
        print("\n  📝 SUBMITTING ORDERS...")
        for pid, agent in self.agents.items():
            try:
                # Check if player is eliminated
                view = self.bridge.get_player_view(pid)
                player = view.get("player", {})
                if player.get("eliminated"):
                    print(f"  💀 {agent.country_name}: ELIMINATED")
                    continue
                
                units = player.get("units", {})
                if not units:
                    print(f"  {agent.country_name}: no units")
                    continue
                
                orders = agent.generate_orders()
                if orders:
                    self.bridge.submit_orders(pid, orders)
                    print(f"  ✓ {agent.country_name}: {len(orders)} orders")
                    for o in orders:
                        tgt = o.get("targetLocationId") or o.get("supportTargetLocationId") or ""
                        print(f"      {o.get('unitId')}: {o.get('type')}{' → ' + tgt if tgt else ''}")
                else:
                    print(f"  ⚠ {agent.country_name}: fallback HOLD")
                    hold_orders = [{"unitId": uid, "type": "HOLD"} for uid in units]
                    self.bridge.submit_orders(pid, hold_orders)
            except Exception as e:
                print(f"  ❌ {agent.country_name}: {e}", flush=True)
    
    def _run_retreat_phase(self, state: dict):
        retreats = state.get("retreatsNeeded", [])
        if not retreats:
            return
        
        print(f"\n  🏃 RETREATS: {len(retreats)} unit(s)")
        
        units_map = state.get("units", {})
        
        for unit_id in retreats:
            unit = units_map.get(unit_id, {})
            owner_id = unit.get("ownerId", "")
            agent = self.agents.get(owner_id)
            
            if not agent:
                self.bridge.submit_retreat(unit_id, disband=True)
                continue
            
            try:
                choice = agent.handle_retreat(unit_id, unit)
                if choice == "disband":
                    print(f"  💀 {agent.country_name}: disbanded {unit_id}")
                    self.bridge.submit_retreat(unit_id, disband=True)
                else:
                    print(f"  🏃 {agent.country_name}: {unit_id} → {choice}")
                    self.bridge.submit_retreat(unit_id, choice)
            except Exception as e:
                print(f"  ❌ retreat err: {e}")
                self.bridge.submit_retreat(unit_id, disband=True)
    
    def _run_build_phase(self, state: dict):
        print(f"\n  🏗 BUILD PHASE")
        
        for pid, agent in self.agents.items():
            try:
                view = self.bridge.get_player_view(pid)
                player = view.get("player", {})
                units = player.get("units", {})
                sc_count = player.get("supplyCenterCount", 0)
                unit_count = len(units)
                delta = sc_count - unit_count
                valid_builds = view.get("validBuilds", [])
                
                if delta == 0:
                    continue
                
                state_text = agent._get_state_text()
                
                if delta > 0:
                    print(f"  {agent.country_name}: +{delta} in {valid_builds}")
                    prompt = f"""{state_text}

Build {delta} unit(s) in open home centers: {', '.join(valid_builds)}

Format: [{{"type": "CREATE", "unitType": "A", "locationId": "PAR"}}, ...]
UnitType: "A" for Army, "F" for Fleet.
Respond with JSON array only."""
                else:
                    print(f"  {agent.country_name}: disband {abs(delta)}")
                    prompt = f"""{state_text}

Disband {abs(delta)} unit(s). Your units: {', '.join(f'{uid}@{u.get("locationId")}' for uid, u in units.items())}

Format: [{{"type": "DESTROY", "locationId": "PAR"}}, ...]
Respond with JSON array only."""
                
                response = agent.llm.chat(
                    model=agent.model,
                    messages=[{"role": "user", "content": prompt}],
                    system=agent.system_prompt,
                    temperature=0.3,
                    max_tokens=500,
                )
                
                builds = agent._parse_json(response)
                if builds:
                    self.bridge.submit_build(pid, builds)
                    for b in builds:
                        print(f"    {b.get('type')}: {b.get('unitType', '')} {b.get('locationId', '')}")
            except Exception as e:
                print(f"  ⚠ {agent.country_name} build err: {e}")
    
    def _show_resolution(self, result: dict):
        r = result.get("result", {})
        moves = r.get("successfulMoves", [])
        bounced = r.get("bouncedMoves", [])
        dislodged = r.get("dislodgedUnits", [])
        destroyed = r.get("destroyedUnits", [])
        
        print(f"\n  ⚔ RESOLUTION:")
        marker = False
        for m in moves:
            print(f"    ✓ {m['unitId']}: {m['fromLocationId']} → {m['toLocationId']}")
            marker = True
        for b in bounced:
            print(f"    ✗ {b['unitId']}: bounced from {b['attemptedLocationId']}")
            marker = True
        for d in dislodged:
            print(f"    💥 {d['unitId']}: DISLODGED from {d['fromLocationId']}")
            marker = True
        for d in destroyed:
            print(f"    💀 {d}: DESTROYED")
            marker = True
        if not marker:
            print("    (no changes)")


# ─── Main ───────────────────────────────────────────────────────────

def main():
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        print("Error: OPENROUTER_API_KEY environment variable not set.")
        print("  export OPENROUTER_API_KEY=sk-or-v1-...")
        sys.exit(1)
    
    config_path = sys.argv[1] if len(sys.argv) > 1 else None
    config = load_config(config_path)
    
    orch = Orchestrator(config, api_key)
    orch.run()

if __name__ == "__main__":
    main()
