import { defineEventHandler, readBody, createError } from "h3";
import { gameManager } from "../../game/game-manager";
import type { BuildOrder } from "~/engine/types";

// POST /api/game/build — submit builds for a player
// Body: { playerId: string, builds: BuildOrder[] }
export default defineEventHandler(async (event) => {
  const body = await readBody<{ playerId: string; builds: BuildOrder[] }>(event);
  if (!body || !body.playerId || !body.builds) {
    throw createError({ statusCode: 400, message: "playerId and builds are required" });
  }
  gameManager.submitBuild(body.playerId, body.builds);
  return { success: true };
});
