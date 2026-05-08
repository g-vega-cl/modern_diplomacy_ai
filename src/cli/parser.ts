import { Unit, UnitType, Order, OrderType } from "../engine/types";

export type ParseResult = {
  ok: true;
  order: Order;
} | {
  ok: false;
  error: string;
};

export function parseOrder(input: string, playerUnits: ReadonlyMap<string, Unit>): ParseResult {
  const trimmed = input.trim().toUpperCase();
  if (!trimmed) return { ok: false, error: "empty input" };

  const tokens = trimmed.split(/\s+/);
  if (tokens.length < 2) return { ok: false, error: "expected: {type} {location} {command}" };

  const typeToken = tokens[0];
  if (typeToken !== "A" && typeToken !== "F") {
    return { ok: false, error: "unit type must be A (army) or F (fleet)" };
  }
  const unitType = typeToken === "A" ? UnitType.ARMY : UnitType.FLEET;

  const locationToken = tokens[1];
  const unit = findUnitByLocation(playerUnits, locationToken, unitType);
  if (!unit) {
    return { ok: false, error: `no ${typeToken} unit at ${locationToken}` };
  }

  const command = tokens[2];

  // HOLD: A PAR H  or  A PAR HOLD
  if (command === "H" || command === "HOLD") {
    return { ok: true, order: { unitId: unit.id, type: OrderType.HOLD } };
  }

  // MOVE: A PAR -> BUR  or  A PAR MOVE BUR
  if (command === "->" || command === "MOVE" || command === "TO") {
    if (tokens.length < 4) return { ok: false, error: "MOVE requires a destination" };
    return { ok: true, order: { unitId: unit.id, type: OrderType.MOVE, targetLocationId: tokens[3] } };
  }

  // SUPPORT: A MAR S A PAR           (support to HOLD)
  //          A MAR S PAR             (support to HOLD, implicit type)
  //          A MAR S A PAR -> BUR    (support to MOVE into BUR)
  if (command === "S" || command === "SUPPORT") {
    if (tokens.length < 4) return { ok: false, error: "SUPPORT requires a target unit" };

    const rest = tokens.slice(3);
    const arrowIdx = rest.indexOf("->");
    const spec = arrowIdx >= 0 ? rest.slice(0, arrowIdx) : rest;

    let targetLoc: string;
    if (spec.length === 1) {
      targetLoc = spec[0];
    } else if (spec.length >= 2 && (spec[0] === "A" || spec[0] === "F")) {
      targetLoc = spec[1];
    } else {
      targetLoc = spec[0];
    }

    const targetUnit = findUnitByLocation(playerUnits, targetLoc);
    if (!targetUnit) {
      return { ok: false, error: `no unit found at ${targetLoc}` };
    }

    if (arrowIdx >= 0) {
      const moveDest = rest[arrowIdx + 1];
      if (!moveDest) return { ok: false, error: "SUPPORT MOVE requires a destination province" };
      return {
        ok: true,
        order: {
          unitId: unit.id,
          type: OrderType.SUPPORT,
          supportUnitId: targetUnit.id,
          supportOrderType: OrderType.MOVE,
          supportTargetLocationId: moveDest,
        },
      };
    }

    return {
      ok: true,
      order: { unitId: unit.id, type: OrderType.SUPPORT, supportUnitId: targetUnit.id },
    };
  }

  return { ok: false, error: `unknown command: ${command} (try H, ->, or S)` };
}

function findUnitByLocation(
  playerUnits: ReadonlyMap<string, Unit>,
  locationToken: string,
  typeFilter?: UnitType,
): Unit | undefined {
  for (const unit of playerUnits.values()) {
    const locNorm = unit.locationId.replace("_", " ");
    if (locNorm !== locationToken && unit.locationId !== locationToken) continue;
    if (typeFilter && unit.type !== typeFilter) continue;
    return unit;
  }
  return undefined;
}
