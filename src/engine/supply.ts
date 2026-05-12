import { GameState, ResolutionResult } from "./types";

export class SupplyCenterManager {
  /**
   * Recalculate supply center ownership after Fall resolution.
   * A supply center is controlled by the player whose unit occupies it
   * at the conclusion of a Fall turn. If no unit is present, previous
   * ownership is retained (from the supplyCenterOwners map).
   * Then updates each player's supplyCenterCount from the ownership map.
   */
  static updateOwnership(state: GameState, result: ResolutionResult): GameState {
    if (state.season !== "FALL") {
      return state;
    }

    // Copy existing ownership — units that move onto SCs update it below
    const nextOwners = new Map(state.supplyCenterOwners);

    // For the resolution result, build a map of where each unit ends up
    const unitLocations = new Map<string, string>();
    for (const [uid, unit] of state.units) {
      unitLocations.set(uid, unit.locationId);
    }
    // Apply successful moves
    for (const move of result.successfulMoves) {
      unitLocations.set(move.unitId, move.toLocationId);
    }

    // Update ownership: any unit sitting on a supply center claims it
    for (const [uid, locId] of unitLocations) {
      const province = state.provinces.get(locId);
      if (!province || !province.isSupplyCenter) continue;
      const unit = state.units.get(uid);
      if (!unit) continue;
      nextOwners.set(locId, unit.ownerId);
    }

    // Recalculate each player's supplyCenterCount from the ownership map
    const counts = new Map<string, number>();
    for (const ownerId of nextOwners.values()) {
      counts.set(ownerId, (counts.get(ownerId) || 0) + 1);
    }

    const updatedPlayers = new Map(state.players);
    for (const [pid, player] of updatedPlayers) {
      updatedPlayers.set(pid, {
        ...player,
        supplyCenterCount: counts.get(pid) || 0,
      });
    }

    return { ...state, players: updatedPlayers, supplyCenterOwners: nextOwners };
  }

  static calculateBuilds(state: GameState): Map<string, number> {
    const unitCounts = new Map<string, number>();
    for (const unit of state.units.values()) {
      unitCounts.set(unit.ownerId, (unitCounts.get(unit.ownerId) || 0) + 1);
    }

    const result = new Map<string, number>();
    for (const player of state.players.values()) {
      const owned = unitCounts.get(player.id) || 0;
      result.set(player.id, player.supplyCenterCount - owned);
    }

    return result;
  }
}
