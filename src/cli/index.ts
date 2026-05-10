import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { DiplomacyEngine } from "../engine/engine";
import { GameStateMachine } from "../engine/state-machine";
import { VictoryChecker } from "../engine/victory";
import { Phase, Order, UnitType, Placement } from "../engine/types";
import { GAME_CONFIG, HOME_SCS } from "../engine/config";
import { parseOrder } from "./parser";
import {
  showHeader, showSupplyCenters, showUnits, showPlayerOrdersPrompt,
  showResolutionResult, showHelp, showRetreatPrompt, showBuildPrompt,
  showVictory, showMessage, showPlacementPrompt,
} from "./display";

class InputSource {
  private lines: string[] = [];
  private done = false;
  private resolvers: Array<(line: string) => void> = [];

  constructor(rl: readline.Interface) {
    (async () => {
      for await (const line of rl) {
        this.push(line);
      }
      this.done = true;
      this.flush();
    })();
  }

  private push(line: string) {
    this.lines.push(line);
    this.flush();
  }

  private flush() {
    while (this.resolvers.length > 0 && this.lines.length > 0) {
      const resolve = this.resolvers.shift()!;
      resolve(this.lines.shift()!);
    }
  }

  async next(): Promise<string> {
    if (this.lines.length > 0) return this.lines.shift()!;
    if (this.done) return "";
    return new Promise(resolve => this.resolvers.push(resolve));
  }
}

const rl = readline.createInterface({ input, output, terminal: false });
const inputSrc = new InputSource(rl);

async function ask(): Promise<string> {
  const line = await inputSrc.next();
  return line.trim();
}

const isTTY = process.stdout.isTTY;

function clearScreen(): void {
  if (isTTY) console.clear();
}

