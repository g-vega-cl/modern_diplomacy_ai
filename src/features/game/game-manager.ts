import { DiplomacyEngine } from "~/features/engine/engine";
import { GameStateMachine } from "~/features/engine/state-machine";
import { VictoryChecker } from "~/features/engine/victory";
import type { GameState, Order, BuildOrder, Placement } from "~/features/engine/types";
import { Phase } from "~/features/engine/types";
import { PLAYERS, STARTING_UNITS } from "~/features/engine/config";

class GameManager {
  private engine = new DiplomacyEngine();
  private state: GameState;

  constructor() {
    // Create game with default starting positions
    const defaultPlacements: Record<string, Placement[]> = {};
    for (const playerId of PLAYERS) {
      const units = STARTING_UNITS[playerId];
      if (units) {
        defaultPlacements[playerId] = units.map((u) => ({
          type: u.type as any,
          locationId: u.locationId,
        }));
      }
    }
    this.state = this.engine.createGame(defaultPlacements);
    this.state = GameStateMachine.advancePhase(this.state); // skip placement → ORDER
  }

  getState(): GameState {
    return this.state;
  }

  getPlayerView(playerId: string) {
    return this.engine.getPlayerView(this.state, playerId);
  }

  getGameStatus() {
    return this.engine.getGameStatus(this.state);
  }

  submitOrders(playerId: string, orders: Order[]) {
    this.state = this.engine.submitOrders(this.state, playerId, orders);
  }

  allOrdersSubmitted(): boolean {
    for (const player of this.state.players.values()) {
      if (player.eliminated) continue;
      for (const unit of player.units.values()) {
        if (!this.state.orders.has(unit.id)) return false;
      }
    }
    return true;
  }

  resolvePhase() {
    const { result, state: postSupply } = this.engine.resolvePhase(this.state);

    // Apply moves
    let nextState = { ...postSupply };
    const nextUnits = new Map(nextState.units);
    for (const move of result.successfulMoves) {
      const unit = nextUnits.get(move.unitId);
      if (unit) nextUnits.set(move.unitId, { ...unit, locationId: move.toLocationId });
    }

    const retreatsNeeded: string[] = [];
    for (const d of result.dislodgedUnits) {
      const unit = nextUnits.get(d.unitId);
      if (unit) {
        nextUnits.set(d.unitId, { ...unit, mustRetreat: true });
        retreatsNeeded.push(d.unitId);
      }
    }
    nextState = { ...nextState, units: nextUnits, retreatsNeeded };

    const winner = VictoryChecker.checkVictory(nextState.players);
    this.state = GameStateMachine.advancePhase(nextState);
    return { result, winner, nextPhase: this.state.phase };
  }

  submitRetreat(unitId: string, locationId: string) {
    this.state = this.engine.submitRetreat(this.state, unitId, locationId);
  }

  allRetreatsResolved(): boolean {
    return this.state.retreatsNeeded.length === 0;
  }

  submitBuild(playerId: string, builds: BuildOrder[]) {
    this.state = this.engine.submitBuild(this.state, playerId, builds);
  }

  advanceAfterRetreats() {
    const next = { ...this.state, retreatsNeeded: [] };
    this.state = GameStateMachine.advancePhase(next);
    return this.state;
  }

  advanceAfterBuilds() {
    this.state = GameStateMachine.advancePhase(this.state);
    return this.state;
  }

  reset() {
    const defaultPlacements: Record<string, Placement[]> = {};
    for (const playerId of PLAYERS) {
      const units = STARTING_UNITS[playerId];
      if (units) {
        defaultPlacements[playerId] = units.map((u) => ({
          type: u.type as any,
          locationId: u.locationId,
        }));
      }
    }
    this.state = this.engine.createGame(defaultPlacements);
    this.state = GameStateMachine.advancePhase(this.state);
  }
}

export const gameManager = new GameManager();
