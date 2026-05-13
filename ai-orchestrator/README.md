# Diplomacy AI Orchestrator

Seven AI models play Diplomacy against each other. Each country gets its own OpenRouter model with a unique persona. They negotiate in chat, then simultaneously submit orders — just like the real board game.

## Quick Start

```bash
# 1. Install deps (repo root)
pnpm install

# 2. Set your OpenRouter API key
export OPENROUTER_API_KEY=sk-or-v1-...

# 3. Run the orchestrator
python3 ai-orchestrator/orchestrator.py
```

## Running Tests

```bash
# All tests (TypeScript engine + bridge + Python orchestrator)
pnpm test                          # 131 tests: 114 engine + 17 bridge
python3 -m unittest discover -s ai-orchestrator/__tests__ -p "test_*.py" -v  # 105 orchestrator tests

# Individual suites
pnpm vitest run ai-orchestrator/__tests__/engine-bridge.test.ts
pnpm vitest run src/engine/__tests__/
```

## Architecture

```
orchestrator.py (Python, stdlib only)
├── 7× DiplomacyAgent (threads)
│     └── OpenRouter API → LLM models (Claude, GPT-4o, Gemini, etc.)
│           └── Tool-calling loop: agents explore state via validated tools
│               before submitting orders (ORDER phase)
├── AgentTools → validates orders AND builds at call time, buffers submissions
├── SummaryManager → cross-turn strategic memory (JSON summaries per country)
├── LLMClient → chat_with_tools() multi-turn tool loop + plain chat()
└── EngineBridge (subprocess)
      └── npx tsx engine-bridge.ts → DiplomacyEngine (TypeScript)
            └── In-memory ChatManager (negotiation channels + messages)
```

### ORDER Phase: Tool-Based Submission

Instead of receiving a text dump and being told to "output JSON only", agents now use OpenRouter's tool-calling API with validated function tools:

| Tool | Purpose |
|------|---------|
| `get_my_units` | List agent's units (type, location, order status) |
| `get_valid_moves` | Valid move destinations for a specific unit |
| `get_visible_units` | All units on the board (friendly + enemy) |
| `get_supply_centers` | Supply center ownership info |
| `submit_order` | Submit one order (validates unit ownership + move legality) |
| `cancel_order` | Remove a previously submitted order |
| `finalize_orders` | Signal completion (checks all units have orders) |

Validation happens at tool-call time — if an agent tries to move to an invalid territory or submit orders for an enemy unit, the tool returns an error immediately. The agent can self-correct in the same conversation turn. No JSON parsing, no retry prompts, no format-scolding.

### BUILD Phase: Tool-Based Submission

The build phase also uses the tool-calling API with validated tools (as of May 2026):

| Tool | Purpose |
|------|---------|
| `get_my_units` | List agent's current units (type, location) |
| `get_valid_builds` | Open home centers with province types and fleet eligibility |
| `get_supply_centers` | Supply center ownership info |
| `submit_build` | CREATE a unit in an open home center, or DESTROY an existing unit |
| `cancel_build` | Remove a previously submitted build action |
| `finalize_builds` | Signal completion (validates correct number of builds vs SC delta) |

Build validation is multi-layered:
- **Tool level**: `submit_build` rejects invalid locations, duplicate builds in the same center, bad unit types, and DESTROY targeting enemy units
- **Engine level**: `submitBuild()` rejects CREATE in already-occupied locations and enforces build count limits
- **Bridge level**: Unit locations are synced between top-level and player-level maps so board display always reflects post-resolution positions

### Engine Bridge Protocol

The `engine-bridge.ts` is a JSON-line subprocess. Each command is a JSON object on stdin, response on stdout.

**Game Commands:**
| Method | Params | Returns |
|--------|--------|---------|
| `reset` | — | `{}` |
| `getState` | — | `{state: {year, season, phase, players, units, retreatsNeeded, provinces, supplyCenterOwners}}` |
| `getPlayerView` | `{playerId}` | `{view: {player, visibleUnits, validMoves, validBuilds, validPlacements}}` |
| `submitPlacements` | `{playerId, placements}` | `{}` |
| `submitOrders` | `{playerId, orders}` | `{}` |
| `resolve` | — | `{result: {successfulMoves, bouncedMoves, dislodgedUnits}, winner, nextPhase}` |
| `submitRetreat` | `{unitId, locationId?, disband?}` | `{phase}` |
| `submitBuild` | `{playerId, builds}` | `{}` (throws if build count exceeds SC delta) |
| `advanceBuilds` | — | `{phase}` |
| `advancePhase` | — | `{phase}` |
| `getStatus` | — | `{status: {winner, phase, currentSeason, currentYear}}` |

