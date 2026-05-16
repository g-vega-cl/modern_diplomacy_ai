#!/usr/bin/env node
/**
 * Diplomacy Engine Bridge — JSON-line protocol subprocess.
 * 
 * Reads JSON commands from stdin, calls the DiplomacyEngine, writes JSON responses to stdout.
 * 
 * Protocol:
 *   → {"method": "createGame"}
 *   ← {"ok": true, "state": {...}}
 *   
 *   → {"method": "getState"}
 *   ← {"ok": true, "state": {...}}
 *   
 *   → {"method": "getPlayerView", "params": {"playerId": "england"}}
 *   ← {"ok": true, "view": {...}}
 *   
 *   → {"method": "submitOrders", "params": {"playerId": "england", "orders": [...]}}
 *   ← {"ok": true}
 *   
 *   → {"method": "resolve"}
 *   ← {"ok": true, "result": {...}}
 *   
 *   → {"method": "submitRetreat", "params": {"unitId": "...", "locationId": "..."}}
 *   ← {"ok": true}
 *   
 *   → {"method": "submitBuild", "params": {"playerId": "...", "builds": [...]}}
 *   ← {"ok": true}
 *   
 *   → {"method": "getStatus"}
 *   ← {"ok": true, "status": {...}}
 *   
 *   → {"method": "reset"}
 *   ← {"ok": true}
 */

const readline = require("readline");
const { DiplomacyEngine } = require("../src/features/engine/engine");
const { GameStateMachine } = require("../src/features/engine/state-machine");
const { VictoryChecker } = require("../src/features/engine/victory");
const { Phase } = require("../src/features/engine/types");
const { PLAYERS, STARTING_UNITS } = require("../src/features/engine/config");

// Load chat manager for negotiation
let chatManager;
try {
  chatManager = require("../src/features/negotiation/chat-manager").chatManager;
} catch (e) {
  // Chat manager not available, create in-memory fallback
  chatManager = createFallbackChat();
}

function createFallbackChat() {
  const channels = new Map();
  const messages = new Map();
  channels.set("global", { id: "global", name: "Global Diplomacy", type: "global", memberIds: [] });
  messages.set("global", []);
  
  let msgCounter = 0;
  
  return {
    getPlayerChannels(playerId) {
      const result = [];
      for (const ch of channels.values()) {
        if (ch.type === "global" || ch.memberIds.includes(playerId)) {
          result.push(ch);
        }
      }
      return result;
    },
    getMessagesSince(channelId, since) {
      const msgs = messages.get(channelId) || [];
      return msgs.filter(m => m.timestamp > since);
    },
    sendMessage(channelId, senderId, senderName, content) {
      const msg = {
        id: `msg_${++msgCounter}`,
        senderId, senderName, content, channelId,
        timestamp: Date.now()
      };
      let arr = messages.get(channelId);
      if (!arr) { arr = []; messages.set(channelId, arr); }
      arr.push(msg);
      return msg;
    },
    createGroup(name, createdBy, memberIds) {
      const id = `group_${Date.now()}`;
      const ch = { id, name, type: "group", memberIds: [createdBy, ...memberIds], createdBy };
      channels.set(id, ch);
      messages.set(id, []);
      return ch;
    },
    reset() {
      channels.clear();
      messages.clear();
    }
  };
}

const engine = new DiplomacyEngine();

// Create game with default starting positions
const defaultPlacements = {};
for (const playerId of PLAYERS) {
  const units = STARTING_UNITS[playerId];
  if (units) {
    defaultPlacements[playerId] = units.map(u => ({
      type: u.type,
      locationId: u.locationId,
    }));
  }
}

let state = engine.createGame(defaultPlacements);
state = GameStateMachine.advancePhase(state); // skip placement → ORDER

function serializeState(s) {
  const players = {};
  for (const [id, p] of s.players) {
    players[id] = {
      id: p.id,
      name: p.name,
      supplyCenterCount: p.supplyCenterCount,
      unitCount: p.units.size,
      eliminated: p.eliminated,
    };
  }
  const units = {};
  for (const [id, u] of s.units) {
    units[id] = {
      id: u.id,
      type: u.type,
      ownerId: u.ownerId,
      locationId: u.locationId,
      mustRetreat: u.mustRetreat,
    };
  }
  return {
    year: s.year,
    season: s.season,
    phase: s.phase,
    players,
    units,
    retreatsNeeded: s.retreatsNeeded,
  };
}

function fail(id, error) {
  return JSON.stringify({ id, ok: false, error: error.message || String(error) });
}

function respond(id, data) {
  return JSON.stringify({ id, ok: true, ...data });
}

