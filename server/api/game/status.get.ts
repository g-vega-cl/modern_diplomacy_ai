import { defineEventHandler } from "h3";
import { gameManager } from "../../game/game-manager";

// GET /api/game/status — game status (phase, winner, etc.)
export default defineEventHandler(() => {
  return gameManager.getGameStatus();
});
