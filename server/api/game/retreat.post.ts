import { defineEventHandler, readBody, createError } from "h3";
import { gameManager } from "../../game/game-manager";

// POST /api/game/retreat — submit a retreat for a dislodged unit
// Body: { unitId: string, locationId: string }  OR  { unitId: string, disband: true }
export default defineEventHandler(async (event) => {
  const body = await readBody<{ unitId: string; locationId?: string; disband?: boolean }>(event);
  if (!body || !body.unitId) {
    throw createError({ statusCode: 400, message: "unitId is required" });
  }
  if (body.disband) {
    // Disband: just mark retreat as resolved
    gameManager.submitRetreat(body.unitId, "");
    return { success: true, action: "disbanded" };
  }
  if (!body.locationId) {
    throw createError({ statusCode: 400, message: "locationId or disband is required" });
  }
  gameManager.submitRetreat(body.unitId, body.locationId);
  return { success: true, action: "retreated", locationId: body.locationId };
});
