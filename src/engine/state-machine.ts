import { GameState, Phase } from "./types";

export class GameStateMachine {
  static advancePhase(state: GameState): GameState {
    const next = {
      ...state,
      orders: new Map() as ReadonlyMap<string, import("./types").Order>,
    };

    if (state.phase === Phase.ORDER) {
      next.phase = Phase.RESOLUTION;
    } else if (state.phase === Phase.RESOLUTION) {
      if (state.retreatsNeeded.length > 0) {
        next.phase = Phase.RETREAT;
      } else if (state.season === "FALL") {
        next.phase = Phase.BUILD;
      } else {
        next.season = "FALL";
        next.phase = Phase.ORDER;
      }
    } else if (state.phase === Phase.RETREAT) {
      if (state.season === "FALL") {
        next.phase = Phase.BUILD;
      } else {
        next.season = "FALL";
        next.phase = Phase.ORDER;
      }
    } else if (state.phase === Phase.BUILD) {
      next.season = "SPRING";
      next.year += 1;
      next.phase = Phase.ORDER;
    }

    return next;
  }
}
