import { defineEventHandler } from "h3";
import { gameManager } from "../../game/game-manager";
import { chatManager } from "~/features/negotiation/chat-manager";

// POST /api/game/reset — reset the game
export default defineEventHandler(() => {
  gameManager.reset();
  chatManager.reset();
  return { success: true };
});