**Chat Commands:**
| Method | Params | Returns |
|--------|--------|---------|
| `chat_getChannels` | `{playerId}` | `{channels: [...]}` |
| `chat_getMessages` | `{channelId, since?}` | `{messages: [...]}` |
| `chat_sendMessage` | `{channelId, senderId, senderName, content}` | `{message: {...}}` |
| `chat_createGroup` | `{name, createdBy, memberIds}` | `{channel: {...}}` |

## Game Flow (per year)

```
┌─────────────────────────────────────────────────────┐
│ PLACEMENT (first year only)                         │
│  0. Each AI chooses starting unit positions          │
│     (army vs fleet per home supply center)           │
│     Retry on parse failure, then fallback to         │
│     auto-placement if LLM returns empty              │
├─────────────────────────────────────────────────────┤
│ SPRING ORDER                                        │
│  1. All 7 agents receive board state + valid moves  │
│  2. 21 private DM channels are pre-created           │
│     (one for each pair of powers)                    │
│  3. 240s negotiation window (parallel threads)       │
│     → agents chat in global + private DM channels    │
│     → messages are sanitized before posting to      │
│       strip meta-reasoning, JSON, and markup         │
│  4. Window closes, each agent enters tool loop:      │
│     → calls get_my_units, get_valid_moves, etc.     │
│     → submits orders via submit_order tool          │
│     → validates at call time (no parsing needed)    │
│     → calls finalize_orders when done               │
│     → HOLD fallback if tool loop produces nothing   │
│  5. All orders submitted simultaneously to engine    │
│  6. Engine resolves (supports, combat, standoffs)   │
│     → RESOLUTION is an internal phase; the bridge   │
│       auto-advances to RETREAT/BUILD/next ORDER     │
│     → Same-power duplicate destination moves are    │
│       detected and both units bounce               │
│  7. Cross-turn summary generation (parallel)        │
│     → Each agent generates a structured JSON        │
│       summary: alliances, deals, betrayals, plans   │
│     → Saved to summaries/{country}.json             │
│     → Injected as context next turn (negotiation    │
│       AND order generation)                         │
├─────────────────────────────────────────────────────┤
│ RETREAT (if any units dislodged)                    │
│  8. Each dislodged unit retreats or disbands        │
├─────────────────────────────────────────────────────┤
│ FALL ORDER (same as spring)                         │
├─────────────────────────────────────────────────────┤
│ WINTER BUILDS                                       │
│  9. Supply center ownership recalculated: any unit   │
│     sitting on a SC claims it; empty SCs keep        │
│     previous owner (tracked per-center, not just     │
│     incrementing). Delta (SCs - units): build or     │
│     disband.                                       │
│ 10. Each agent enters tool loop:                    │
│     → calls get_my_units, get_valid_builds           │
│     → submits builds via submit_build tool           │
│     → validates at call time (location, type, count)│
│     → calls finalize_builds when done               │
│     → Engine also rejects occupied locations        │
│     → Auto-fallback picks first N valid centers     │
├─────────────────────────────────────────────────────┤
│ NEXT YEAR (repeat until 18 SCs or max years)        │
└─────────────────────────────────────────────────────┘
```

## Cross-Turn Summary Log

Each agent maintains a persistent strategic memory across turns via structured JSON summaries. Instead of re-reading the full negotiation history every turn (which would bloat context), agents consume their summary + the current turn's chat.

### How It Works

```
After each ORDER resolution:
  ┌─────────────────────────────────────┐
  │ 1. All 7 agents run in parallel     │
  │    (2-minute timeout)               │
  │ 2. Each agent calls its LLM with:   │
  │    • Board state                    │
  │    • This turn's full chat log      │
  │    • Resolution results             │
  │    • Previous summary (if any)      │
  │ 3. LLM produces updated JSON        │
  │ 4. Saved to summaries/{country}.json│
  └─────────────────────────────────────┘

Next negotiation:
  ┌─────────────────────────────────────┐
  │ • Summary loaded and injected as    │
  │   "YOUR STRATEGIC MEMORY"           │
  │ • Agents see: summary + live chat   │
  │ • Summary also injected into order  │
  │   generation prompt                 │
  └─────────────────────────────────────┘
```

### Summary JSON Format

