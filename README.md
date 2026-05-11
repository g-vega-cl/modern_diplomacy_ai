# Modern Diplomacy AI

TypeScript game engine + AI agent orchestration for the classic board game Diplomacy.

- **[AI Orchestrator](#ai-orchestrator)** — Seven AI models play against each other via OpenRouter, with negotiation and simultaneous order resolution.
- **[Diplomacy Light](#diplomacy-light-engine)** — A complete adjudication engine for Diplomacy, with an interactive terminal CLI.


---

## AI Orchestrator

Seven AI powers. OpenRouter. No mercy.

Each country is played by a different LLM model (Claude, GPT-4o, Gemini, etc.) with a unique persona. Agents negotiate in real-time chat, then simultaneously submit orders — just like the real board game.

### Quick Start

```bash
export OPENROUTER_API_KEY=sk-or-v1-...
python3 ai-orchestrator/orchestrator.py
```

See [ai-orchestrator/README.md](ai-orchestrator/README.md) for full configuration and model options.


---

## Diplomacy Light Engine

A deterministic, simultaneous-move game engine implementing a simplified version of the classic Diplomacy board game. Pure TypeScript, zero dependencies, 80 tests.

### Quick Start

```bash
pnpm install
pnpm test          # Run all 80 tests
pnpm play          # Play interactively in the terminal
```

### The Game

Seven Great Powers compete for control of Europe (1901):

| Power | Home Centers | Default Starting Units |
|-------|-------------|------------------------|
| England | EDI, LON, LVP | F LON, F EDI, A LVP |
| France | BRE, MAR, PAR | F BRE, A PAR, A MAR |
| Germany | BER, KIE, MUN | F KIE, A BER, A MUN |
| Italy | NAP, ROM, VEN | F NAP, A ROM, A VEN |
| Austria | VIE, TRI, BUD | F TRI, A VIE, A BUD |
| Russia | MOS, SEV, STP, WAR | F STP(NC), A MOS, A WAR, A SEV |
| Turkey | ANK, CON, SMY | F ANK, A CON, A SMY |

During the **placement phase**, players may customize unit types and positions on their home supply centers (coastal SCs allow fleets; inland SCs are army-only).

**Victory:** Control 18 of 34 supply centers, or be the last power standing.

### How to Play (CLI)

```bash
pnpm play
```

**Placement Phase:** Each power places their units on their home supply centers (most have 3; Russia has 4), choosing army or fleet per center.

```
A PAR    — Place army in Paris
F BRE    — Place fleet in Brest
```

Coastal home SCs accept fleets or armies; inland home SCs are army-only. After all 7 powers place their units, the ORDER phase begins.

**Order Phase:** Players take turns entering orders in sequence. All orders are resolved simultaneously per standard Diplomacy rules.

**Order syntax:**

```
A PAR -> BUR            Move army from Paris to Burgundy
A PAR H                 Hold
A MAR S A PAR -> BUR    Support A_PAR to move to Burgundy
A MAR S A_PAR           Support A_PAR to hold
F ENG -> NTH            Move fleet
F MAO -> SPA_NC         Fleet to Spain north coast (coast required for SPA/STP/BUL)

done   — Finish your turn
help   — Command reference
quit   — Exit
```

### Game Flow

```
PLACEMENT → SPRING ORDER → RESOLUTION → RETREAT → FALL ORDER → RESOLUTION → RETREAT → BUILD → next year
```

Phases: **PLACEMENT** (players choose unit types and starting positions on their home SCs), **ORDER** (all players submit), **RESOLUTION** (engine adjudicates), **RETREAT** (dislodged units), **BUILD** (build/disband units based on SC count, fall only).

### Engine Architecture

```
src/engine/
  config.ts         — Game constants, starting positions, home SCs
  types.ts          — All enums (ProvinceType, UnitType, OrderType, Phase) + interfaces
  provinces.ts      — Full 75-territory classic Diplomacy map (81 entries inc. coast subs)
  victory.ts        — Victory at 18 SCs or sole survivor
  movement.ts       — Army/fleet movement validation (coast-aware)
  supply.ts         — Supply center ownership (fall) + build/disband math
  resolution.ts     — Core adjudication: supports, combat, dislodgements
  state-machine.ts  — Phase transitions
  engine.ts         — DiplomacyEngine: public API
  index.ts          — Barrel exports

src/cli/
  index.ts          — Interactive game loop
  display.ts        — Terminal rendering
  parser.ts         — Text order parser

src/engine/__tests__/  — 80 tests across 7 files
```

### API Usage

```typescript
import { DiplomacyEngine, Phase, UnitType, OrderType } from "./engine";

const engine = new DiplomacyEngine();

// Start with placement phase (players choose units)
let state = engine.createGame();

// Player places units on their home SCs (per-player count based on home SCs)
const valid = engine.getValidPlacements(state, "england");
// → e.g. [{ type: ARMY, locationId: "EDI" }, { type: FLEET, locationId: "EDI" }, ...]

state = engine.submitPlacements(state, "england", [
  { type: UnitType.FLEET, locationId: "LON" },
  { type: UnitType.FLEET, locationId: "EDI" },
  { type: UnitType.ARMY, locationId: "LVP" },
]);

// Advance to ORDER phase once all players have placed
if (engine.isPlacementComplete(state)) {
  state = GameStateMachine.advancePhase(state); // → Phase.ORDER
}

// Or skip placement with default positions:
// state = engine.createGame(defaultPlacements);

// Submit orders
state = engine.submitOrders(state, "france", [
  { unitId: "A_PAR", type: OrderType.MOVE, targetLocationId: "BUR" },
  { unitId: "A_MAR", type: OrderType.SUPPORT, supportUnitId: "A_PAR",
    supportOrderType: OrderType.MOVE, supportTargetLocationId: "BUR" },
]);

// Resolve
const { result, state: updated } = engine.resolvePhase(state);

// Query
const status = engine.getGameStatus(state);
const moves = engine.getValidMoves(state, "A_PAR");
```

### Map

The full classic Diplomacy board:

| Category | Count |
|----------|-------|
| Land provinces | 56 (34 SCs, 22 non-SCs) |
| Sea provinces | 19 |
| Coast sub-provinces | 6 (SPA-NC/SC, STP-NC/SC, BUL-EC/SC) |
| **Total entries** | **81** |

Multi-coast provinces: **Spain**, **St. Petersburg**, **Bulgaria** — fleet moves must specify the coast. **Constantinople** allows fleet passage between the Aegean and Black Sea (`landConnection`).

### Rule Differences from Standard Diplomacy

| Rule | Standard | Diplomacy Light |
|------|----------|-----------------|
| Initial placement | Fixed | Players choose unit types and positions on home SCs during placement phase |
| Army at sea | Requires convoy | Can enter sea, but cannot attack, support, or capture territory while at sea |
| Army landing | Sea→coast via convoy | Sea→coast succeeds only if target is empty and uncontested |
| Sea combat | Support-based | Fleet auto-defeats army (overrides all strength) |
| Convoys | Required for amphibious | Not implemented (simplified) |
| Draws | Supported | Solo victory only |

All standard mechanics implemented: simultaneous resolution, support/hold/move, support cutting (with beleaguered garrison exception), direct swap detection, multi-way standoffs, dislodgement and retreat, fall SC ownership transfer, build/disband.

### Development

```bash
pnpm test          # 126 TypeScript tests (80 engine + 32 negotiation + 14 bridge)
pnpm test:watch    # Watch mode
pnpm play          # Terminal CLI (human vs human)
pnpm build         # TypeScript check

# Python orchestrator tests
python3 ai-orchestrator/__tests__/test_orchestrator.py  # 18 Python tests

# Full AI game
python3 ai-orchestrator/orchestrator.py  # 7 AI agents (needs OPENROUTER_API_KEY)
```



## Negotiation Layer

A REST-based chat system for diplomatic negotiations, designed for both human players (browser UI) and LLM agents (HTTP API). Built as a vertical feature module.

### Quick Start

```bash
pnpm dev          # Starts HTTP on :3000
```

**Browser:** Navigate to `/negotiation`, select your nation, and chat.

**LLM Agent:** Call the REST API directly (see below).

### REST API

All endpoints live under `/api/chat`. Messages are JSON. In-memory storage, capped at 200 messages per channel.

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/chat/channels?playerId=` | List player's channels |
| `POST` | `/api/chat/channels` | Create group `{ name, createdBy, memberIds }` |
| `POST` | `/api/chat/channels/:id/invite` | Invite players `{ invitedBy, playerIds }` |
| `POST` | `/api/chat/channels/:id/join` | Join channel `{ playerId }` |
| `POST` | `/api/chat/channels/:id/leave` | Leave channel `{ playerId }` |
| `GET` | `/api/chat/channels/:id/messages?since=` | Get messages (add `?since=<timestamp>` for delta polling) |
| `POST` | `/api/chat/channels/:id/messages` | Send message `{ senderId, senderName, content }` |

**Polling for LLMs:** Use `GET /api/chat/channels/:id/messages?since=<lastTimestamp>` to fetch only new messages. Track the highest `timestamp` from each response as your cursor.

**Example flow for an LLM agent:**
```bash
# France gets their channels
GET /api/chat/channels?playerId=france

# France reads global chat
GET /api/chat/channels/global/messages

# France sends a message
POST /api/chat/channels/global/messages
{"senderId":"france","senderName":"France","content":"England, I propose an alliance."}

# France checks for new messages since last poll
GET /api/chat/channels/global/messages?since=1715378400000

# France creates a private group with england and germany
POST /api/chat/channels
{"name":"Northern Alliance","createdBy":"france","memberIds":["england","germany"]}
```

### Features

- **Global channel** — all 7 powers can talk. Any player can read/write.
- **Group chats** — ad-hoc private groups of 2+ players. Create, invite, join, leave.
- **In-memory storage** — message history per channel (capped at 200 messages).
- **Delta polling** — `?since=` parameter for efficient LLM polling.

### Architecture

```
src/features/negotiation/     ← All feature code (vertical module)
  types.ts                    — Message, ChatChannel types
  chat-manager.ts             — In-memory singleton: channels, messages, CRUD
  use-chat.ts                 — React hook (REST + polling)
  chat-panel.tsx              — Channel sidebar + active chat
  global-chat.tsx             — Global channel view
  group-chat.tsx              — Group channel with invite/leave controls
  create-group-dialog.tsx     — Modal for creating groups
  negotiation-page.tsx        — Player selection → ChatPanel
  index.ts                    — Barrel exports
  __tests__/
    chat-manager.test.ts      — 32 tests

server/api/chat/              ← REST API (LLM-friendly)
  channels.get.ts
  channels.post.ts
  channels/[id]/invite.post.ts
  channels/[id]/join.post.ts
  channels/[id]/leave.post.ts
  channels/[id]/messages.get.ts
  channels/[id]/messages.post.ts

src/routes/
  negotiation.tsx             — Browser UI at /negotiation
```

## Project Structure

```
src/
  engine/              — Diplomacy Light game engine (75 territories, full adjudication)
  features/            — Vertical feature modules (negotiation, etc.)
  cli/                 — Terminal interface (human players)
  routes/              — TanStack Router routes
  components/          — React components
  utils/               — Shared utilities

ai-orchestrator/
  orchestrator.py      — Main game loop, 7 AI agents, OpenRouter client
  engine-bridge.ts     — Node.js subprocess wrapping the TypeScript engine
  agents.json          — Country → OpenRouter model + persona configuration
  __tests__/           — 14 bridge tests + 18 Python tests
```

```bash
pnpm test              # 126 tests (80 engine + 32 negotiation + 14 bridge)
python3 ai-orchestrator/__tests__/test_orchestrator.py  # 18 Python tests
```

---

## License

MIT
