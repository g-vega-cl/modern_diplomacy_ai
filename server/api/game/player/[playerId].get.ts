import { defineEventHandler, getRouterParam } from "h3";
import { gameManager } from "../../game/game-manager";

// GET /api/game/player/:playerId — player-specific view (visible units, valid moves, valid builds)
export default defineEventHandler((event) => {
  const playerId = getRouterParam(event, "playerId");
  if (!playerId) {
    return { error: "playerId is required" };
  }
  return gameManager.getPlayerView(playerId);
});
