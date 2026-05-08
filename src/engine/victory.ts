import { Player } from "./types";
import { GAME_CONFIG } from "./config";

export class VictoryChecker {
  static checkVictory(players: ReadonlyMap<string, Player>): Player | null {
    for (const player of players.values()) {
      if (player.supplyCenterCount >= GAME_CONFIG.WINNING_SUPPLY_CENTERS) {
        return player;
      }
    }

    const activePlayers = Array.from(players.values()).filter(p => !p.eliminated);

    if (activePlayers.length === 1 && players.size > 1) {
      return activePlayers[0];
    }

    return null;
  }
}