```json
{
  "country": "england",
  "last_updated": "Fall 1901 (after resolution)",
  "alliances": [
    {"country": "germany", "status": "active",
     "since_turn": "Spring 1901", "notes": "Mutual defense pact"}
  ],
  "deals": [
    {"country": "germany", "deal": "Germany supports my fleet into Denmark",
     "my_part": "I leave Holland to Germany",
     "turn_made": "Spring 1901", "status": "fulfilled"}
  ],
  "betrayals": [
    {"country": "france", "incident": "Promised support into Belgium but held instead",
     "turn": "Fall 1901"}
  ],
  "long_term_plan": "Eliminate France with German help, then push east.",
  "turn_history": [
    {"turn": "Spring 1901", "summary": "Opened F NTH, A YOR. Allied with Germany."},
    {"turn": "Fall 1901", "summary": "Took Norway. France betrayed me in Belgium."}
  ]
}
```

**Fields:**
| Field | Purpose |
|-------|---------|
| `alliances` | Active pacts: status = `active`, `broken`, or `tentative` |
| `deals` | Specific agreements: status = `pending`, `fulfilled`, or `betrayed` |
| `betrayals` | When another power breaks a deal or attacks unexpectedly |
| `long_term_plan` | 2-3 sentence strategic vision (private — only this agent sees it) |
| `turn_history` | Chronological log, capped at last 8 turns (2 years) |

**Storage:** Summaries live in `ai-orchestrator/summaries/{country}.json`, wiped at game start. The directory is gitignored.

**Schema validation:** Corrupted or malformed summaries are rejected at save time — each summary must have all 7 required fields with correct types before writing to disk.

## Board Display

After each resolution and after each build phase, the orchestrator prints a compact boxed map to stdout:

```
╔══════════════════════════════════════════════════╗
║            BOARD — Spring 1901                   ║
╠══════════════════════════════════════════════════╣
║   Austria    3SC/3U │ F TRI  A VIE  A BUD        ║
║   England    3SC/3U │ F EDI  F LON  A LVP        ║
║   France     3SC/3U │ F BRE  A PAR  A MAR        ║
║   Germany    3SC/3U │ A BER  F KIE  A MUN        ║
║   Italy      3SC/3U │ F NAP  A ROM  A VEN        ║
║   Russia     4SC/4U │ F STP  A MOS  A WAR  A SEV ║
║   Turkey     3SC/3U │ F ANK  A CON  A SMY        ║
╠══════════════════════════════════════════════════╣
║         Neutral SCs remaining: 12/34             ║
╚══════════════════════════════════════════════════╝
```

For each power: eliminated status (💀), name, supply center count, unit count, and every unit with type + location. Eliminated powers show "(eliminated)". The box auto-sizes to fit the widest line. The `format_board()` function is a pure function (no I/O) and is tested independently.

**Data contract:** `format_board()` reads each player's `units` dict from the `getState` response. The bridge's `serializeState()` now includes per-player units alongside the top-level `units` map so the board can display which units each power controls.

## Configuration (agents.json)

```json
{
  "game": {
    "negotiation_window_seconds": 240,
    "max_negotiation_messages_per_agent": 15,
    "max_years": 20,
    "fallback_model": "openai/gpt-5.4-nano"
  },
  "global_instructions": "Full system prompt template with {country_name}",
  "agents": {
    "england": {
      "model": "deepseek/deepseek-v4-flash",
      "country_name": "England",
      "persona": "You are the British Empire..."
    },
    "france": {
      "model": "qwen/qwen3.6-flash",
      "country_name": "France",
      "persona": "You are the French Republic..."
    }
    // ... 5 more countries
  }
}
```

`fallback_model`: When any agent's primary model returns empty/null content from OpenRouter, the orchestrator automatically retries with this model. This is a safety net for flash-tier or unreliable models. Set to `null` to disable.

**Chat message sanitization:** All agent chat messages are automatically cleaned before posting:
- Meta-reasoning is stripped (e.g., "We need to decide: respond or PASS...")
- Markdown formatting markers removed (`**bold**`)
- Raw JSON wrappers extracted (e.g., `[{"channelId":"global","content":"..."}]`)
- Self-invented channel prefixes removed (`[Global Diplomacy — Country]:`)