async function main() {
  clearScreen();
  const engine = new DiplomacyEngine();
  let state = engine.createGame();

  while (true) {
    clearScreen();
    showHeader(state);
    showSupplyCenters(state);
    showUnits(state);

    if (state.phase === Phase.ORDER) {
      const allOrders: Order[] = [];

      for (const player of state.players.values()) {
        if (player.eliminated) continue;

        let playerOrders: Order[] = [];

        while (true) {
          clearScreen();
          showHeader(state);
          showSupplyCenters(state);
          showUnits(state);
          showPlayerOrdersPrompt(player, state, playerOrders.length);

          const line = await ask();

          if (line.toLowerCase() === "done" || line.toLowerCase() === "d") break;
          if (line.toLowerCase() === "help" || line.toLowerCase() === "h") {
            showHelp();
            showMessage("  Press enter to continue...");
            continue;
          }
          if (line.toLowerCase() === "quit" || line.toLowerCase() === "q") {
            console.log("Goodbye!");
            process.exit(0);
          }
          if (!line) continue;

          const result = parseOrder(line, player.units);
          if (result.ok) {
            const existing = playerOrders.findIndex(o => o.unitId === result.order.unitId);
            if (existing >= 0) {
              playerOrders[existing] = result.order;
              showMessage(`Updated order for ${result.order.unitId}`);
            } else {
              playerOrders.push(result.order);
              showMessage(`Accepted: ${result.order.type} for ${result.order.unitId}`);
            }
          } else {
            showMessage(`Error: ${result.error}`);
          }
        }

        state = engine.submitOrders(state, player.id, playerOrders);
        allOrders.push(...playerOrders);
      }

      // Resolve
      const { result, state: resolvedState } = engine.resolvePhase(state);

      // Apply moves
      let nextState = { ...resolvedState };
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

      clearScreen();
      showHeader(state);
      showResolutionResult(result);

      const winner = VictoryChecker.checkVictory(nextState.players);
      if (winner) {
        showVictory(winner);
        break;
      }

      state = GameStateMachine.advancePhase(nextState);

    } else if (state.phase === Phase.RETREAT) {
      let nextState = { ...state };
      const nextUnits = new Map(nextState.units);

      for (const unitId of state.retreatsNeeded) {
        const unit = nextUnits.get(unitId);
        if (!unit) continue;
        const player = state.players.get(unit.ownerId);
        if (!player) continue;

        const retreatOptions = calculateRetreatOptions(unit, state);

        clearScreen();
        showRetreatPrompt(player, unitId, retreatOptions);

        while (true) {
          const line = await ask();
          if (line.toLowerCase() === "done" || line.toLowerCase() === "d") break;
          if (line.toLowerCase() === "disband" || line.toLowerCase() === "destroy") {
            nextUnits.delete(unitId);
            showMessage(`${unitId} disbanded`);
            break;
          }
          if (line.toLowerCase() === "quit") { console.log("Goodbye!"); process.exit(0); }
          if (!line) continue;

          const dest = line.toUpperCase();
          if (retreatOptions.includes(dest)) {
            nextUnits.set(unitId, { ...unit, locationId: dest, mustRetreat: false });
            showMessage(`${unitId} retreats to ${dest}`);
            break;
          } else {
            showMessage(`Invalid retreat. Options: ${retreatOptions.join(", ") || "none — type 'disband'"}`);
          }
        }
      }

      nextState = { ...nextState, units: nextUnits, retreatsNeeded: [] };
      state = GameStateMachine.advancePhase(nextState);

    } else if (state.phase === Phase.BUILD) {
      let nextState = { ...state };

      for (const player of state.players.values()) {
        if (player.eliminated) continue;

        const buildDelta = player.supplyCenterCount - player.units.size;
        if (buildDelta === 0) continue;

        const openHomeSCs = getPlayerHomeSCs(player.id).filter(sc => {
          for (const u of nextState.units.values()) {
            if (u.locationId === sc) return false;
          }
          return true;
        });

        clearScreen();
        showBuildPrompt(player, buildDelta, openHomeSCs);

        const nextUnits = new Map(nextState.units);
        let remaining = Math.abs(buildDelta);

        while (remaining > 0) {
          const line = await ask();
          if (line.toLowerCase() === "done" || line.toLowerCase() === "d") break;
          if (line.toLowerCase() === "quit") { console.log("Goodbye!"); process.exit(0); }
          if (!line) continue;

          if (buildDelta > 0) {
            const tokens = line.toUpperCase().split(/\s+/);
            if (tokens.length < 2 || (tokens[0] !== "A" && tokens[0] !== "F")) {
              showMessage(`Format: A {home} or F {home}, e.g. "A PAR"`);
              continue;
            }
            const type = tokens[0];
            const location = tokens[1];
            if (!openHomeSCs.includes(location)) {
              showMessage(`${location} not open. Options: ${openHomeSCs.join(", ")}`);
              continue;
            }
            const unitId = `${type}_${location}`;
            if (nextUnits.has(unitId)) {
              showMessage(`${unitId} already exists`);
              continue;
            }
            const unitType = type === "A" ? UnitType.ARMY : UnitType.FLEET;
            nextUnits.set(unitId, {
              id: unitId, type: unitType, ownerId: player.id,
              locationId: location, mustRetreat: false,
            });
            openHomeSCs.splice(openHomeSCs.indexOf(location), 1);
            remaining--;
            showMessage(`Built ${type} ${location}`);
          } else {
            const location = line.toUpperCase();
            const toDisband = [...nextUnits.values()].find(
              u => u.ownerId === player.id && u.locationId === location
            );
            if (!toDisband) {
              showMessage(`No unit at ${location}`);
              continue;
            }
            nextUnits.delete(toDisband.id);
            remaining--;
            showMessage(`Disbanded ${toDisband.id}`);
          }
        }

        // Force remaining disbands
        if (remaining > 0 && buildDelta < 0) {
          const toDisband = [...nextUnits.values()].filter(u => u.ownerId === player.id);
          for (let i = 0; i < remaining && i < toDisband.length; i++) {
            nextUnits.delete(toDisband[i].id);
          }
        }

        const playerUnits = new Map<string, any>();
        for (const u of nextUnits.values()) {
          if (u.ownerId === player.id) playerUnits.set(u.id, u);
        }
        const nextPlayers = new Map(nextState.players);
        nextPlayers.set(player.id, { ...player, units: playerUnits });
        nextState = { ...nextState, units: nextUnits, players: nextPlayers };
      }

      const winner = VictoryChecker.checkVictory(nextState.players);
      if (winner) {
        clearScreen();
        showHeader(nextState);
        showVictory(winner);
        break;
      }

      state = GameStateMachine.advancePhase(nextState);
    } else if (state.phase === Phase.PLACEMENT) {
      for (const player of state.players.values()) {
        const validPlacements = engine.getValidPlacements(state, player.id);
        if (validPlacements.length === 0) continue;

        let nextState = { ...state };
        const placements: Placement[] = [];
        const totalNeeded = HOME_SCS[player.id]?.length || GAME_CONFIG.INITIAL_UNITS_PER_PLAYER;
        const needed = totalNeeded - player.units.size;

        while (placements.length < needed) {
          clearScreen();
          showHeader(nextState);
          showUnits(nextState);
          showPlacementPrompt(player, validPlacements, placements.length, totalNeeded);

          const line = await ask();
          if (line.toLowerCase() === "quit" || line.toLowerCase() === "q") {
            console.log("Goodbye!");
            process.exit(0);
          }
          if (!line) continue;

          const tokens = line.toUpperCase().split(/\s+/);
          if (tokens.length < 2 || (tokens[0] !== "A" && tokens[0] !== "F")) {
            showMessage(`Format: A {home} or F {home}, e.g. "A PAR"`);
            continue;
          }
          const t = tokens[0] === "A" ? UnitType.ARMY : UnitType.FLEET;
          const locId = tokens[1];

          const valid = validPlacements.some(
            p => p.type === t && p.locationId === locId && !placements.some(q => q.locationId === locId)
          );
          if (!valid) {
            showMessage(`Invalid or duplicate placement. Check the options above.`);
            continue;
          }

          placements.push({ type: t, locationId: locId });
          showMessage(`Placed ${tokens[0]} in ${locId}`);
          await ask(); // pause to let player read
        }

        state = engine.submitPlacements(nextState, player.id, placements);
        if (engine.isPlacementComplete(state)) break;
      }

      if (engine.isPlacementComplete(state)) {
        state = GameStateMachine.advancePhase(state);
      }
    } else {
      state = GameStateMachine.advancePhase(state);
    }
  }

  rl.close();
}

