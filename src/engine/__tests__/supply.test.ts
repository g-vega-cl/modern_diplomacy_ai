import { describe, it, expect, beforeEach } from "vitest";
import { SupplyCenterManager } from "../supply";
import { GameState, Player, Unit, ResolutionResult } from "../types";
import { createProvinces } from "../provinces";

function emptyState(season: "SPRING" | "FALL" = "FALL"): GameState {
  return {
    year: 1901, season, phase: "RESOLUTION" as any,
    players: new Map([
      ["france", { id: "france", name: "France", supplyCenterCount: 3, units: new Map(), eliminated: false }],
      ["germany", { id: "germany", name: "Germany", supplyCenterCount: 3, units: new Map(), eliminated: false }],
    ]),
    provinces: createProvinces(),
    units: new Map(), orders: new Map(), retreatsNeeded: [],
  } as any;
}

function pushUnit(state: GameState, id: string, ownerId: string, loc: string): void {
  const units = state.units as Map<string, Unit>;
  units.set(id, { id, type: "A" as any, ownerId, locationId: loc, mustRetreat: false });
}

describe("SupplyCenterManager", () => {
  it("does not transfer supply centers in spring", () => {
    const state = emptyState("SPRING");
    pushUnit(state, "A_PAR", "france", "BEL");
    const result: ResolutionResult = {
      successfulMoves: [{ unitId: "A_PAR", fromLocationId: "PAR", toLocationId: "BEL" }],
      bouncedMoves: [], dislodgedUnits: [], destroyedUnits: [], combatLog: [],
    };
    const updated = SupplyCenterManager.updateOwnership(state, result);
    expect(updated.players.get("france")!.supplyCenterCount).toBe(3);
  });

  it("transfers supply center in fall when occupied by mover", () => {
    const state = emptyState("FALL");
    pushUnit(state, "A_PAR", "france", "BEL");
    const result: ResolutionResult = {
      successfulMoves: [{ unitId: "A_PAR", fromLocationId: "PAR", toLocationId: "BEL" }],
      bouncedMoves: [], dislodgedUnits: [], destroyedUnits: [], combatLog: [],
    };
    const updated = SupplyCenterManager.updateOwnership(state, result);
    expect(updated.players.get("france")!.supplyCenterCount).toBe(4);
  });

  it("handles multiple units moving into supply centers", () => {
    const state = emptyState("FALL");
    pushUnit(state, "A_PAR", "france", "BEL");
    pushUnit(state, "A_MAR", "france", "TUN");
    const result: ResolutionResult = {
      successfulMoves: [
        { unitId: "A_PAR", fromLocationId: "PAR", toLocationId: "BEL" },
        { unitId: "A_MAR", fromLocationId: "MAR", toLocationId: "TUN" },
      ],
      bouncedMoves: [], dislodgedUnits: [], destroyedUnits: [], combatLog: [],
    };
    const updated = SupplyCenterManager.updateOwnership(state, result);
    expect(updated.players.get("france")!.supplyCenterCount).toBe(5);
  });

  it("does not transfer non-supply-center provinces", () => {
    const state = emptyState("FALL");
    pushUnit(state, "A_PAR", "france", "BUR");
    const result: ResolutionResult = {
      successfulMoves: [{ unitId: "A_PAR", fromLocationId: "PAR", toLocationId: "BUR" }],
      bouncedMoves: [], dislodgedUnits: [], destroyedUnits: [], combatLog: [],
    };
    const updated = SupplyCenterManager.updateOwnership(state, result);
    expect(updated.players.get("france")!.supplyCenterCount).toBe(3);
  });

  it("calculates positive build count", () => {
    const state = emptyState("FALL");
    const p = state.players.get("france")!;
    (p as any).supplyCenterCount = 5;
    pushUnit(state, "u1", "france", "PAR");
    pushUnit(state, "u2", "france", "BUR");
    const builds = SupplyCenterManager.calculateBuilds(state);
    expect(builds.get("france")).toBe(3);
  });

  it("calculates negative disband count", () => {
    const state = emptyState("FALL");
    const p = state.players.get("france")!;
    (p as any).supplyCenterCount = 2;
    pushUnit(state, "u1", "france", "PAR");
    pushUnit(state, "u2", "france", "BUR");
    pushUnit(state, "u3", "france", "GAS");
    pushUnit(state, "u4", "france", "PIC");
    const builds = SupplyCenterManager.calculateBuilds(state);
    expect(builds.get("france")).toBe(-2);
  });

  it("returns zero when SCs equal units", () => {
    const state = emptyState("FALL");
    const p = state.players.get("france")!;
    (p as any).supplyCenterCount = 3;
    pushUnit(state, "u1", "france", "PAR");
    pushUnit(state, "u2", "france", "BUR");
    pushUnit(state, "u3", "france", "GAS");
    const builds = SupplyCenterManager.calculateBuilds(state);
    expect(builds.get("france")).toBe(0);
  });
});
