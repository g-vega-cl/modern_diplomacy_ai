#!/usr/bin/env npx tsx
/**
 * Diplomacy Engine Bridge — JSON-line protocol subprocess.
 * Run with: npx tsx ai-orchestrator/engine-bridge.ts
 * 
 * Reads JSON commands from stdin, calls DiplomacyEngine, writes JSON to stdout.
 */

import * as readline from "node:readline";
import { DiplomacyEngine } from "../src/engine/engine";
import { GameStateMachine } from "../src/engine/state-machine";
import { VictoryChecker } from "../src/engine/victory";
import { Phase, UnitType } from "../src/engine/types";
import type { Order, BuildOrder, Placement, GameState, Unit } from "../src/engine/types";
import { PLAYERS, STARTING_UNITS } from "../src/engine/config";

// ─── In-memory chat manager ──────────────────────────────────────

interface ChatChannel {
  id: string;
  name: string;
  type: "global" | "group";
  memberIds: string[];
  createdBy?: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  channelId: string;
  timestamp: number;
}

class ChatManager {
  private channels = new Map<string, ChatChannel>();
  private messages = new Map<string, ChatMessage[]>();
  private msgCounter = 0;

  constructor() {
    this.channels.set("global", {
      id: "global", name: "Global Diplomacy", type: "global", memberIds: [],
    });
    this.messages.set("global", []);
  }

  getPlayerChannels(playerId: string): ChatChannel[] {
    const result: ChatChannel[] = [];
    for (const ch of this.channels.values()) {
      if (ch.type === "global" || ch.memberIds.includes(playerId)) {
        result.push(ch);
      }
    }
    return result;
  }

  getMessagesSince(channelId: string, since: number): ChatMessage[] {
    const msgs = this.messages.get(channelId) || [];
    return msgs.filter(m => m.timestamp > since);
  }

  sendMessage(channelId: string, senderId: string, senderName: string, content: string): ChatMessage {
    const msg: ChatMessage = {
      id: `msg_${++this.msgCounter}`,
      senderId, senderName, content, channelId,
      timestamp: Date.now(),
    };
    let arr = this.messages.get(channelId);
    if (!arr) { arr = []; this.messages.set(channelId, arr); }
    arr.push(msg);
    if (arr.length > 500) arr.splice(0, arr.length - 500);
    return msg;
  }

