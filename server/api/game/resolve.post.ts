import { defineEventHandler } from "h3";
import { gameManager } from "../../game/game-manager";

// POST /api/game/resolve — resolve the current phase
export default defineEventHandler(() => {
  const { result, winner, nextPhase } = gameManager.resolvePhase();
  return {
    successfulMoves: result.successfulMoves,
    bouncedMoves: result.bouncedMoves,
    dislodgedUnits: result.dislodgedUnits,
    destroyedUnits: result.destroyedUnits,
    combatLog: result.combatLog,
    winner: winner ? { id: winner.id, name: winner.name } : null,
    nextPhase,
  };
});
