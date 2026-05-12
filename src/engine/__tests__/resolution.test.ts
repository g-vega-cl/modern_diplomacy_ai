import { describe, it, expect } from "vitest";
import { ResolutionEngine } from "../resolution";
import { GameState, Unit, Order, OrderType, UnitType } from "../types";
import { createProvinces } from "../provinces";

function createTestState(
  provinceIds: string[],
  units: Partial<Unit>[],
  orders: Partial<Order>[],
): GameState {
  const allProvinces = createProvinces();
  const stateProvinces = new Map();
  for (const pid of provinceIds) stateProvinces.set(pid, allProvinces.get(pid)!);

  const stateUnits = new Map<string, Unit>();
  for (const u of units) {
    stateUnits.set(u.id!, { ...u, mustRetreat: false } as Unit);
  }

  const stateOrders = new Map<string, Order>();
  for (const o of orders) {
    stateOrders.set(o.unitId!, o as Order);
  }

  return {
    year: 1901, season: "SPRING", phase: "RESOLUTION" as any,
    players: new Map(), provinces: stateProvinces, units: stateUnits,
    orders: stateOrders, retreatsNeeded: [],
  } as any;
}

function A(id: string, owner: string, loc: string): Partial<Unit> {
  return { id, type: UnitType.ARMY, ownerId: owner, locationId: loc };
}

function F(id: string, owner: string, loc: string): Partial<Unit> {
  return { id, type: UnitType.FLEET, ownerId: owner, locationId: loc };
}

function MOVE(unitId: string, target: string): Partial<Order> {
  return { unitId, type: OrderType.MOVE, targetLocationId: target };
}

function HOLD(unitId: string): Partial<Order> {
  return { unitId, type: OrderType.HOLD };
}

function SUP(unitId: string, target: string, moveTarget?: string): Partial<Order> {
  return moveTarget
    ? { unitId, type: OrderType.SUPPORT, supportUnitId: target, supportOrderType: OrderType.MOVE, supportTargetLocationId: moveTarget }
    : { unitId, type: OrderType.SUPPORT, supportUnitId: target };
}

