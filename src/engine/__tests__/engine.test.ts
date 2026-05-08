import { describe, it, expect } from "vitest";
import { DiplomacyEngine } from "../engine";
import { Phase } from "../types";

describe("DiplomacyEngine", () => {
  it("createGame returns valid initial state", () => {
    const engine = new DiplomacyEngine();
    const state = engine.createGame();
    expect(state.year).toBe(1901);
    expect(state.season).toBe("SPRING");
    expect(state.phase).toBe(Phase.ORDER);
    expect(state.players.size).toBe(7);
    expect(state.units.size).toBe(21);
  });

  it("each player starts with 3 units", () => {
    const engine = new DiplomacyEngine();
    const state = engine.createGame();
    for (const player of state.players.values()) {
      expect(player.units.size).toBe(3);
    }
  });

  it("submitOrders adds orders to state", () => {
    const engine = new DiplomacyEngine();
    const state = engine.createGame();
    const france = [...state.players.values()].find(p => p.id === "france")!;
    const orders = [];
    for (const unit of france.units.values()) {
      orders.push({ unitId: unit.id, type: "HOLD" as any });
    }
    const next = engine.submitOrders(state, "france", orders);
    expect(next.orders.size).toBe(3);
  });

  it("getGameStatus returns current phase info", () => {
    const engine = new DiplomacyEngine();
    const state = engine.createGame();
    const status = engine.getGameStatus(state);
    expect(status.phase).toBe(Phase.ORDER);
    expect(status.currentSeason).toBe("SPRING");
    expect(status.currentYear).toBe(1901);
  });

  it("getValidMoves returns moves for a unit", () => {
    const engine = new DiplomacyEngine();
    const state = engine.createGame();
    const france = [...state.players.values()].find(p => p.id === "france")!;
    const parisUnit = [...france.units.values()].find(u => u.locationId === "PAR")!;
    const moves = engine.getValidMoves(state, parisUnit.id);
    expect(moves.length).toBeGreaterThan(0);
    for (const m of moves) {
      expect(state.provinces.get(m)).toBeDefined();
    }
  });

  it("units are placed on home supply centers", () => {
    const engine = new DiplomacyEngine();
    const state = engine.createGame();
    const england = [...state.players.values()].find(p => p.id === "england")!;
    const engLocations = [...england.units.values()].map(u => u.locationId);
    expect(engLocations).toContain("LON");
    expect(engLocations).toContain("EDI");
    expect(engLocations).toContain("LVP");
  });
});
