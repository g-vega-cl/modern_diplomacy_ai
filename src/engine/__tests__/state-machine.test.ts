import { describe, it, expect } from "vitest";
import { GameStateMachine } from "../state-machine";
import { GameState, Phase } from "../types";
import { createProvinces } from "../provinces";

function emptyState(overrides: Partial<GameState> = {}): GameState {
  return {
    year: 1901, season: "SPRING", phase: Phase.ORDER,
    players: new Map(), provinces: createProvinces(),
    units: new Map(), orders: new Map(), retreatsNeeded: [],
    ...overrides,
  } as any;
}

describe("GameStateMachine", () => {
  it("transitions ORDER → RESOLUTION", () => {
    const next = GameStateMachine.advancePhase(emptyState());
    expect(next.phase).toBe(Phase.RESOLUTION);
    expect(next.season).toBe("SPRING");
    expect(next.year).toBe(1901);
  });

  it("transitions RESOLUTION → ORDER (next season) when no retreats needed", () => {
    const next = GameStateMachine.advancePhase(emptyState({ phase: Phase.RESOLUTION, season: "SPRING" }));
    expect(next.phase).toBe(Phase.ORDER);
    expect(next.season).toBe("FALL");
    expect(next.year).toBe(1901);
  });

  it("transitions RESOLUTION → RETREAT when retreats needed", () => {
    const next = GameStateMachine.advancePhase(emptyState({ phase: Phase.RESOLUTION, retreatsNeeded: ["A_PAR"] }));
    expect(next.phase).toBe(Phase.RETREAT);
  });

  it("transitions RETREAT → ORDER (next season)", () => {
    const next = GameStateMachine.advancePhase(emptyState({ phase: Phase.RETREAT, season: "SPRING" }));
    expect(next.phase).toBe(Phase.ORDER);
    expect(next.season).toBe("FALL");
  });

  it("transitions FALL RESOLUTION → FALL BUILD when no retreats", () => {
    const next = GameStateMachine.advancePhase(emptyState({ phase: Phase.RESOLUTION, season: "FALL" }));
    expect(next.phase).toBe(Phase.BUILD);
    expect(next.season).toBe("FALL");
  });

  it("transitions FALL RETREAT → FALL BUILD", () => {
    const next = GameStateMachine.advancePhase(emptyState({ phase: Phase.RETREAT, season: "FALL" }));
    expect(next.phase).toBe(Phase.BUILD);
  });

  it("transitions FALL BUILD → SPRING ORDER (next year)", () => {
    const next = GameStateMachine.advancePhase(emptyState({ phase: Phase.BUILD, season: "FALL" }));
    expect(next.phase).toBe(Phase.ORDER);
    expect(next.season).toBe("SPRING");
    expect(next.year).toBe(1902);
  });

  it("clears orders on transition", () => {
    const orders = new Map();
    orders.set("A_PAR", { unitId: "A_PAR", type: "HOLD" as any });
    const next = GameStateMachine.advancePhase(emptyState({ orders } as any));
    expect(next.orders.size).toBe(0);
  });
});