function calculateRetreatOptions(
  unit: { locationId: string; type: string },
  state: { provinces: ReadonlyMap<string, any>; units: ReadonlyMap<string, any> },
): string[] {
  const from = state.provinces.get(unit.locationId);
  if (!from) return [];
  const options: string[] = [];
  for (const nId of from.neighbors) {
    const n = state.provinces.get(nId);
    if (!n) continue;
    if (unit.type === "F" && n.type === "LAND" && !n.landConnection) continue;
    if (unit.type === "F" && n.type === "COAST" && ["SPA", "STP", "BUL"].includes(nId)) continue;
    const occupied = [...state.units.values()].some((u: any) => u.locationId === nId);
    if (occupied) continue;
    options.push(nId);
  }
  return options;
}

function getPlayerHomeSCs(playerId: string): string[] {
  const map: Record<string, string[]> = {
    england: ["EDI", "LON", "LVP"],
    france: ["BRE", "MAR", "PAR"],
    germany: ["BER", "KIE", "MUN"],
    italy: ["NAP", "ROM", "VEN"],
    austria: ["VIE", "TRI", "BUD"],
    russia: ["MOS", "SEV", "STP", "WAR"],
    turkey: ["ANK", "CON", "SMY"],
  };
  return map[playerId] || [];
}

main().catch(e => { console.error(e); process.exit(1); });