**Supported OpenRouter models (any from [openrouter.ai/models](https://openrouter.ai/models)):**

Current lineup in `agents.json`:
| Country | Model |
|---------|-------|
| England | `deepseek/deepseek-v4-flash` |
| France | `qwen/qwen3.6-flash` |
| Germany | `nvidia/nemotron-3-super-120b-a12b` |
| Italy | `deepseek/deepseek-v4-flash` |
| Austria | `minimax/minimax-m2.5` |
| Russia | `xiaomi/mimo-v2-flash` |
| Turkey | `openai/gpt-5.4-nano` |

Other popular options: `anthropic/claude-sonnet-4`, `openai/gpt-4o`, `google/gemini-2.5-pro`, `meta-llama/llama-4-maverick`, `deepseek/deepseek-r1`.

## Agent Prompts

Each agent receives a `_get_state_text()` prompt before generating orders. This includes:

- Current year, season, and phase
- The player's supply center count
- Each unit with its location, type, and valid MOVE destinations
- **ORDER OPTIONS reminder:** HOLD (always valid), MOVE (advertised destinations only), SUPPORT (adjacent friendly unit's MOVE or HOLD)
- Full visible unit list (all units on the board)

This ensures agents know they can HOLD or SUPPORT even when no move destinations are available — without relying on the order-generation prompt to teach the rules from scratch.

## Files

| File | Purpose |
|------|---------|
| `orchestrator.py` | Main game loop, DiplomacyAgent, LLMClient (with fallback retry + tool-calling loop), EngineBridge, SummaryManager integration |
| `summary_manager.py` | Cross-turn summary persistence: JSON I/O, schema validation, LLM-driven summary generation |
| `agent_tools.py` | Tool definitions + dispatcher: validates and buffers orders (ORDER phase) and builds (BUILD phase) |
| `engine-bridge.ts` | Node.js subprocess wrapping the TypeScript Diplomacy engine |
| `agents.json` | Country → OpenRouter model + persona + fallback_model + game settings |
| `__tests__/engine-bridge.test.ts` | 17 tests for the JSON-line bridge protocol (including board sync) |
| `__tests__/test_orchestrator.py` | 55 tests: config, parsing, prompts, fallback model, chat sanitization, board display, state text, tool-based order generation |
| `__tests__/test_agent_tools.py` | 32 tests for all tool methods (20 order + 12 build) + input validation |
| `__tests__/test_tool_client.py` | 2 tests for the chat_with_tools tool-calling loop |
| `__tests__/test_summary.py` | 16 tests: file I/O, validation, LLM generation, integration |
| `summaries/` | Per-country JSON summaries (gitignored, wiped at game start) |

## Troubleshooting

**"OPENROUTER_API_KEY not set"**
```bash
export OPENROUTER_API_KEY=sk-or-v1-...
```

**"Bridge failed to start"**
Make sure `pnpm install` has been run in the repo root. The bridge needs `tsx` (in devDependencies).

**Agents produce invalid orders or empty responses**

The orchestrator has multiple fallback and retry layers:

1. **Tool-based validation (ORDER phase)**: Agents submit orders via validated tool calls. Invalid moves or enemy units are rejected at call time with clear error messages — the agent self-corrects in the same turn. No JSON parsing needed for orders.
2. **Tool-based validation (BUILD phase)**: Agents submit builds via validated tool calls. Invalid locations, duplicate builds, wrong counts, and bad unit types are rejected at call time. Engine also enforces occupancy validation — no two units in the same tile.
3. **LLM fallback**: If the primary model returns empty content, the `fallback_model` (default: `openai/gpt-5.4-nano`) is tried automatically.
4. **HOLD fallback (ORDER phase)**: If the tool loop produces no orders (exhausted max_turns, unresponsive model), all units default to HOLD.
5. **Parse retry (placement phase only)**: If the LLM response isn't valid JSON, the prompt is retried once with a formatting warning. Placement is the only remaining JSON-based phase.
6. **Placement fallback**: If all retries fail for placements, valid placements are auto-selected (first valid type per home center).
7. **Build fallback**: If the tool loop produces no builds, an auto-fallback picks the first N valid home centers (for CREATE) or disbands the first N units (for DESTROY).
8. **Chat sanitization**: Messages that contain meta-reasoning, raw JSON, or markup are automatically cleaned before posting.

Check the stderr output for the raw LLM response if debugging is needed.

**"NoneType" errors in negotiation or placement**
These are now handled at two levels: the `fallback_model` retry (catches most transient failures) and the code-level fallbacks described above. If a model consistently returns null even with fallback, swap it in `agents.json`.

**Rate limiting / costs**
Each negotiation message costs ~200-300 tokens. At 15 messages/agent × 7 agents × 2 phases × ~20 years, a full game could use ~100K-200K input tokens. Set lower `max_negotiation_messages_per_agent` or `max_years` to control costs.

## Dependencies

Zero Python dependencies — stdlib only (json, subprocess, threading, urllib).

Requires:
- Python 3.9+
- Node.js 18+
- `pnpm install` in repo root
- OpenRouter API key