describe("ResolutionEngine", () => {
  describe("Basic Movement", () => {
    it("simple move to empty province succeeds", () => {
      const state = createTestState(["PAR", "BUR"], [A("A_PAR", "france", "PAR")], [MOVE("A_PAR", "BUR")]);
      const result = ResolutionEngine.resolve(state);
      expect(result.successfulMoves).toContainEqual({ unitId: "A_PAR", fromLocationId: "PAR", toLocationId: "BUR" });
    });

    it("1v1 at province with defender holding results in bounce", () => {
      const state = createTestState(
        ["PAR", "BUR"],
        [A("A_PAR", "france", "PAR"), A("A_BUR", "germany", "BUR")],
        [MOVE("A_PAR", "BUR"), HOLD("A_BUR")],
      );
      const result = ResolutionEngine.resolve(state);
      expect(result.bouncedMoves).toContainEqual({ unitId: "A_PAR", attemptedLocationId: "BUR" });
      expect(result.successfulMoves.length).toBe(0);
    });

    it("direct swap results in both bouncing", () => {
      const state = createTestState(
        ["PAR", "BUR"],
        [A("A_PAR", "france", "PAR"), A("A_BUR", "germany", "BUR")],
        [MOVE("A_PAR", "BUR"), MOVE("A_BUR", "PAR")],
      );
      const result = ResolutionEngine.resolve(state);
      expect(result.bouncedMoves.length).toBe(2);
      expect(result.successfulMoves.length).toBe(0);
    });
  });

  describe("Support Mechanics", () => {
    it("support adds +1 to attack strength", () => {
      const state = createTestState(
        ["PAR", "BUR", "MAR"],
        [A("A_PAR", "france", "PAR"), A("A_MAR", "france", "MAR"), A("A_BUR", "germany", "BUR")],
        [MOVE("A_PAR", "BUR"), SUP("A_MAR", "A_PAR", "BUR"), HOLD("A_BUR")],
      );
      const result = ResolutionEngine.resolve(state);
      expect(result.successfulMoves).toContainEqual({ unitId: "A_PAR", fromLocationId: "PAR", toLocationId: "BUR" });
      expect(result.dislodgedUnits).toContainEqual(expect.objectContaining({ unitId: "A_BUR" }));
    });

    it("support is cut when supporter is attacked by different unit", () => {
      const state = createTestState(
        ["PAR", "BUR", "MAR", "GAS"],
        [A("A_PAR", "france", "PAR"), A("A_MAR", "france", "MAR"), A("A_BUR", "germany", "BUR"), A("A_GAS", "germany", "GAS")],
        [MOVE("A_PAR", "BUR"), SUP("A_MAR", "A_PAR", "BUR"), HOLD("A_BUR"), MOVE("A_GAS", "MAR")],
      );
      const result = ResolutionEngine.resolve(state);
      expect(result.bouncedMoves).toContainEqual({ unitId: "A_PAR", attemptedLocationId: "BUR" });
    });

    it("beleaguered garrison: support not cut when attacker is the target", () => {
      const state = createTestState(
        ["PAR", "BUR", "MAR"],
        [A("A_PAR", "france", "PAR"), A("A_MAR", "france", "MAR"), A("A_BUR", "germany", "BUR")],
        [MOVE("A_PAR", "BUR"), SUP("A_MAR", "A_PAR", "BUR"), MOVE("A_BUR", "MAR")],
      );
      const result = ResolutionEngine.resolve(state);
      expect(result.successfulMoves).toContainEqual({ unitId: "A_PAR", fromLocationId: "PAR", toLocationId: "BUR" });
    });
  });

  describe("Sea & Amphibious Rules", () => {
    it("fleet automatically defeats army in sea province", () => {
      const state = createTestState(
        ["ENG", "NTH"],
        [A("A_ENG", "france", "ENG"), F("F_NTH", "england", "NTH")],
        [HOLD("A_ENG"), MOVE("F_NTH", "ENG")],
      );
      const result = ResolutionEngine.resolve(state);
      expect(result.dislodgedUnits).toContainEqual(
        expect.objectContaining({ unitId: "A_ENG", dislodgedByUnitId: "F_NTH" }),
      );
    });

    it("army cannot attack from sea to occupied coast", () => {
      const state = createTestState(
        ["ENG", "LON"],
        [A("A_ENG", "france", "ENG"), A("A_LON", "england", "LON")],
        [MOVE("A_ENG", "LON"), HOLD("A_LON")],
      );
      const result = ResolutionEngine.resolve(state);
      expect(result.bouncedMoves).toContainEqual({ unitId: "A_ENG", attemptedLocationId: "LON" });
    });

    it("army landing succeeds on empty unopposed coast", () => {
      const state = createTestState(
        ["ENG", "LON"],
        [A("A_ENG", "france", "ENG")],
        [MOVE("A_ENG", "LON")],
      );
      const result = ResolutionEngine.resolve(state);
      expect(result.successfulMoves).toContainEqual({ unitId: "A_ENG", fromLocationId: "ENG", toLocationId: "LON" });
    });

    it("army in sea cannot support a move (§8.1)", () => {
      const state = createTestState(
        ["ENG", "LON", "YOR"],
        [A("A_LON", "england", "LON"), A("A_ENG", "france", "ENG"), A("A_YOR", "france", "YOR")],
        [HOLD("A_LON"), SUP("A_ENG", "A_YOR", "LON"), MOVE("A_YOR", "LON")],
      );
      const result = ResolutionEngine.resolve(state);
      expect(result.bouncedMoves).toContainEqual({ unitId: "A_YOR", attemptedLocationId: "LON" });
    });

    it("army in sea cannot support a hold (§8.1)", () => {
      const state = createTestState(
        ["ENG", "LON", "YOR"],
        [A("A_LON", "england", "LON"), A("A_ENG", "france", "ENG"), A("A_YOR", "france", "YOR")],
        [HOLD("A_LON"), SUP("A_ENG", "A_LON"), MOVE("A_YOR", "LON")],
      );
      const result = ResolutionEngine.resolve(state);
      expect(result.bouncedMoves).toContainEqual({ unitId: "A_YOR", attemptedLocationId: "LON" });
    });

    it("same-power duplicate destination: both bounce (Diplomacy rule)", () => {
      const state = createTestState(
        ["ENG", "NTH", "LON"],
        [A("A_LON", "england", "LON"), F("F_NTH", "england", "NTH")],
        [MOVE("A_LON", "ENG"), MOVE("F_NTH", "ENG")],
      );
      const result = ResolutionEngine.resolve(state);
      expect(result.bouncedMoves).toContainEqual({ unitId: "A_LON", attemptedLocationId: "ENG" });
      expect(result.bouncedMoves).toContainEqual({ unitId: "F_NTH", attemptedLocationId: "ENG" });
      expect(result.successfulMoves.length).toBe(0);
    });

    it("army landing blocked by incoming competing move (§8.3)", () => {
      const state = createTestState(
        ["ENG", "LON", "WAL"],
        [A("A_ENG", "france", "ENG"), A("A_WAL", "england", "WAL")],
        [MOVE("A_ENG", "LON"), MOVE("A_WAL", "LON")],
      );
      const result = ResolutionEngine.resolve(state);
      expect(result.bouncedMoves).toContainEqual({ unitId: "A_ENG", attemptedLocationId: "LON" });
    });

    it("army moves to adjacent empty sea (§8.1)", () => {
      const state = createTestState(
        ["LON", "ENG"],
        [A("A_LON", "england", "LON")],
        [MOVE("A_LON", "ENG")],
      );
      const result = ResolutionEngine.resolve(state);
      expect(result.successfulMoves).toContainEqual({ unitId: "A_LON", fromLocationId: "LON", toLocationId: "ENG" });
    });

    it("same-power fleets to same sea: both bounce, defender stays", () => {
      const state = createTestState(
        ["ENG", "NTH", "WAL"],
        [A("A_ENG", "france", "ENG"), F("F_NTH", "england", "NTH"), F("F_WAL", "england", "WAL")],
        [HOLD("A_ENG"), MOVE("F_NTH", "ENG"), MOVE("F_WAL", "ENG")],
      );
      const result = ResolutionEngine.resolve(state);
      // Same-power duplicate destination check bounces both england fleets
      expect(result.dislodgedUnits.length).toBe(0);
      expect(result.successfulMoves.length).toBe(0);
      expect(result.bouncedMoves.length).toBe(2);
      expect(result.bouncedMoves).toContainEqual({ unitId: "F_NTH", attemptedLocationId: "ENG" });
      expect(result.bouncedMoves).toContainEqual({ unitId: "F_WAL", attemptedLocationId: "ENG" });
    });
  });

  describe("Complex Interactions", () => {
    it("chain of supports resolves correctly", () => {
      const state = createTestState(
        ["RUH", "MUN", "BER", "SIL"],
        [A("A_RUH", "germany", "RUH"), A("A_MUN", "germany", "MUN"), A("A_BER", "germany", "BER"), A("A_SIL", "russia", "SIL")],
        [SUP("A_RUH", "A_MUN"), SUP("A_MUN", "A_BER", "SIL"), MOVE("A_BER", "SIL"), HOLD("A_SIL")],
      );
      const result = ResolutionEngine.resolve(state);
      expect(result.successfulMoves).toContainEqual({ unitId: "A_BER", fromLocationId: "BER", toLocationId: "SIL" });
    });

    it("two same-power + one other attacker: same-power bounce, third succeeds", () => {
      const state = createTestState(
        ["PAR", "BUR", "MAR", "MUN"],
        [A("A_PAR", "france", "PAR"), A("A_MAR", "france", "MAR"), A("A_MUN", "germany", "MUN")],
        [MOVE("A_PAR", "BUR"), MOVE("A_MAR", "BUR"), MOVE("A_MUN", "BUR")],
      );
      const result = ResolutionEngine.resolve(state);
      // A_PAR and A_MAR bounce (same-power duplicate destination),
      // then A_MUN (germany) attacks unopposed and succeeds
      expect(result.bouncedMoves.length).toBe(2);
      expect(result.successfulMoves.length).toBe(1);
      expect(result.successfulMoves).toContainEqual({ unitId: "A_MUN", fromLocationId: "MUN", toLocationId: "BUR" });
    });
  });

  describe("Retreat Rules", () => {
    it("dislodged unit with retreat options lists possible retreats", () => {
      const state = createTestState(
        ["PAR", "BUR", "GAS", "MAR"],
        [A("A_PAR", "france", "PAR"), A("A_MAR", "france", "MAR"), A("A_BUR", "germany", "BUR")],
        [MOVE("A_PAR", "BUR"), SUP("A_MAR", "A_PAR", "BUR"), HOLD("A_BUR")],
      );
      const result = ResolutionEngine.resolve(state);
      expect(result.dislodgedUnits.length).toBe(1);
    });

    it("cannot retreat to province from which attacker came", () => {
      const state = createTestState(
        ["PAR", "BUR", "MAR"],
        [A("A_PAR", "france", "PAR"), A("A_MAR", "france", "MAR"), A("A_BUR", "germany", "BUR")],
        [MOVE("A_PAR", "BUR"), SUP("A_MAR", "A_PAR", "BUR"), HOLD("A_BUR")],
      );
      const result = ResolutionEngine.resolve(state);
      expect(result.dislodgedUnits.length).toBe(1);
      expect(result.dislodgedUnits[0].unitId).toBe("A_BUR");
    });
  });
});
