import { GameState, ResolutionResult, ProvinceType } from "./types";

export class SupplyCenterManager {
  static updateOwnership(state: GameState, result: ResolutionResult): GameState {
    if (state.season !== "FALL") {
      return state;
    }

    const next = { ...state };
    const updatedPlayers = new Map(state.players);

    for (const move of result.successfulMoves) {
      const province = state.provinces.get(move.toLocationId);
      if (!province || !province.isSupplyCenter) continue;

      const unit = state.units.get(move.unitId);
      if (!unit) continue;

      const player = updatedPlayers.get(unit.ownerId);
      if (player) {
        updatedPlayers.set(unit.ownerId, {
          ...player,
          supplyCenterCount: player.supplyCenterCount + 1,
        });
      }
    }

    return { ...next, players: updatedPlayers };
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
