import { defineEventHandler, getRouterParam, readBody, createError } from "h3";
import { gameManager } from "../../game/game-manager";
import type { Order } from "~/engine/types";
import { PLAYERS } from "~/engine/config";
import { chatManager } from "~/features/negotiation/chat-manager";

// GET /api/game/state — full game state
export default defineEventHandler((event) => {
  const state = gameManager.getState();

  const players: Record<string, any> = {};
  for (const [id, p] of state.players) {
    players[id] = {
      id: p.id,
      name: p.name,
      supplyCenterCount: p.supplyCenterCount,
      unitCount: p.units.size,
      eliminated: p.eliminated,
    };
  }

  const units: Record<string, any> = {};
  for (const [id, u] of state.units) {
    units[id] = {
      id: u.id,
      type: u.type,
      ownerId: u.ownerId,
      locationId: u.locationId,
      mustRetreat: u.mustRetreat,
    };
  }

  return {
    year: state.year,
    season: state.season,
    phase: state.phase,
    players,
    units,
    retreatsNeeded: state.retreatsNeeded,
  };
});
