import { Unit, UnitType, GameState, ProvinceType } from "./types";

const MULTI_COAST_PARENTS = new Set(["SPA", "STP", "BUL"]);

export class MovementValidator {
  static isValidMove(unit: Unit, fromId: string, toId: string, state: GameState): boolean {
    const from = state.provinces.get(fromId);
    const to = state.provinces.get(toId);
    if (!from || !to) return false;

    const adjacent = from.neighbors.includes(toId);
    if (!adjacent) return false;

    if (unit.type === UnitType.ARMY) {
      return true;
    }

    if (unit.type === UnitType.FLEET) {
      if (to.type === ProvinceType.LAND && !to.landConnection) return false;

      if (to.type === ProvinceType.COAST && MULTI_COAST_PARENTS.has(to.id)) {
        return false;
      }

      return true;
    }

    return false;
  }

  static getValidMoves(unit: Unit, state: GameState): string[] {
    const from = state.provinces.get(unit.locationId);
    if (!from) return [];

    const valid: string[] = [];
    for (const nId of from.neighbors) {
      if (this.isValidMove(unit, unit.locationId, nId, state)) {
        valid.push(nId);
      }
    }
    return valid;
  }
}
