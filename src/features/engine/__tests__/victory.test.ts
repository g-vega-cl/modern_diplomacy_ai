import { describe, it, expect } from "vitest";
import { VictoryChecker } from "../victory";
import { Player } from "../types";

function makePlayer(id: string, scCount: number, eliminated = false): Player {
  return { id, name: id, supplyCenterCount: scCount, units: new Map(), eliminated };
}

describe("VictoryChecker", () => {
  it("declares winner at 18 supply centers", () => {
    const players = new Map([
      ["p1", makePlayer("p1", 18)],
      ["p2", makePlayer("p2", 10)],
    ]);
    expect(VictoryChecker.checkVictory(players)?.id).toBe("p1");
  });

  it("declares winner above 18 supply centers", () => {
    const players = new Map([["p1", makePlayer("p1", 19)]]);
    expect(VictoryChecker.checkVictory(players)?.id).toBe("p1");
  });

  it("returns null at 17 supply centers", () => {
    const players = new Map([["p1", makePlayer("p1", 17)]]);
    expect(VictoryChecker.checkVictory(players)).toBeNull();
  });

  it("declares winner when only one non-eliminated player remains", () => {
    const players = new Map([
      ["p1", makePlayer("p1", 5, false)],
      ["p2", makePlayer("p2", 10, true)],
      ["p3", makePlayer("p3", 3, true)],
    ]);
    expect(VictoryChecker.checkVictory(players)?.id).toBe("p1");
  });

  it("returns null with multiple non-eliminated players below 18", () => {
    const players = new Map([
      ["p1", makePlayer("p1", 10)],
      ["p2", makePlayer("p2", 8)],
    ]);
    expect(VictoryChecker.checkVictory(players)).toBeNull();
  });

  it("returns null when all players are eliminated", () => {
    const players = new Map([["p1", makePlayer("p1", 0, true)]]);
    expect(VictoryChecker.checkVictory(players)).toBeNull();
  });
});
