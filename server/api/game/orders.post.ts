import { defineEventHandler, readBody, createError } from "h3";
import { gameManager } from "../../game/game-manager";
import type { Order } from "~/engine/types";

// POST /api/game/orders — submit orders for a player
// Body: { playerId: string, orders: Order[] }
export default defineEventHandler(async (event) => {
  const body = await readBody<{ playerId: string; orders: Order[] }>(event);
  if (!body || !body.playerId || !body.orders) {
    throw createError({ statusCode: 400, message: "playerId and orders are required" });
  }
  gameManager.submitOrders(body.playerId, body.orders);
  return { success: true };
});