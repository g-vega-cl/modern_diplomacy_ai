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
pnpm test                          # 126 tests: 112 engine + 14 bridge
python3 ai-orchestrator/__tests__/test_orchestrator.py  # 19 orchestrator tests

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
| `getState` | — | `{state: {year, season, phase, players, units, retreatsNeeded}}` |
| `getPlayerView` | `{playerId}` | `{view: {player, visibleUnits, validMoves, validBuilds}}` |
| `submitOrders` | `{playerId, orders}` | `{}` |
| `resolve` | — | `{result: {successfulMoves, bouncedMoves, dislodgedUnits}, winner, nextPhase}` |
| `submitRetreat` | `{unitId, locationId?, disband?}` | `{phase}` |
| `submitBuild` | `{playerId, builds}` | `{}` |
| `advanceBuilds` | — | `{phase}` |
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
│ SPRING ORDER                                        │
│  1. All 7 agents receive board state + valid moves  │
│  2. 21 private DM channels are pre-created           │
│     (one for each pair of powers)                    │
│  3. 240s negotiation window (parallel threads)       │
│     → agents chat in global + private DM channels    │
│     → agents see which channel each message is in    │
│  4. Window closes, each agent generates orders       │
│  5. All orders submitted simultaneously to engine    │
│  6. Engine resolves (supports, combat, standoffs)   │
├─────────────────────────────────────────────────────┤
│ RETREAT (if any units dislodged)                    │
│  7. Each dislodged unit retreats or disbands        │
├─────────────────────────────────────────────────────┤
│ FALL ORDER (same as spring)                         │
├─────────────────────────────────────────────────────┤
│ WINTER BUILDS                                       │
│  8. Delta (SCs - units): build or disband           │
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
    "max_years": 20
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

**Supported OpenRouter models (any from [openrouter.ai/models](https://openrouter.ai/models)):**

Current lineup in `agents.json`:
| Country | Model |
|---------|-------|
| England | `deepseek/deepseek-v4-flash` |
| France | `qwen/qwen3.6-flash` |
| Germany | `nvidia/nemotron-3-super-120b-a12b` |
| Italy | `stepfun/step-3.5-flash` |
| Austria | `minimax/minimax-m2.5` |
| Russia | `xiaomi/mimo-v2-flash` |
| Turkey | `openai/gpt-5.4-nano` |

Other popular options: `anthropic/claude-sonnet-4`, `openai/gpt-4o`, `google/gemini-2.5-pro`, `meta-llama/llama-4-maverick`, `deepseek/deepseek-r1`.

## Files

| File | Purpose |
|------|---------|
| `orchestrator.py` | Main game loop, DiplomacyAgent, LLMClient, EngineBridge |
| `engine-bridge.ts` | Node.js subprocess wrapping the TypeScript Diplomacy engine |
| `agents.json` | Country → OpenRouter model + persona + game settings |
| `__tests__/engine-bridge.test.ts` | 14 tests for the JSON-line bridge protocol |
| `__tests__/test_orchestrator.py` | 19 tests for config, parsing, prompts, None-guard |

## Troubleshooting

**"OPENROUTER_API_KEY not set"**
```bash
export OPENROUTER_API_KEY=sk-or-v1-...
```

**"Bridge failed to start"**
Make sure `pnpm install` has been run in the repo root. The bridge needs `tsx` (in devDependencies).

**Agents produce invalid orders**
The orchestrator falls back to HOLD orders if an agent's JSON can't be parsed. Check the stderr output for the raw LLM response.

**"NoneType" errors in negotiation or placement**
Some flash-tier models occasionally return `null` content from OpenRouter. The orchestrator handles this gracefully — empty responses cause a PASS in negotiation or a fallback empty list in placement/order parsing. If a model consistently returns null, swap it for a more reliable one.

**Rate limiting / costs**
Each negotiation message costs ~200-300 tokens. At 15 messages/agent × 7 agents × 2 phases × ~20 years, a full game could use ~100K-200K input tokens. Set lower `max_negotiation_messages_per_agent` or `max_years` to control costs.

## Dependencies

Zero Python dependencies — stdlib only (json, subprocess, threading, urllib).

Requires:
- Python 3.9+
- Node.js 18+
- `pnpm install` in repo root
- OpenRouter API key