// Main loop
const rl = readline.createInterface({ input: process.stdin });

rl.on("line", (line) => {
  let req;
  try {
    req = JSON.parse(line.trim());
  } catch (e) {
    process.stdout.write(fail(0, "Invalid JSON") + "\n");
    return;
  }

  const { id, method, params } = req;
  
  try {
    switch (method) {
      case "createGame": {
        state = engine.createGame(defaultPlacements);
        state = GameStateMachine.advancePhase(state);
        process.stdout.write(respond(id, { state: serializeState(state) }) + "\n");
        break;
      }
      
      case "getState": {
        process.stdout.write(respond(id, { state: serializeState(state) }) + "\n");
        break;
      }
      
      case "getPlayerView": {
        const view = engine.getPlayerView(state, params.playerId);
        const serialized = {
          player: {
            id: view.player.id,
            name: view.player.name,
            supplyCenterCount: view.player.supplyCenterCount,
            unitCount: view.player.units.size,
            eliminated: view.player.eliminated,
          },
          visibleUnits: view.visibleUnits.map(u => ({
            id: u.id, type: u.type, ownerId: u.ownerId, locationId: u.locationId, mustRetreat: u.mustRetreat,
          })),
          validMoves: {},
          validBuilds: view.validBuilds,
        };
        for (const [uid, moves] of view.validMoves) {
          serialized.validMoves[uid] = moves;
        }
        // Also include player units
        serialized.player.units = {};
        if (view.player.units) {
          for (const [uid, u] of view.player.units) {
            serialized.player.units[uid] = { id: u.id, type: u.type, locationId: u.locationId };
          }
        }
        process.stdout.write(respond(id, { view: serialized }) + "\n");
        break;
      }
      
      case "submitOrders": {
        state = engine.submitOrders(state, params.playerId, params.orders);
        process.stdout.write(respond(id, {}) + "\n");
        break;
      }
      
      case "resolve": {
        const { result, state: postSupply } = engine.resolvePhase(state);
        
        // Apply moves
        let nextState = { ...postSupply };
        const nextUnits = new Map(nextState.units);
        for (const move of result.successfulMoves) {
          const unit = nextUnits.get(move.unitId);
          if (unit) nextUnits.set(move.unitId, { ...unit, locationId: move.toLocationId });
        }
        
        const retreatsNeeded = [];
        for (const d of result.dislodgedUnits) {
          const unit = nextUnits.get(d.unitId);
          if (unit) {
            nextUnits.set(d.unitId, { ...unit, mustRetreat: true });
            retreatsNeeded.push(d.unitId);
          }
        }
        nextState = { ...nextState, units: nextUnits, retreatsNeeded };
        
        const winner = VictoryChecker.checkVictory(nextState.players);
        state = GameStateMachine.advancePhase(nextState);
        
        process.stdout.write(respond(id, {
          result: {
            successfulMoves: result.successfulMoves,
            bouncedMoves: result.bouncedMoves,
            dislodgedUnits: result.dislodgedUnits,
            destroyedUnits: result.destroyedUnits,
            combatLog: result.combatLog,
          },
          winner: winner ? { id: winner.id, name: winner.name } : null,
          nextPhase: state.phase,
        }) + "\n");
        break;
      }
      
      case "submitRetreat": {
        if (params.disband || !params.locationId) {
          // Remove unit
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
            ...state, 
            units: nextUnits, 
            players: nextPlayers,
            retreatsNeeded: state.retreatsNeeded.filter(id => id !== params.unitId),
          };
        } else {
          state = engine.submitRetreat(state, params.unitId, params.locationId);
        }
        
        // Auto-advance if all retreats done
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
      
      case "reset": {
        state = engine.createGame(defaultPlacements);
        state = GameStateMachine.advancePhase(state);
        chatManager.reset();
        process.stdout.write(respond(id, {}) + "\n");
        break;
      }
      
      // Chat methods
      case "chat_getChannels": {
        const channels = chatManager.getPlayerChannels(params.playerId);
        process.stdout.write(respond(id, { channels }) + "\n");
        break;
      }
      
      case "chat_getMessages": {
        const msgs = chatManager.getMessagesSince(params.channelId, params.since || 0);
        process.stdout.write(respond(id, { messages: msgs }) + "\n");
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
        const channel = chatManager.createGroup(params.name, params.createdBy, params.memberIds);
        process.stdout.write(respond(id, { channel }) + "\n");
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
  } catch (e) {
    process.stdout.write(fail(id, e) + "\n");
  }
});

process.stderr.write("ENGINE_BRIDGE_READY\n");
