import { describe, it, expect } from "vitest";
import { DiplomacyEngine } from "../engine";
import { Phase, UnitType } from "../types";
import { STARTING_UNITS, PLAYERS, HOME_SCS } from "../config";
import { GameStateMachine } from "../state-machine";

function standardPlacements(): Record<string, Array<{ type: UnitType; locationId: string }>> {
  const result: Record<string, Array<{ type: UnitType; locationId: string }>> = {};
  for (const [playerId, units] of Object.entries(STARTING_UNITS)) {
    result[playerId] = units.map(u => ({ type: u.type as UnitType, locationId: u.locationId }));
  }
  return result;
}

describe("DiplomacyEngine", () => {
  describe("Placement phase", () => {
    it("createGame without placements starts in PLACEMENT phase", () => {
      const engine = new DiplomacyEngine();
      const state = engine.createGame();
      expect(state.year).toBe(1901);
      expect(state.season).toBe("SPRING");
      expect(state.phase).toBe(Phase.PLACEMENT);
      expect(state.players.size).toBe(7);
      expect(state.units.size).toBe(0);
    });

    it("createGame with placements starts in ORDER phase", () => {
      const engine = new DiplomacyEngine();
      const state = engine.createGame(standardPlacements());
      expect(state.phase).toBe(Phase.ORDER);
      expect(state.units.size).toBe(22);
    });

    it("each player starts with correct number of units based on home SCs", () => {
      const engine = new DiplomacyEngine();
      const state = engine.createGame(standardPlacements());
      for (const player of state.players.values()) {
        const expectedCount = HOME_SCS[player.id]?.length || 3;
        expect(player.units.size).toBe(expectedCount);
      }
    });

    it("getValidPlacements returns options for a player", () => {
      const engine = new DiplomacyEngine();
      const state = engine.createGame();
      const placements = engine.getValidPlacements(state, "england");
      expect(placements.length).toBeGreaterThan(0);
      // LVP is coast, so fleet should be available there
      const lvpFleet = placements.find(p => p.locationId === "LVP" && p.type === UnitType.FLEET);
      expect(lvpFleet).toBeDefined();
      // All home SCs should have army options
      expect(placements.filter(p => p.type === UnitType.ARMY).length).toBe(3);
    });

    it("submitPlacements creates units for a player", () => {
      const engine = new DiplomacyEngine();
      const state = engine.createGame();
      const placements = [
        { type: UnitType.ARMY, locationId: "EDI" },
        { type: UnitType.ARMY, locationId: "LVP" },
        { type: UnitType.ARMY, locationId: "LON" },
      ];
      const next = engine.submitPlacements(state, "england", placements);
      const england = next.players.get("england")!;
      expect(england.units.size).toBe(3);
      expect(next.units.size).toBe(3);
    });

    it("isPlacementComplete returns false for incomplete placement", () => {
      const engine = new DiplomacyEngine();
      const state = engine.createGame();
      expect(engine.isPlacementComplete(state)).toBe(false);
    });

    it("isPlacementComplete returns true when all players have all home SCs filled", () => {
      const engine = new DiplomacyEngine();
      let state = engine.createGame();
      for (const playerId of PLAYERS) {
        const homeSCs = HOME_SCS[playerId] || [];
        const placements = homeSCs.map((scId, i) => ({
          type: i === 0 ? UnitType.FLEET : UnitType.ARMY,
          locationId: scId,
        }));
        state = engine.submitPlacements(state, playerId, placements);
      }
      expect(engine.isPlacementComplete(state)).toBe(true);
    });

    it("full placement flow: all players place then advance to ORDER", () => {
      const engine = new DiplomacyEngine();
      let state = engine.createGame();
      expect(state.phase).toBe(Phase.PLACEMENT);

      for (const playerId of PLAYERS) {
        const scs = HOME_SCS[playerId] || [];
        const placements = scs.map((scId, i) => ({
          type: (i === 0 && scs.length > 1) ? UnitType.FLEET : UnitType.ARMY,
          locationId: scId,
        }));
        expect(placements.length).toBe(scs.length);
        state = engine.submitPlacements(state, playerId, placements);
      }

      expect(engine.isPlacementComplete(state)).toBe(true);
      expect(state.units.size).toBe(22);

      state = GameStateMachine.advancePhase(state);
      expect(state.phase).toBe(Phase.ORDER);
      expect(state.year).toBe(1901);
      expect(state.season).toBe("SPRING");
    });

    it("getValidPlacements respects occupied home SCs", () => {
      const engine = new DiplomacyEngine();
      let state = engine.createGame();
      state = engine.submitPlacements(state, "england", [
        { type: UnitType.FLEET, locationId: "LON" },
      ]);
      const valid = engine.getValidPlacements(state, "england");
      expect(valid.find(p => p.locationId === "LON")).toBeUndefined();
      expect(valid.find(p => p.locationId === "EDI")).toBeDefined();
    });

    it("getValidPlacements returns empty when player has all units placed", () => {
      const engine = new DiplomacyEngine();
      let state = engine.createGame();
      state = engine.submitPlacements(state, "england", [
        { type: UnitType.ARMY, locationId: "LON" },
        { type: UnitType.ARMY, locationId: "EDI" },
        { type: UnitType.FLEET, locationId: "LVP" },
      ]);
      expect(engine.getValidPlacements(state, "england")).toEqual([]);
    });
  });

  describe("Orders phase", () => {
    it("submitOrders adds orders to state", () => {
      const engine = new DiplomacyEngine();
      const state = engine.createGame(standardPlacements());
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
      const state = engine.createGame(standardPlacements());
      const status = engine.getGameStatus(state);
      expect(status.phase).toBe(Phase.ORDER);
      expect(status.currentSeason).toBe("SPRING");
      expect(status.currentYear).toBe(1901);
    });

    it("getValidMoves returns moves for a unit", () => {
      const engine = new DiplomacyEngine();
      const state = engine.createGame(standardPlacements());
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
      const state = engine.createGame(standardPlacements());
      const england = [...state.players.values()].find(p => p.id === "england")!;
      const engLocations = [...england.units.values()].map(u => u.locationId);
      expect(engLocations).toContain("LON");
      expect(engLocations).toContain("EDI");
      expect(engLocations).toContain("LVP");
    });
  });
});
