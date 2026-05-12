import { GameState, Phase, Order, Unit, UnitType, BuildOrder, Player, Placement } from "./types";
import { GAME_CONFIG, PLAYERS, HOME_SCS, STARTING_UNITS } from "./config";
import { createProvinces } from "./provinces";
import { VictoryChecker } from "./victory";
import { MovementValidator } from "./movement";
import { SupplyCenterManager } from "./supply";
import { ResolutionEngine } from "./resolution";

export class DiplomacyEngine {
  createGame(initialPlacements?: Record<string, Placement[]>): GameState {
    const provinces = createProvinces();
    const players = new Map<string, Player>();
    const allUnits = new Map<string, Unit>();
    const orders = new Map<string, Order>();

    if (initialPlacements) {
      // Build supply center ownership map from home centers
      const scOwners = new Map<string, string>();
      for (const [pid, scs] of Object.entries(HOME_SCS)) {
        for (const sc of scs) scOwners.set(sc, pid);
      }

      for (const playerId of PLAYERS) {
        const unitMap = new Map<string, Unit>();
        const placements = initialPlacements[playerId] || [];

        for (let i = 0; i < placements.length; i++) {
          const p = placements[i];
          const unitId = `${p.type}_${p.locationId}_${i}`;
          const unit: Unit = {
            id: unitId,
            type: p.type,
            ownerId: playerId,
            locationId: p.locationId,
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
        supplyCenterOwners: scOwners,
      };
    }

    // Placement phase: create players with no units
    // Initialize supply center ownership from home centers
    const scOwners = new Map<string, string>();
    for (const [pid, scs] of Object.entries(HOME_SCS)) {
      for (const sc of scs) scOwners.set(sc, pid);
    }
    
    for (const playerId of PLAYERS) {
      players.set(playerId, {
        id: playerId,
        name: playerId.charAt(0).toUpperCase() + playerId.slice(1),
        supplyCenterCount: HOME_SCS[playerId]?.length || 3,
        units: new Map(),
        eliminated: false,
      });
    }

    return {
      year: GAME_CONFIG.START_YEAR,
      season: "SPRING",
      phase: Phase.PLACEMENT,
      players,
      provinces,
      units: allUnits,
      orders,
      retreatsNeeded: [],
      supplyCenterOwners: scOwners,
    };
  }

  submitPlacements(state: GameState, playerId: string, placements: Placement[]): GameState {
    if (state.phase !== Phase.PLACEMENT) return state;

    const nextUnits = new Map(state.units);
    const nextPlayers = new Map(state.players);
    const player = nextPlayers.get(playerId);
    if (!player) return state;

    const nextPlayerUnits = new Map(player.units);

    for (let i = 0; i < placements.length; i++) {
      const p = placements[i];
      const unitId = `${p.type}_${p.locationId}_${i}_${playerId}`;
      const unit: Unit = {
        id: unitId,
        type: p.type,
        ownerId: playerId,
        locationId: p.locationId,
        mustRetreat: false,
      };
      nextPlayerUnits.set(unitId, unit);
      nextUnits.set(unitId, unit);
    }

    nextPlayers.set(playerId, { ...player, units: nextPlayerUnits });

    return { ...state, units: nextUnits, players: nextPlayers };
  }

  getValidPlacements(state: GameState, playerId: string): Placement[] {
    if (state.phase !== Phase.PLACEMENT) return [];

    const player = state.players.get(playerId);
    if (!player) return [];

    const homeSCs = HOME_SCS[playerId] || [];
    if (homeSCs.length === 0) return [];

    const remaining = homeSCs.length - player.units.size;
    if (remaining <= 0) return [];

    const valid: Placement[] = [];
    for (const scId of homeSCs) {
      const province = state.provinces.get(scId);
      if (!province) continue;

      const occupied = [...state.units.values()].some(u => u.locationId === scId);
      if (occupied) continue;

      valid.push({ type: UnitType.ARMY, locationId: scId });

      if (province.type !== "LAND" as any) {
        valid.push({ type: UnitType.FLEET, locationId: scId });
      }
    }

    return valid;
  }

  isPlacementComplete(state: GameState): boolean {
    for (const playerId of PLAYERS) {
      const player = state.players.get(playerId);
      const requiredUnits = HOME_SCS[playerId]?.length || GAME_CONFIG.INITIAL_UNITS_PER_PLAYER;
      if (!player || player.units.size < requiredUnits) return false;
    }
    return true;
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
    const player = state.players.get(playerId);
    if (!player) throw new Error(`Player ${playerId} not found`);

    // ── Validate build count against SC delta (§BUG 1 fix) ──
    const delta = player.supplyCenterCount - player.units.size;
    const creates = builds.filter(b => b.type === "CREATE");
    const destroys = builds.filter(b => b.type === "DESTROY");

    if (delta > 0 && creates.length > delta) {
      throw new Error(
        `Build count exceeded: ${player.name} needs ${delta} build(s) but got ${creates.length} CREATE orders. ` +
        `Supply centers: ${player.supplyCenterCount}, units: ${player.units.size}`
      );
    }
    if (delta < 0 && destroys.length > Math.abs(delta)) {
      throw new Error(
        `Disband count exceeded: ${player.name} needs ${Math.abs(delta)} disband(s) but got ${destroys.length} DESTROY orders. ` +
        `Supply centers: ${player.supplyCenterCount}, units: ${player.units.size}`
      );
    }
    // ─────────────────────────────────────────────────────

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
