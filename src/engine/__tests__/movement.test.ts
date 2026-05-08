import { describe, it, expect, beforeEach } from "vitest";
import { MovementValidator } from "../movement";
import { GameState, Unit, UnitType } from "../types";
import { createProvinces } from "../provinces";

describe("MovementValidator", () => {
  let state: GameState;

  beforeEach(() => {
    state = {
      year: 1901, season: "SPRING", phase: "ORDER" as any,
      players: new Map(), provinces: createProvinces(),
      units: new Map(), orders: new Map(), retreatsNeeded: [],
    } as any;
  });

  function addUnit(id: string, type: UnitType, loc: string, owner = "test"): Unit {
    const u: Unit = { id, type, ownerId: owner, locationId: loc, mustRetreat: false };
    (state.units as Map<string, Unit>).set(id, u);
    return u;
  }

  it("allows army to move to adjacent land province", () => {
    expect(MovementValidator.isValidMove(addUnit("A_PAR", UnitType.ARMY, "PAR", "france"), "PAR", "BUR", state)).toBe(true);
  });

  it("rejects army move to non-adjacent province", () => {
    expect(MovementValidator.isValidMove(addUnit("A_PAR", UnitType.ARMY, "PAR", "france"), "PAR", "MUN", state)).toBe(false);
  });

  it("allows army to move to adjacent sea province", () => {
    expect(MovementValidator.isValidMove(addUnit("A_BRE", UnitType.ARMY, "BRE", "france"), "BRE", "ENG", state)).toBe(true);
  });

  it("allows army in coast to move to adjacent sea", () => {
    expect(MovementValidator.isValidMove(addUnit("A_LVP", UnitType.ARMY, "LVP", "england"), "LVP", "IRI", state)).toBe(true);
    expect(MovementValidator.isValidMove(addUnit("A_BRE", UnitType.ARMY, "BRE", "france"), "BRE", "ENG", state)).toBe(true);
  });

  it("rejects fleet move to landlocked province", () => {
    expect(MovementValidator.isValidMove(addUnit("F_ENG", UnitType.FLEET, "ENG", "england"), "ENG", "PAR", state)).toBe(false);
  });

  it("allows fleet to move to adjacent sea", () => {
    expect(MovementValidator.isValidMove(addUnit("F_ENG", UnitType.FLEET, "ENG", "england"), "ENG", "NTH", state)).toBe(true);
  });

  it("rejects fleet move to land province without landConnection", () => {
    expect(MovementValidator.isValidMove(addUnit("F_MAO", UnitType.FLEET, "MAO", "france"), "MAO", "BUR", state)).toBe(false);
  });

  it("allows fleet to move through CON (landConnection)", () => {
    expect(MovementValidator.isValidMove(addUnit("F_AEG", UnitType.FLEET, "AEG", "turkey"), "AEG", "CON", state)).toBe(true);
  });

  it("rejects fleet move to SPA without coast specification", () => {
    expect(MovementValidator.isValidMove(addUnit("F_MAO", UnitType.FLEET, "MAO", "france"), "MAO", "SPA", state)).toBe(false);
  });

  it("allows fleet move to SPA_NC from MAO", () => {
    expect(MovementValidator.isValidMove(addUnit("F_MAO", UnitType.FLEET, "MAO", "france"), "MAO", "SPA_NC", state)).toBe(true);
  });

  it("allows fleet move to SPA_SC from WES", () => {
    expect(MovementValidator.isValidMove(addUnit("F_WES", UnitType.FLEET, "WES", "france"), "WES", "SPA_SC", state)).toBe(true);
  });

  it("getValidMoves returns correct list for an army in PAR", () => {
    const moves = MovementValidator.getValidMoves(addUnit("A_PAR", UnitType.ARMY, "PAR", "france"), state);
    expect(moves).toContain("BUR");
    expect(moves).toContain("BRE");
    expect(moves).toContain("PIC");
    expect(moves).toContain("GAS");
    expect(moves).not.toContain("MUN");
  });

  it("getValidMoves includes sea neighbors for army in coastal province", () => {
    const moves = MovementValidator.getValidMoves(addUnit("A_LVP", UnitType.ARMY, "LVP", "england"), state);
    expect(moves).toContain("CLY");
    expect(moves).toContain("EDI");
    expect(moves).toContain("YOR");
    expect(moves).toContain("WAL");
    expect(moves).toContain("IRI");
  });
});
