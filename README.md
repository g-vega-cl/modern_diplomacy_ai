# Modern Diplomacy AI

TypeScript game engine and strategy board game project.

- **[Diplomacy Light](#diplomacy-light-engine)** — A complete adjudication engine for the classic board game Diplomacy, with an interactive terminal CLI.
- **[World Dominion](WORLD_DOMINION.md)** — Design specification for a modern-world strategy board game.

---

## Diplomacy Light Engine

A deterministic, simultaneous-move game engine implementing a simplified version of the classic Diplomacy board game. Pure TypeScript, zero dependencies, 63+ tests.

### Quick Start

```bash
pnpm install
pnpm test          # Run all 63 tests
pnpm play          # Play interactively in the terminal
```

### The Game

Seven Great Powers compete for control of Europe (1901):

| Power | Home Centers | Starting Units |
|-------|-------------|----------------|
| England | EDI, LON, LVP | F LON, F EDI, A LVP |
| France | BRE, MAR, PAR | F BRE, A PAR, A MAR |
| Germany | BER, KIE, MUN | F KIE, A BER, A MUN |
| Italy | NAP, ROM, VEN | F NAP, A ROM, A VEN |
| Austria | VIE, TRI, BUD | F TRI, A VIE, A BUD |
| Russia | MOS, SEV, STP, WAR | F STP(NC), A MOS, A WAR |
| Turkey | ANK, CON, SMY | F ANK, A CON, A SMY |

**Victory:** Control 18 of 34 supply centers, or be the last power standing.

### How to Play (CLI)

```bash
pnpm play
```

Players take turns entering orders in sequence. All orders are resolved simultaneously per standard Diplomacy rules.

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
SPRING ORDER → RESOLUTION → RETREAT → FALL ORDER → RESOLUTION → RETREAT → BUILD → next year
```

Phases: **ORDER** (all players submit), **RESOLUTION** (engine adjudicates), **RETREAT** (dislodged units), **BUILD** (build/disband units based on SC count, fall only).

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

src/engine/__tests__/  — 63 tests across 7 files
```

### API Usage

```typescript
import { DiplomacyEngine, OrderType } from "./engine";

const engine = new DiplomacyEngine();
let state = engine.createGame();

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
| Army at sea | Requires convoy | Can exist at sea independently |
| Sea combat | Support-based | Fleet auto-defeats army |
| Convoy orders | Required for amphibious | Not implemented (simplified) |
| Draws | Supported | Solo victory only |
| Russia start | 4 units | 3 units (all powers equal) |

All standard mechanics implemented: simultaneous resolution, support/hold/move, support cutting (with beleaguered garrison exception), direct swap detection, multi-way standoffs, dislodgement and retreat, fall SC ownership transfer, build/disband.

### Development

```bash
pnpm test          # 63 tests
pnpm test:watch    # Watch mode
pnpm play          # Terminal CLI
pnpm build         # TypeScript check
```

---

## World Dominion

A game design specification for a 2–9 player modern-world strategy board game. See [WORLD_DOMINION.md](WORLD_DOMINION.md).

---

## Project Structure

```
src/
  engine/     — Diplomacy Light game engine
  cli/        — Terminal interface
  routes/     — TanStack Router routes (WIP)
  components/ — React components (WIP)
  utils/      — Shared utilities
```

---

## License

MIT
