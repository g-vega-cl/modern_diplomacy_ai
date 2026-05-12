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
pnpm test                          # 127 tests: 112 engine + 15 bridge
python3 ai-orchestrator/__tests__/test_orchestrator.py  # 37 orchestrator tests

# Individual suites
pnpm vitest run ai-orchestrator/__tests__/engine-bridge.test.ts
pnpm vitest run src/engine/__tests__/
```

## Architecture

```
orchestrator.py (Python, stdlib only)
├── 7× DiplomacyAgent (threads)
│     └── OpenRouter API → LLM models (Claude, GPT-4o, Gemini, etc.)
├── LLMClient → https://openrouter.ai/api/v1/chat/completions
└── EngineBridge (subprocess)
      └── npx tsx engine-bridge.ts → DiplomacyEngine (TypeScript)
            └── In-memory ChatManager (negotiation channels + messages)
```

### Engine Bridge Protocol

The `engine-bridge.ts` is a JSON-line subprocess. Each command is a JSON object on stdin, response on stdout.

**Game Commands:**
| Method | Params | Returns |
|--------|--------|---------|
| `reset` | — | `{}` |
| `getState` | — | `{state: {year, season, phase, players, units, retreatsNeeded, supplyCenterOwners}}` |
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
│  4. Window closes, each agent generates orders       │
│     (with retry on parse failure: LLM gets a         │
│     second attempt with loud formatting warning)     │
│  5. All orders submitted simultaneously to engine    │
│  6. Engine resolves (supports, combat, standoffs)   │
│     → RESOLUTION is an internal phase; the bridge   │
│       auto-advances to RETREAT/BUILD/next ORDER     │
│     → Same-power duplicate destination moves are    │
│       detected and both units bounce               │
├─────────────────────────────────────────────────────┤
│ RETREAT (if any units dislodged)                    │
│  7. Each dislodged unit retreats or disbands        │
├─────────────────────────────────────────────────────┤
│ FALL ORDER (same as spring)                         │
├─────────────────────────────────────────────────────┤
│ WINTER BUILDS                                       │
│  8. Supply center ownership recalculated: any unit   │
│     sitting on a SC claims it; empty SCs keep        │
│     previous owner (tracked per-center, not just     │
│     incrementing). Delta (SCs - units): build or     │
│     disband. Build count is validated by engine       │
│     and orchestrator with retry + auto-fallback.     │
├─────────────────────────────────────────────────────┤
│ NEXT YEAR (repeat until 18 SCs or max years)        │
└─────────────────────────────────────────────────────┘
```

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

## Files

| File | Purpose |
|------|---------|
| `orchestrator.py` | Main game loop, DiplomacyAgent, LLMClient (with fallback retry), EngineBridge |
| `engine-bridge.ts` | Node.js subprocess wrapping the TypeScript Diplomacy engine |
| `agents.json` | Country → OpenRouter model + persona + fallback_model + game settings |
| `__tests__/engine-bridge.test.ts` | 14 tests for the JSON-line bridge protocol |
| `__tests__/test_orchestrator.py` | 37 tests: config, parsing, prompts, fallback model, chat sanitization |

## Troubleshooting

**"OPENROUTER_API_KEY not set"**
```bash
export OPENROUTER_API_KEY=sk-or-v1-...
```

**"Bridge failed to start"**
Make sure `pnpm install` has been run in the repo root. The bridge needs `tsx` (in devDependencies).

**Agents produce invalid orders or empty responses**
The orchestrator has multiple fallback and retry layers:

1. **LLM fallback**: If the primary model returns empty content, the `fallback_model` (default: `openai/gpt-5.4-nano`) is tried automatically on a different model.
2. **Parse retry**: If the LLM response isn't valid JSON (e.g., reasoning prose instead of structured output), the prompt is retried once with a loud formatting warning block asking for `[...]` JSON only. This catches models like Nemotron that output their internal deliberation.
3. **Placement fallback**: If all retries fail for placements, valid placements are auto-selected (first valid type per home center).
4. **Order fallback**: If all retries fail for orders, all units are set to HOLD.
5. **Build count validation**: The engine enforces that CREATE orders don't exceed the supply center surplus, and DESTROY orders don't exceed the deficit. The orchestrator validates count pre-submission and retries once on mismatch. If both attempts fail, an auto-fallback picks the first N valid home centers.
6. **Chat sanitization**: Messages that contain meta-reasoning, raw JSON, or markup are automatically cleaned before posting.

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