  createGroup(name: string, createdBy: string, memberIds: string[]): ChatChannel {
    const id = `group_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const ch: ChatChannel = { id, name, type: "group", memberIds: [createdBy, ...memberIds], createdBy };
    this.channels.set(id, ch);
    this.messages.set(id, []);
    return ch;
  }

  reset(): void {
    this.channels.clear();
    this.messages.clear();
    this.channels.set("global", {
      id: "global", name: "Global Diplomacy", type: "global", memberIds: [],
    });
    this.messages.set("global", []);
    this.msgCounter = 0;
  }
}

// ─── Engine wrapper ──────────────────────────────────────────────

const chatManager = new ChatManager();
const engine = new DiplomacyEngine();

let state = engine.createGame(); // starts in PLACEMENT — LLMs will decide placements

function serializeState(s: GameState) {
  const players: Record<string, any> = {};
  for (const [id, p] of s.players) {
    const playerUnits: Record<string, any> = {};
    for (const [uid, u] of p.units) {
      playerUnits[uid] = { id: u.id, type: u.type, locationId: u.locationId };
    }
    players[id] = {
      id: p.id,
      name: p.name,
      supplyCenterCount: p.supplyCenterCount,
      unitCount: p.units.size,
      eliminated: p.eliminated,
      units: playerUnits,
    };
  }
  const units: Record<string, any> = {};
  for (const [id, u] of s.units) {
    units[id] = {
      id: u.id, type: u.type, ownerId: u.ownerId,
      locationId: u.locationId, mustRetreat: u.mustRetreat,
    };
  }
  return {
    year: s.year, season: s.season, phase: s.phase,
    players, units, retreatsNeeded: s.retreatsNeeded,
  };
}

function respond(id: number, data: Record<string, any>): string {
  return JSON.stringify({ id, ok: true, ...data });
}

function fail(id: number, error: string): string {
  return JSON.stringify({ id, ok: false, error });
}

// ─── JSON-line main loop ─────────────────────────────────────────

const rl = readline.createInterface({ input: process.stdin });

process.stderr.write("ENGINE_BRIDGE_READY\n");

rl.on("line", (line: string) => {
  let req: { id: number; method: string; params?: any };
  try {
    req = JSON.parse(line.trim());
  } catch {
    process.stdout.write(fail(0, "Invalid JSON") + "\n");
    return;
  }

  const { id, method, params = {} } = req;

  try {
    switch (method) {
      case "getState": {
        process.stdout.write(respond(id, { state: serializeState(state) }) + "\n");
        break;
      }

      case "getPlayerView": {
        const view = engine.getPlayerView(state, params.playerId);
        const validMoves: Record<string, string[]> = {};
        for (const [uid, moves] of view.validMoves) {
          validMoves[uid] = [...moves];
        }
        const playerUnits: Record<string, any> = {};
        if (view.player.units) {
          for (const [uid, u] of view.player.units) {
            playerUnits[uid] = { id: u.id, type: u.type, locationId: u.locationId };
          }
        }
        const validBuilds = view.validBuilds;
        const validPlacements = engine.getValidPlacements(state, params.playerId);
        process.stdout.write(respond(id, {
          view: {
            player: {
              id: view.player.id,
              name: view.player.name,
              supplyCenterCount: view.player.supplyCenterCount,
              eliminated: view.player.eliminated,
              unitCount: view.player.units.size,
              units: playerUnits,
            },
            visibleUnits: view.visibleUnits.map(u => ({
              id: u.id, type: u.type, ownerId: u.ownerId,
              locationId: u.locationId, mustRetreat: u.mustRetreat,
            })),
            validMoves,
            validBuilds,
            validPlacements,
          }
        }) + "\n");
        break;
      }

      case "submitOrders": {
        state = engine.submitOrders(state, params.playerId, params.orders);
        process.stdout.write(respond(id, {}) + "\n");
        break;
      }

      case "resolve": {
        const { result, state: postSupply } = engine.resolvePhase(state);

        let nextState = { ...postSupply };
        const nextUnits = new Map(nextState.units);
        for (const move of result.successfulMoves) {
          const unit = nextUnits.get(move.unitId);
          if (unit) nextUnits.set(move.unitId, { ...unit, locationId: move.toLocationId });
        }

        const retreatsNeeded: string[] = [];
        for (const d of result.dislodgedUnits) {
          const unit = nextUnits.get(d.unitId);
          if (unit) {
            nextUnits.set(d.unitId, { ...unit, mustRetreat: true });
            retreatsNeeded.push(d.unitId);
          }
        }
        nextState = { ...nextState, units: nextUnits, retreatsNeeded };

        const winner = VictoryChecker.checkVictory(nextState.players);
        // Advance past RESOLUTION: ORDER → RESOLUTION → RETREAT/BUILD/FALL_ORDER
        let advancedState = GameStateMachine.advancePhase(nextState);
        advancedState = GameStateMachine.advancePhase(advancedState);
        state = advancedState;

        process.stdout.write(respond(id, {
          result: {
            successfulMoves: result.successfulMoves,
            bouncedMoves: result.bouncedMoves,
            dislodgedUnits: result.dislodgedUnits,
            destroyedUnits: result.destroyedUnits,
          },
          winner: winner ? { id: winner.id, name: winner.name } : null,
          nextPhase: state.phase,
        }) + "\n");
        break;
      }

      case "submitRetreat": {
        if (params.disband || !params.locationId) {
          const nextUnits = new Map(state.units);
          nextUnits.delete(params.unitId);
          const nextPlayers = new Map(state.players);
          for (const [pid, p] of nextPlayers) {
            const playerUnits = new Map(p.units);
            if (playerUnits.delete(params.unitId)) {
              nextPlayers.set(pid, { ...p, units: playerUnits });
              break;
            }
          }
          state = {
            ...state, units: nextUnits, players: nextPlayers,
            retreatsNeeded: state.retreatsNeeded.filter(id => id !== params.unitId),
          };
        } else {
          state = engine.submitRetreat(state, params.unitId, params.locationId);
        }
        if (state.retreatsNeeded.length === 0) {
          state = { ...state, retreatsNeeded: [] };
          state = GameStateMachine.advancePhase(state);
        }
        process.stdout.write(respond(id, { phase: state.phase }) + "\n");
        break;
      }

      case "submitBuild": {
        state = engine.submitBuild(state, params.playerId, params.builds);
        process.stdout.write(respond(id, {}) + "\n");
        break;
      }

      case "advanceBuilds": {
        state = GameStateMachine.advancePhase(state);
        process.stdout.write(respond(id, { phase: state.phase }) + "\n");
        break;
      }

      case "getStatus": {
        const status = engine.getGameStatus(state);
        process.stdout.write(respond(id, {
          status: {
            winner: status.winner ? { id: status.winner.id, name: status.winner.name } : null,
            phase: status.phase,
            currentSeason: status.currentSeason,
            currentYear: status.currentYear,
          }
        }) + "\n");
        break;
      }

      case "submitPlacements": {
        state = engine.submitPlacements(state, params.playerId, params.placements);
        process.stdout.write(respond(id, {}) + "\n");
        break;
      }

      case "advancePhase": {
        state = GameStateMachine.advancePhase(state);
        process.stdout.write(respond(id, { phase: state.phase }) + "\n");
        break;
      }

      case "reset": {
        state = engine.createGame(); // restart in PLACEMENT
        chatManager.reset();
        process.stdout.write(respond(id, {}) + "\n");
        break;
      }

      // ── Chat methods ──

      case "chat_getChannels": {
        process.stdout.write(respond(id, {
          channels: chatManager.getPlayerChannels(params.playerId)
        }) + "\n");
        break;
      }

      case "chat_getMessages": {
        process.stdout.write(respond(id, {
          messages: chatManager.getMessagesSince(params.channelId, params.since || 0)
        }) + "\n");
        break;
      }

      case "chat_sendMessage": {
        const msg = chatManager.sendMessage(
          params.channelId, params.senderId, params.senderName, params.content
        );
        process.stdout.write(respond(id, { message: msg }) + "\n");
        break;
      }

      case "chat_createGroup": {
        const ch = chatManager.createGroup(params.name, params.createdBy, params.memberIds);
        process.stdout.write(respond(id, { channel: ch }) + "\n");
        break;
      }

      case "quit": {
        process.stdout.write(respond(id, {}) + "\n");
        process.exit(0);
      }

      default: {
        process.stdout.write(fail(id, `Unknown method: ${method}`) + "\n");
      }
    }
  } catch (e: any) {
    process.stdout.write(fail(id, e.message || String(e)) + "\n");
  }
});
