#!/usr/bin/env python3
"""
Diplomacy AI Orchestrator — runs AI-vs-AI Diplomacy games.
Seven AI agents negotiate via chat, then simultaneously submit orders.
Uses OpenRouter for LLM access. Zero external dependencies (stdlib only).

Architecture:
  Python orchestrator ←→ Node.js engine-bridge.js (JSON-line subprocess)
  Each country = one DiplomacyAgent with its own LLM model from OpenRouter
  Cross-turn memory via SummaryManager — each agent maintains a structured
  JSON summary (alliances, deals, betrayals, plans) across turns instead of
  re-reading full negotiation histories. Summaries generated in parallel
  after each resolution. See summaries/{country}.json
"""

import json
import os
import sys
import time
import threading
import subprocess
import urllib.request
from pathlib import Path

from summary_manager import SummaryManager

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
    
    def _make_request(self, model: str, messages: list, system: str = None,
                      temperature: float = 0.8, max_tokens: int = 2000,
                      response_format: dict = None) -> str:
        """Send a single chat completion request, return response text or empty string."""
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

    def chat(self, model: str, messages: list, system: str = None,
             temperature: float = 0.8, max_tokens: int = 2000, 
             response_format: dict = None,
             fallback_model: str = None) -> str:
        """Send chat completion to OpenRouter, return response text.
        
        If fallback_model is provided and the primary model returns empty content,
        retry with the fallback model automatically."""
        content = self._make_request(model, messages, system, temperature,
                                     max_tokens, response_format)
        
        if not content and fallback_model and fallback_model != model:
            content = self._make_request(fallback_model, messages, system,
                                         temperature, max_tokens, response_format)
        
        return content

    def chat_with_tools(self, model: str, messages: list, tools: list,
                        tool_handler, system: str = None,
                        temperature: float = 0.3, max_tokens: int = 2000,
                        max_turns: int = 10, fallback_model: str = None) -> str:
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
                 llm: LLMClient, bridge: EngineBridge,
                 fallback_model: str = None):
        self.player_id = player_id
        self.model = config["model"]
        self.country_name = config["country_name"]
        self.persona = config.get("persona", "")
        self.llm = llm
        self.bridge = bridge
        self.fallback_model = fallback_model
        
        self.system_prompt = global_instructions.replace("{country_name}", self.country_name)
        if self.persona:
            self.system_prompt += f"\n\nYOUR PERSONA:\n{self.persona}"
        
        # Negotiation state
        self.msg_count = 0
        self.max_msgs = 0
        self.running = False
        self.last_poll = 0
        self.current_summary_text = None  # Set by orchestrator before negotiation
    
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
                moves_str = ", ".join(moves[:8]) if moves else "none (HOLD only)"
                parts.append(f"  {uid} at {u.get('locationId', '?')} ({u.get('type', '?')}) → moves: {moves_str}")
        
        # Always remind agents that HOLD and SUPPORT are valid
        parts.append("")
        parts.append("ORDER OPTIONS FOR EACH UNIT:")
        parts.append("  • MOVE to an adjacent territory (listed above)")
        parts.append("  • HOLD — always valid, even if no moves listed")
        parts.append("  • SUPPORT — if adjacent to a friendly unit, you can support its MOVE or HOLD")
        
        parts.append("")
        parts.append("=== ALL VISIBLE UNITS ===")
        for u in visible_units:
            owner = u.get("ownerId", "?")
            marker = " ← YOU" if owner == self.player_id else ""
            parts.append(f"  {u.get('id', '?')}: {owner} {u.get('type', '?')} at {u.get('locationId', '?')}{marker}")
        
        return "\n".join(parts)
    
    def generate_orders(self) -> list:
        """Use the tool-based flow to generate orders via validated tool calls."""
        from agent_tools import AgentTools

        tools = AgentTools(self.player_id, self.bridge)

        state_text = self._get_state_text()

        initial_prompt = f"""{state_text}

        summary_block = ""
        if self.current_summary_text:
            summary_block = f"\n\nYOUR STRATEGIC MEMORY (summary of all prior turns):\n{self.current_summary_text}\n"

Negotiation is over. Use the available tools to explore the board and submit your orders.
For each of your units, call get_my_units to see them, get_valid_moves to see where each
can go, then call submit_order once per unit. When all units have orders, call finalize_orders.

Strategic notes:
- MOVE only to valid destinations returned by get_valid_moves
- HOLD is always valid — use it to defend or when no good move exists
- SUPPORT a friendly unit's MOVE or HOLD to increase its strength
- For fleet moves to Spain/StP/Bulgaria, specify the exact coast (SPA_NC, SPA_SC, STP_NC, STP_SC, BUL_EC, BUL_SC)"""

        self.llm.chat_with_tools(
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
    
    def generate_placements(self) -> list:
        """Ask the LLM to choose where to place its initial units.
        Retries once with stronger formatting instructions on parse failure."""
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
        
        base_prompt = f"""You are the Grand Strategist of {self.country_name}. It is Spring 1901.

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

        for attempt in range(2):
            prompt = base_prompt
            if attempt > 0:
                prompt += (
                    "\n\n⚠️ CRITICAL FORMATTING RULE ⚠️\n"
                    "Your previous response was NOT valid JSON. You MUST output ONLY a JSON array.\n"
                    "Start with '[' and end with ']'. NO explanations, NO reasoning, NO markdown.\n"
                    "Example: [{\"type\":\"A\",\"locationId\":\"VIE\"},{\"type\":\"F\",\"locationId\":\"TRI\"},{\"type\":\"A\",\"locationId\":\"BUD\"}]\n"
                )

            response = self.llm.chat(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                system=self.system_prompt,
                temperature=0.5,
                max_tokens=500,
                fallback_model=self.fallback_model,
            )
            placements = self._parse_json(response)
            if placements:
                return placements
        
        return []

    def generate_builds(self, delta: int, valid_builds: list) -> list:
        """Use the tool-based flow to generate build orders via validated tool calls."""
        from agent_tools import AgentTools

        tools = AgentTools(self.player_id, self.bridge)

        state_text = self._get_state_text()

        if delta > 0:
            action_desc = f"You are the {self.country_name}. Build EXACTLY {delta} new unit(s)."
            action_verb = "CREATE"
        else:
            action_desc = f"You are the {self.country_name}. Disband EXACTLY {abs(delta)} unit(s)."
            action_verb = "DESTROY"

        initial_prompt = f"""{state_text}

{action_desc}
Available build locations: {', '.join(valid_builds) if valid_builds else 'none available'}

Use the available tools to explore the board and submit your builds.
1. Call get_my_units to see your current forces
2. Call get_valid_builds to see where you can build (or get_supply_centers)
3. For each build needed, call submit_build with action={action_verb}
4. When done, call finalize_builds

Strategic notes:
- Choose Army (A) or Fleet (F) based on your strategic needs
- Fleets can only be built in COASTAL centers — check can_build_fleet in get_valid_builds
- DESTROY removes a unit from the board — pick your least useful unit"""

        self.llm.chat_with_tools(
            model=self.model,
            messages=[{"role": "user", "content": initial_prompt}],
            tools=AgentTools.build_definitions(),
            tool_handler=tools.dispatch,
            system=self.system_prompt,
            temperature=0.3,
            max_tokens=1000,
            max_turns=15,
            fallback_model=self.fallback_model,
        )

        return tools.get_builds()
    
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

Decide whether to respond. If you reply, you will respond in the same channel as the last message.

Your response MUST use this exact format:

[REASONING]
Your private internal strategic analysis — NOT seen by other players. Brief, 1-2 sentences.

[MESSAGE]
Your in-character diplomatic message to send publicly. 1-3 sentences, in your persona's voice.
Pure roleplay text — no channel names, no JSON, no meta-commentary.

Or reply with just "PASS" (single word) to stay silent."""

        summary_block = ""
        if self.current_summary_text:
            summary_block = f"""YOUR STRATEGIC MEMORY (summary of all prior turns):

{self.current_summary_text}

"""

        full_prompt = summary_block + prompt
        
        response = self.llm.chat(
            model=self.model,
            messages=[{"role": "user", "content": full_prompt}],
            system=self.system_prompt,
            temperature=0.9,
            max_tokens=300,
            fallback_model=self.fallback_model,
        )
        
        if not response:
            return

        # Parse reasoning/message sections from the response
        reasoning, message_text = self._parse_agent_response(response)

        # Log reasoning to terminal
        if reasoning:
            self._log_reasoning(self.country_name, reasoning)

        if not message_text:
            return
        message_text = message_text.strip()
        if message_text.upper() == "PASS":
            return

        message_text = self._sanitize_chat_message(message_text)
        if not message_text:
            return
        
        channel_id = recent[-1][0]["id"] if recent else "global"
        try:
            self.bridge.chat_send(channel_id, self.player_id, self.country_name, message_text)
            self.msg_count += 1
            short = message_text[:80].replace("\n", " ")
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

Your response MUST use this exact format:

[REASONING]
Your private internal strategic analysis. Brief, 1-2 sentences.

[MESSAGE]
First line: the channel ID you want to post in.
Second line: your in-character diplomatic message text (pure roleplay, no meta-commentary)."""

            summary_block = ""
            if self.current_summary_text:
                summary_block = f"""YOUR STRATEGIC MEMORY (summary of all prior turns):

{self.current_summary_text}

"""

            full_prompt = summary_block + prompt

            response = self.llm.chat(
                model=self.model,
                messages=[{"role": "user", "content": full_prompt}],
                system=self.system_prompt,
                temperature=0.9,
                max_tokens=200,
                fallback_model=self.fallback_model,
            )
            
            if not response:
                return

            # Parse reasoning/message sections
            reasoning, message_text = self._parse_agent_response(response)

            # Log reasoning to terminal
            if reasoning:
                self._log_reasoning(self.country_name, reasoning)

            if not message_text:
                return
            message_text = message_text.strip()
            if not message_text or message_text.upper() == "PASS":
                return
            
            # Parse: first line = channel ID, rest = message
            lines = message_text.split("\n", 1)
            if len(lines) == 2:
                channel_id = lines[0].strip()
                message_text = lines[1].strip()
            else:
                # Fallback: use global and the whole response as message
                channel_id = "global"
                message_text = lines[0].strip()
            
            if message_text:
                message_text = self._sanitize_chat_message(message_text)
            if message_text:
                try:
                    self.bridge.chat_send(channel_id, self.player_id, self.country_name, message_text)
                    self.msg_count += 1
                    short = message_text[:80].replace("\n", " ")
                    print(f"  💬 {self.country_name} (init in {channel_id}): \"{short}...\"", flush=True)
                except Exception as e:
                    print(f"  ⚠ {self.country_name} send err: {e}", flush=True)

    # ── Response parsing ──────────────────────────────────────────────

    @staticmethod
    def _parse_agent_response(raw: str) -> tuple:
        """Parse [REASONING] and [MESSAGE] sections from LLM response.

        Returns (reasoning_text, message_text). Either may be empty string.
        If the delimiter format is not found, treats the entire response
        as the message and returns empty reasoning.
        """
        import re

        if not raw:
            return ("", "")

        raw = raw.strip()

        # Look for [REASONING] ... [MESSAGE] sections (case-insensitive)
        reasoning_match = re.search(
            r'\[REASONING\]\s*\n(.*?)(?=\[MESSAGE\]|$)', raw,
            re.IGNORECASE | re.DOTALL
        )
        message_match = re.search(
            r'\[MESSAGE\]\s*\n(.*?)(?=\[REASONING\]|$)', raw,
            re.IGNORECASE | re.DOTALL
        )

        reasoning = reasoning_match.group(1).strip() if reasoning_match else ""
        message = message_match.group(1).strip() if message_match else ""

        # If delimiter format wasn't found at all, treat whole response as message
        if not reasoning and not message:
            return ("", raw)

        return (reasoning, message)

    # ── Reasoning log ─────────────────────────────────────────────────

    # Class-level reasoning log file handle (shared across all agents)
    _reasoning_log_path = None

    @classmethod
    def init_reasoning_log(cls, log_dir: str = None):
        """Open the reasoning log file for the game session."""
        import datetime
        if log_dir is None:
            log_dir = "."
        ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        cls._reasoning_log_path = os.path.join(log_dir, f"agent_reasoning_{ts}.log")
        # Write header
        with open(cls._reasoning_log_path, "w") as f:
            f.write(f"# AGENT REASONING LOG — {datetime.datetime.now().isoformat()}\n")
            f.write("# Format: [timestamp] Country: reasoning text\n\n")

    @staticmethod
    def _log_reasoning(country_name: str, reasoning: str):
        """Print reasoning to terminal and append to log file."""
        import datetime
        ts = datetime.datetime.now().strftime("%H:%M:%S")

        # Terminal output
        print(f"  🧠 {country_name}: {reasoning}", flush=True)

        # File output
        if DiplomacyAgent._reasoning_log_path:
            try:
                with open(DiplomacyAgent._reasoning_log_path, "a") as f:
                    f.write(f"[{ts}] {country_name}: {reasoning}\n\n")
            except Exception:
                pass

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
            fallback_model=self.fallback_model,
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

    def _build_fallback_placements(self, valid_placements: list) -> list:
        """Build fallback placements when the LLM returns empty.
        Picks the first valid type for each unique location."""
        if not valid_placements:
            return []
        result = []
        seen = set()
        for p in valid_placements:
            loc = p.get("locationId", "")
            if loc and loc not in seen:
                result.append({"type": p.get("type", "A"),
                               "locationId": loc})
                seen.add(loc)
        return result

    @staticmethod
    def _sanitize_chat_message(text) -> str:
        """Clean LLM chat output before posting to a channel.

        Handles:
        - Meta-reasoning (e.g., "We need to decide: respond or PASS...")
        - Raw JSON output (e.g., [{"channelId": "global", "content": "..."}])
        - Self-invented channel prefixes (e.g., "Global Diplomacy — Country:")
        - Markdown bold markers (**text**)
        """
        import re

        if not text:
            return ""
        text = str(text).strip()

        # If the whole message is a JSON array with content fields, extract content
        if text.startswith("[{") or text.startswith("[ {"):
            try:
                import json as _json
                parsed = _json.loads(text)
                if isinstance(parsed, list) and len(parsed) > 0:
                    first = parsed[0]
                    if isinstance(first, dict) and "content" in first:
                        text = first["content"].strip()
            except Exception:
                pass

        # Strip any leading JSON fragment like [{"channelId": "global"}] that survived
        text = re.sub(r'^\[.*?\]\s*', '', text)

        # Strip markdown bold/strong markers
        text = text.replace("**", "")

        # Strip self-invented channel prefixes but KEEP the message body
        # Patterns: "[Global Diplomacy — Country]: message", "Global Diplomacy — Country: message"
        text = re.sub(
            r'^\[?Global Diplomacy\s*[—\-:]\s*\w+\]?\s*[:\-]?\s*',
            '', text, flags=re.IGNORECASE
        )

        # Strip meta-reasoning patterns
        # Remove lines that are clearly internal deliberation
        lines = text.split("\n")
        cleaned = []
        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue
            lower = stripped.lower()
            # Skip lines of meta-reasoning
            if any(phrase in lower for phrase in [
                # Original patterns
                "we need to decide",
                "respond or pass",
                "should we respond",
                "let me think",
                "i will respond",
                "the last message",
                "we are in the",
                "we should reply",
                # Patterns from observed leaks (nemotron + others)
                "we could respond",
                "we could reply",
                "might want to respond",
                "might want to reply",
                "respond acknowledging",
                "perhaps we should",
                "perhaps we could",
                "shall we respond",
                "let us respond",
                "should i respond",
                "we might respond",
                "i should respond",
                "maybe i should respond",
                "let me respond",
                "we could send",
                "we could say",
                "perhaps respond",
                "perhaps reply",
                "we might say",
                "i could respond",
                "i could reply",
                "we should respond",
                "i think we should",
                "we could also",
            ]):
                continue
            # Skip lines that start like internal deliberation
            # "We could ... as [Country]" pattern
            if re.match(r'^(we|i|they|he|she)\s+(could|might|should|would)\s', lower):
                continue
            # "[Country] might want to..." pattern
            if re.match(r'^\w+\s+might\s+(want|need|have)\s+to\s', lower):
                continue
            # Self-addressing: "Your Majesty, ..." when it's self-reflection
            # (too ambiguous to filter reliably, but catch obvious cases)
            if re.match(r'^(well|hmm|okay|alright|so|now|right|yes|no),?\s', lower):
                continue
            cleaned.append(stripped)

        result = " ".join(cleaned).strip()
        return result

# ─── Board Formatter ─────────────────────────────────────────────────

def format_board(state: dict) -> str:
    """Format game state as a compact boxed text map. Pure function, no I/O."""
    players = state.get("players", {})

    # Build all lines first to compute width
    lines = []
    header = f" BOARD — {state.get('season','?')} {state.get('year','?')} "
    lines.append(header)

    sorted_players = sorted(players.items(), key=lambda x: x[1].get("name", x[0]))
    for pid, p in sorted_players:
        name = p.get("name", pid)
        scs = p.get("supplyCenterCount", 0)
        player_units = p.get("units", {})

        unit_strs = []
        for uid, u in sorted(player_units.items(), key=lambda x: x[1].get("locationId", "")):
            unit_strs.append(f"{u.get('type','?')} {u.get('locationId','?')}")
        units_line = "  ".join(unit_strs) if unit_strs else "(eliminated)"
        status = "💀" if p.get("eliminated") else " "
        lines.append(f" {status} {name:<10} {scs}SC/{len(player_units)}U │ {units_line}")

    total_scs = sum(p.get("supplyCenterCount", 0) for p in players.values())
    neutral = 34 - total_scs
    footer = f" Neutral SCs remaining: {neutral}/34 "
    lines.append(footer)

    # Compute box width (min 50)
    inner_w = max(max(len(l) for l in lines), 50)

    result_lines = []
    result_lines.append("")  # leading blank line

    # Top border + header
    pad_top = (inner_w - len(header)) // 2
    result_lines.append(f"╔{'═' * inner_w}╗")
    result_lines.append(f"║{' ' * pad_top}{header}{' ' * (inner_w - len(header) - pad_top)}║")
    result_lines.append(f"╠{'═' * inner_w}╣")

    # Player lines
    for line in lines[1:-1]:  # skip header and footer
        result_lines.append(f"║{line}{' ' * (inner_w - len(line))}║")

    # Footer
    pad_foot = (inner_w - len(footer)) // 2
    result_lines.append(f"╠{'═' * inner_w}╣")
    result_lines.append(f"║{' ' * pad_foot}{footer}{' ' * (inner_w - len(footer) - pad_foot)}║")
    result_lines.append(f"╚{'═' * inner_w}╝")
    result_lines.append("")  # trailing blank line

    return "\n".join(result_lines)

# ─── Orchestrator ───────────────────────────────────────────────────

class Orchestrator:
    def __init__(self, config: dict, api_key: str):
        self.config = config
        self.game_cfg = config["game"]
        self.llm = LLMClient(api_key)
        self.bridge = EngineBridge()
        
        self.agents = {}
        fallback_model = self.game_cfg.get("fallback_model")
        for pid, acfg in config["agents"].items():
            self.agents[pid] = DiplomacyAgent(
                pid, acfg, config["global_instructions"], self.llm, self.bridge,
                fallback_model=fallback_model,
            )
        
        self.neg_window = self.game_cfg["negotiation_window_seconds"]
        self.max_msgs = self.game_cfg["max_negotiation_messages_per_agent"]
        self.max_years = self.game_cfg["max_years"]
        
        # Cross-turn summary persistence
        self.summaries = SummaryManager(str(SCRIPT_DIR / "summaries"))
        self.summaries.wipe_all()
    
    def run(self):
        print("=" * 60)
        print("  DIPLOMACY AI ORCHESTRATOR")
        print("  Seven AI powers. OpenRouter. No mercy.")
        print("=" * 60)
        print()
        
        # Initialize the reasoning log
        DiplomacyAgent.init_reasoning_log(SCRIPT_DIR)

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
                    self._print_board()
                    
                    
                    # Generate cross-turn summaries for all agents
                    self._generate_summaries(state, result)
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
                    self._print_board()
                
                else:
                    print(f"  Unknown phase: {phase}")
                    break
        finally:
            self.bridge.shutdown()
    
    def _print_board(self):
        """Print a compact text map of the current board state."""
        state = self.bridge.get_state()
        print(format_board(state))
        print()

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
                    # LLM returned empty — use fallback: first valid type per location
                    view = self.bridge.get_player_view(pid)
                    valid = view.get("validPlacements", [])
                    placements = agent._build_fallback_placements(valid)
                    if placements:
                        self.bridge.submit_placements(pid, placements)
                        print(f"  ⚠ {agent.country_name}: fallback placements used")
                        for p in placements:
                            print(f"      {p.get('type', '?')} at {p.get('locationId', '?')}")
                    else:
                        print(f"  ⚠ {agent.country_name}: no valid placements available")
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
        
        # Load cross-turn summaries for all agents
        for pid, agent in self.agents.items():
            summary = self.summaries.load(pid)
            if summary:
                agent.current_summary_text = json.dumps(summary, indent=2)
            else:
                agent.current_summary_text = None

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
                # generate_orders() always returns a valid list (HOLD fallback built-in)
                self.bridge.submit_orders(pid, orders)
                print(f"  ✓ {agent.country_name}: {len(orders)} orders")
                for o in orders:
                    uid = o.get('unitId')
                    otype = o.get('type')
                    if otype == 'MOVE':
                        tgt = o.get('targetLocationId', '?')
                        print(f"      {uid}: MOVE → {tgt}")
                    elif otype == 'SUPPORT':
                        sup_u = o.get('supportUnitId', '?')
                        sup_ot = o.get('supportOrderType', '?')
                        sup_tgt = o.get('supportTargetLocationId', '')
                        if sup_ot == 'MOVE' and sup_tgt:
                            print(f"      {uid}: SUPPORT {sup_u} MOVE → {sup_tgt}")
                        else:
                            print(f"      {uid}: SUPPORT {sup_u} {sup_ot}")
                    else:
                        print(f"      {uid}: {otype}")
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

                if delta > 0:
                    print(f"  {agent.country_name}: +{delta} in {valid_builds}")
                else:
                    print(f"  {agent.country_name}: disband {abs(delta)}")

                builds = agent.generate_builds(delta, valid_builds)

                if builds:
                    self.bridge.submit_build(pid, builds)
                    for b in builds:
                        print(f"    {b.get('type')}: {b.get('unitType', '')} {b.get('locationId', '')}")
                else:
                    # Fallback: auto-pick first N valid builds or units to destroy
                    if delta > 0 and valid_builds:
                        builds = [
                            {"type": "CREATE", "unitType": "A", "locationId": valid_builds[i]}
                            for i in range(min(delta, len(valid_builds)))
                        ]
                        self.bridge.submit_build(pid, builds)
                        print(f"  ⚠ {agent.country_name}: auto-fallback builds used")
                        for b in builds:
                            print(f"    {b.get('type')}: {b.get('unitType', '')} {b.get('locationId', '')}")
                    elif delta < 0:
                        disband_units = list(units.items())[:abs(delta)]
                        builds = [
                            {"type": "DESTROY", "locationId": u.get("locationId")}
                            for _, u in disband_units
                        ]
                        self.bridge.submit_build(pid, builds)
                        print(f"  ⚠ {agent.country_name}: auto-fallback disbands used")
                        for b in builds:
                            print(f"    {b.get('type')}: {b.get('locationId', '')}")
            except Exception as e:
                print(f"  ⚠ {agent.country_name} build err: {e}")

    # _get_builds_with_retry is no longer used — kept for compatibility
    def _get_builds_with_retry(self, agent, base_prompt: str, delta: int,
                                valid_builds: list, units: dict) -> list:
        """DEPRECATED: Use generate_builds() instead. Kept for test compatibility."""
        builds = agent.generate_builds(delta, valid_builds)
        if builds:
            return builds
        return []
    
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


    def _format_resolution_for_summary(self, resolution: dict) -> str:
        """Convert resolution dict into a human-readable text block for the LLM."""
        parts = []
        moves = resolution.get("successfulMoves", [])
        bounced = resolution.get("bouncedMoves", [])
        dislodged = resolution.get("dislodgedUnits", [])
        destroyed = resolution.get("destroyedUnits", [])

        for m in moves:
            parts.append(f"  {m['unitId']}: moved from {m['fromLocationId']} -> {m['toLocationId']}")
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
            lines_list = []
            for ch in channels:
                msgs = self.bridge.chat_get_messages(ch["id"])
                for m in msgs:
                    sender = m.get("senderName", m.get("senderId", "?"))
                    cnt = m.get("content", "")[:200]
                    ch_name = ch.get("name", ch.get("id", "?"))
                    lines_list.append(f"[{ch_name} -- {sender}]: {cnt}")
            return "\n".join(lines_list)
        except Exception:
            return "(chat log unavailable)"

    def _generate_summaries(self, state, result):
        """Generate post-resolution summaries for all non-eliminated agents in parallel."""
        season = state.get("season", "?")
        year = state.get("year", "?")
        turn_label = f"{season} {year}"

        resolution = result.get("result", {})
        resolution_text = self._format_resolution_for_summary(resolution)
        fallback_model = self.game_cfg.get("fallback_model")

        def summarize_one(agent):
            try:
                player = state.get("players", {}).get(agent.player_id, {})
                if player.get("eliminated"):
                    return

                chat_log = self._get_agent_chat_log(agent.player_id)
                board_state = agent._get_state_text()
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
                    fallback_model=fallback_model,
                )

                if summary:
                    self.summaries.save(agent.player_id, summary)
                    print(f"  [summary] {agent.country_name}: summary updated", flush=True)
                else:
                    print(f"  [summary] {agent.country_name}: summary generation failed", flush=True)
            except Exception as e:
                print(f"  [summary] {agent.country_name}: summary error: {e}", flush=True)

        print("\n  --- GENERATING SUMMARIES (parallel, 120s timeout) ---")

        th_list = []
        for agent in self.agents.values():
            t = threading.Thread(target=summarize_one, args=(agent,), daemon=True)
            t.start()
            th_list.append(t)

        deadline = time.time() + 120  # 2 minutes
        for t in th_list:
            remaining = deadline - time.time()
            if remaining > 0:
                t.join(timeout=remaining)
            if t.is_alive():
                print(f"  [summary] Summary generation timed out for an agent", flush=True)

        print(f"  [summary] Summaries generated", flush=True)

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
