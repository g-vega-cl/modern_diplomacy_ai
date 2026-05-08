import { GameState, ResolutionResult, Order, OrderType, Unit, UnitType, ProvinceType } from "./types";

function getFallbackOrder(unit: Unit, state: GameState): Order {
  return state.orders.get(unit.id) ?? { unitId: unit.id, type: OrderType.HOLD };
}

function isAdjacent(fromId: string, toId: string, state: GameState): boolean {
  return state.provinces.get(fromId)?.neighbors.includes(toId) ?? false;
}

export class ResolutionEngine {
  static resolve(state: GameState): ResolutionResult {
    const successfulMoves: Array<{ unitId: string; fromLocationId: string; toLocationId: string }> = [];
    const bouncedMoves: Array<{ unitId: string; attemptedLocationId: string }> = [];
    const dislodgedUnits: Array<{ unitId: string; fromLocationId: string; dislodgedByUnitId: string }> = [];
    const destroyedUnits: string[] = [];
    const combatLog: string[] = [];

    if (state.units.size === 0) {
      return { successfulMoves, bouncedMoves, dislodgedUnits, destroyedUnits, combatLog };
    }

    const usedUnits = new Set<string>();

    // Parse orders
    const unitOrders = new Map<string, Order>();
    const supportOrders = new Map<string, Order>();
    const moveOrders = new Map<string, { from: string; to: string }>();

    for (const unit of state.units.values()) {
      const order = getFallbackOrder(unit, state);
      unitOrders.set(unit.id, order);
      if (order.type === OrderType.SUPPORT) {
        supportOrders.set(unit.id, order);
      } else if (order.type === OrderType.MOVE && order.targetLocationId) {
        if (isAdjacent(unit.locationId, order.targetLocationId, state)) {
          moveOrders.set(unit.id, { from: unit.locationId, to: order.targetLocationId });
        }
      }
    }

    // Detect direct swaps
    const directSwaps = new Set<string>();
    for (const [id1, info1] of moveOrders) {
      for (const [id2, info2] of moveOrders) {
        if (id1 < id2 && info1.to === info2.from && info1.from === info2.to) {
          directSwaps.add(id1);
          directSwaps.add(id2);
        }
      }
    }
    for (const id of directSwaps) {
      bouncedMoves.push({ unitId: id, attemptedLocationId: moveOrders.get(id)!.to });
      usedUnits.add(id);
      combatLog.push(id + " bounced (direct swap)");
    }

    // Build attacks per province
    const attacksOnProvince = new Map<string, Array<{ unitId: string; fromId: string; strength: number }>>();
    for (const [unitId, info] of moveOrders) {
      if (directSwaps.has(unitId)) continue;
      if (!attacksOnProvince.has(info.to)) attacksOnProvince.set(info.to, []);
      attacksOnProvince.get(info.to)!.push({ unitId, fromId: info.from, strength: 1 });
    }

    // Determine which supports are cut
    const cutSupports = new Set<string>();
    for (const [supporterId, sOrder] of supportOrders) {
      const supporter = state.units.get(supporterId);
      if (!supporter) { cutSupports.add(supporterId); continue; }

      // Army in sea cannot support (§8.1)
      if (supporter.type === UnitType.ARMY) {
        const suppProv = state.provinces.get(supporter.locationId);
        if (suppProv?.type === ProvinceType.SEA) {
          cutSupports.add(supporterId);
          combatLog.push(supporterId + " support ignored (army in sea cannot support)");
          continue;
        }
      }

      const directedTarget = sOrder.supportTargetLocationId;
      const atk = attacksOnProvince.get(supporter.locationId);
      if (!atk) continue;

      for (const attacker of atk) {
        const isBG = directedTarget != null && attacker.fromId === directedTarget;
        if (!isBG) {
          cutSupports.add(supporterId);
          combatLog.push(supporterId + " support cut by " + attacker.unitId);
          break;
        }
      }
    }

    // Calculate final attack strengths
    for (const [, attackers] of attacksOnProvince) {
      for (const attacker of attackers) {
        attacker.strength = 1 + this.countMoveSupports(attacker.unitId, state, unitOrders, cutSupports);
      }
    }

    // Calculate defender strengths
    const defenderStrength = new Map<string, number>();
    for (const unit of state.units.values()) {
      const order = unitOrders.get(unit.id)!;
      if (order.type === OrderType.MOVE) continue;
      if (order.type === OrderType.SUPPORT) continue;
      let str = 1;
      for (const sOrder of supportOrders.values()) {
        if (cutSupports.has(sOrder.unitId)) continue;
        if (sOrder.supportUnitId === unit.id) {
          if (sOrder.supportOrderType !== OrderType.MOVE) { // hold support
            const sup = state.units.get(sOrder.unitId);
            if (sup && isAdjacent(sup.locationId, unit.locationId, state)) {
              str++;
            }
          }
        }
      }
      defenderStrength.set(unit.id, str);
    }

    // Resolve each contested province
    for (const [destination, attackers] of attacksOnProvince) {
      let filtered = attackers.filter(a => !usedUnits.has(a.unitId));
      if (filtered.length === 0) continue;

      const destProv = state.provinces.get(destination);
      const defender = this.findStationaryDefender(destination, state, unitOrders);

      // ── §8.3 Army landing: auto-fail if coast is occupied or contested ──
      const armyFromSeaAttackers: Array<{ unitId: string; fromId: string; strength: number }> = [];
      for (const a of filtered) {
        const unit = state.units.get(a.unitId);
        if (unit?.type === UnitType.ARMY) {
          const fromProv = state.provinces.get(a.fromId);
          if (fromProv?.type === ProvinceType.SEA) {
            armyFromSeaAttackers.push(a);
          }
        }
      }

      if (armyFromSeaAttackers.length > 0) {
        const isOccupied = defender != null && !usedUnits.has(defender.id);
        const isContested = isOccupied || filtered.length > 1;

        if (isContested) {
          for (const army of armyFromSeaAttackers) {
            bouncedMoves.push({ unitId: army.unitId, attemptedLocationId: destination });
            usedUnits.add(army.unitId);
            combatLog.push(army.unitId + " landing fails (contested coast)");
          }
          filtered = filtered.filter(a => !armyFromSeaAttackers.some(x => x.unitId === a.unitId));
        }
      }

      if (filtered.length === 0) continue;

      // ── §8.2 Fleet vs Army in sea: fleets always defeat armies ──
      if (destProv?.type === ProvinceType.SEA) {
        const fleetAttackers = filtered.filter(a => {
          const unit = state.units.get(a.unitId);
          return unit?.type === UnitType.FLEET;
        });

        if (fleetAttackers.length > 0) {
          // Army attackers auto-bounce
          for (const a of filtered) {
            const unit = state.units.get(a.unitId);
            if (unit?.type === UnitType.ARMY) {
              bouncedMoves.push({ unitId: a.unitId, attemptedLocationId: destination });
              usedUnits.add(a.unitId);
              combatLog.push(a.unitId + " army bounced (fleet present in sea)");
            }
          }
          filtered = fleetAttackers;

            // Army defender auto-dislodged by fleet (§8.2)
          if (defender && !usedUnits.has(defender.id) && defender.type === UnitType.ARMY) {
            usedUnits.add(defender.id);
            combatLog.push(defender.id + " auto-dislodged (army vs fleet in sea)");
            dislodgedUnits.push({ unitId: defender.id, fromLocationId: destination, dislodgedByUnitId: filtered.length > 0 ? filtered[0].unitId : "unknown" });

            // Strongest fleet takes the province
            if (filtered.length > 0) {
              let strongest = filtered[0];
              let tie = false;
              for (let i = 1; i < filtered.length; i++) {
                if (filtered[i].strength > strongest.strength) {
                  strongest = filtered[i];
                  tie = false;
                } else if (filtered[i].strength === strongest.strength) {
                  tie = true;
                }
              }
              if (!tie) {
                successfulMoves.push({ unitId: strongest.unitId, fromLocationId: strongest.fromId, toLocationId: destination });
                usedUnits.add(strongest.unitId);
                for (const a of filtered) {
                  if (a.unitId !== strongest.unitId && !usedUnits.has(a.unitId)) {
                    bouncedMoves.push({ unitId: a.unitId, attemptedLocationId: destination });
                    usedUnits.add(a.unitId);
                  }
                }
              } else {
                // Fleet tie — all bounce (army still dislodged)
                for (const a of filtered) {
                  bouncedMoves.push({ unitId: a.unitId, attemptedLocationId: destination });
                  usedUnits.add(a.unitId);
                }
              }
            }
            continue;
          }
        }
      }

      if (filtered.length === 0) continue;

      // ── Normal strength resolution ──
      let defStr = 0;
      if (defender && !usedUnits.has(defender.id)) {
        defStr = defenderStrength.get(defender.id) ?? 1;
      }

      let strongest = filtered[0];
      let tie = false;
      for (let i = 1; i < filtered.length; i++) {
        if (filtered[i].strength > strongest.strength) {
          strongest = filtered[i];
          tie = false;
        } else if (filtered[i].strength === strongest.strength) {
          tie = true;
        }
      }

      const wins = (defStr > 0 && strongest.strength > defStr && !tie) ||
                   (defStr === 0 && !tie);

      if (wins) {
        successfulMoves.push({ unitId: strongest.unitId, fromLocationId: strongest.fromId, toLocationId: destination });
        usedUnits.add(strongest.unitId);
        if (defender && defStr > 0) {
          usedUnits.add(defender.id);
          dislodgedUnits.push({ unitId: defender.id, fromLocationId: destination, dislodgedByUnitId: strongest.unitId });
        }
      } else {
        for (const a of filtered) {
          if (!usedUnits.has(a.unitId)) {
            bouncedMoves.push({ unitId: a.unitId, attemptedLocationId: destination });
            usedUnits.add(a.unitId);
          }
        }
      }
    }

    // Any remaining moves that weren't resolved (shouldn't happen, but safety net)
    for (const [unitId, info] of moveOrders) {
      if (!usedUnits.has(unitId)) {
        bouncedMoves.push({ unitId, attemptedLocationId: info.to });
        usedUnits.add(unitId);
      }
    }

    return { successfulMoves, bouncedMoves, dislodgedUnits, destroyedUnits, combatLog };
  }

  private static findStationaryDefender(provinceId: string, state: GameState, unitOrders: Map<string, Order>): Unit | null {
    for (const unit of state.units.values()) {
      if (unit.locationId !== provinceId) continue;
      const order = unitOrders.get(unit.id);
      if (!order || order.type !== OrderType.MOVE) return unit;
    }
    return null;
  }

  private static countMoveSupports(
    attackingUnitId: string,
    state: GameState,
    unitOrders: Map<string, Order>,
    cutSupports: Set<string>,
  ): number {
    let count = 0;
    for (const order of unitOrders.values()) {
      if (order.type !== OrderType.SUPPORT || cutSupports.has(order.unitId)) continue;
      if (order.supportUnitId !== attackingUnitId) continue;
      if (order.supportOrderType !== OrderType.MOVE) continue;
      if (!order.supportTargetLocationId) continue;

      const supporter = state.units.get(order.unitId);
      if (!supporter) continue;
      if (isAdjacent(supporter.locationId, order.supportTargetLocationId, state)) {
        count++;
      }
    }
    return count;
  }
}
