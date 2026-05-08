import { GameState, Phase, Order, Unit, UnitType, BuildOrder, Player } from "./types";
import { GAME_CONFIG, PLAYERS, HOME_SCS, STARTING_UNITS } from "./config";
import { createProvinces } from "./provinces";
import { VictoryChecker } from "./victory";
import { MovementValidator } from "./movement";
import { SupplyCenterManager } from "./supply";
import { ResolutionEngine } from "./resolution";

export class DiplomacyEngine {
  createGame(): GameState {
    const provinces = createProvinces();
    const players = new Map<string, Player>();
    const allUnits = new Map<string, Unit>();
    const orders = new Map<string, Order>();

    for (const playerId of PLAYERS) {
      const unitMap = new Map<string, Unit>();
      const starting = STARTING_UNITS[playerId] || [];

      for (let i = 0; i < starting.length; i++) {
        const s = starting[i];
        const unitId = `${s.type}_${s.locationId}`;
        const unit: Unit = {
          id: unitId,
          type: s.type as UnitType,
          ownerId: playerId,
          locationId: s.locationId,
          mustRetreat: false,
        };
        unitMap.set(unitId, unit);
        allUnits.set(unitId, unit);
      }

      players.set(playerId, {
        id: playerId,
        name: playerId.charAt(0).toUpperCase() + playerId.slice(1),
        supplyCenterCount: HOME_SCS[playerId]?.length || 3,
        units: unitMap,
        eliminated: false,
      });
    }

    return {
      year: GAME_CONFIG.START_YEAR,
      season: "SPRING",
      phase: Phase.ORDER,
      players,
      provinces,
      units: allUnits,
      orders,
      retreatsNeeded: [],
    };
  }

  submitOrders(state: GameState, playerId: string, orders: Order[]): GameState {
    const nextOrders = new Map(state.orders);
    for (const order of orders) {
      nextOrders.set(order.unitId, order);
    }
    return { ...state, orders: nextOrders };
  }

  resolvePhase(state: GameState) {
    const result = ResolutionEngine.resolve(state);
    const postSupply = SupplyCenterManager.updateOwnership(state, result);
    return { result, state: postSupply };
  }

  submitRetreat(state: GameState, unitId: string, locationId: string): GameState {
    const nextUnits = new Map(state.units);
    const unit = nextUnits.get(unitId);
    if (unit) {
      nextUnits.set(unitId, { ...unit, locationId, mustRetreat: false });
    }
    const nextRetreats = state.retreatsNeeded.filter(id => id !== unitId);
    return { ...state, units: nextUnits, retreatsNeeded: nextRetreats };
  }

  submitBuild(state: GameState, playerId: string, builds: BuildOrder[]): GameState {
    const nextUnits = new Map(state.units);
    const nextPlayers = new Map(state.players);

    for (const build of builds) {
      if (build.type === "CREATE") {
        const unitId = `${build.unitType}_${build.locationId}`;
        const unit: Unit = {
          id: unitId,
          type: build.unitType || UnitType.ARMY,
          ownerId: playerId,
          locationId: build.locationId || "",
          mustRetreat: false,
        };
        nextUnits.set(unitId, unit);
        const p = nextPlayers.get(playerId);
        if (p) {
          const nextPUnits = new Map(p.units);
          nextPUnits.set(unitId, unit);
          nextPlayers.set(playerId, { ...p, units: nextPUnits });
        }
      } else if (build.type === "DESTROY") {
        if (build.locationId) {
          const toRemove = [...nextUnits.values()].find(
            u => u.ownerId === playerId && u.locationId === build.locationId
          );
          if (toRemove) {
            nextUnits.delete(toRemove.id);
            const p = nextPlayers.get(playerId);
            if (p) {
              const nextPUnits = new Map(p.units);
              nextPUnits.delete(toRemove.id);
              nextPlayers.set(playerId, { ...p, units: nextPUnits });
            }
          }
        }
      }
    }

    return { ...state, units: nextUnits, players: nextPlayers };
  }

  getValidMoves(state: GameState, unitId: string): string[] {
    const unit = state.units.get(unitId);
    if (!unit) return [];
    return MovementValidator.getValidMoves(unit, state);
  }

  getValidRetreats(state: GameState, unitId: string): string[] {
    const unit = state.units.get(unitId);
    if (!unit || !unit.mustRetreat) return [];
    return MovementValidator.getValidMoves(unit, state);
  }

  getValidBuilds(state: GameState, playerId: string): string[] {
    const player = state.players.get(playerId);
    if (!player) return [];
    const builds = SupplyCenterManager.calculateBuilds(state);
    const delta = builds.get(playerId) || 0;
    if (delta <= 0) return [];
    const homeSCs = HOME_SCS[playerId] || [];
    return homeSCs.filter(sc => {
      for (const unit of state.units.values()) {
        if (unit.locationId === sc) return false;
      }
      return true;
    });
  }

  getGameStatus(state: GameState): GameStatus {
    const winner = VictoryChecker.checkVictory(state.players);
    return {
      winner,
      phase: state.phase,
      currentSeason: state.season,
      currentYear: state.year,
    };
  }

  getPlayerView(state: GameState, playerId: string): PlayerView {
    const player = state.players.get(playerId);
    const allMoves = new Map<string, string[]>();
    if (player) {
      for (const unit of player.units.values()) {
        allMoves.set(unit.id, this.getValidMoves(state, unit.id));
      }
    }
    const validBuilds = this.getValidBuilds(state, playerId);
    return {
      player: player || { id: playerId, name: playerId, supplyCenterCount: 0, units: new Map(), eliminated: true },
      visibleUnits: [...state.units.values()],
      visibleProvinces: [...state.provinces.keys()],
      validMoves: allMoves,
      validBuilds,
    };
  }
}

interface GameStatus {
  readonly winner: Player | null;
  readonly phase: Phase;
  readonly currentSeason: "SPRING" | "FALL";
  readonly currentYear: number;
}

interface PlayerView {
  readonly player: Player;
  readonly visibleUnits: readonly Unit[];
  readonly visibleProvinces: readonly string[];
  readonly validMoves: ReadonlyMap<string, readonly string[]>;
  readonly validBuilds: readonly string[];
}
