import { GameState, Player, Unit, ResolutionResult } from "../engine/types";

const SEP = "═".repeat(56);
const BAR = "─".repeat(56);

export function showHeader(state: GameState): void {
  console.log("\n" + SEP);
  console.log(`  DIPLOMACY — ${state.season} ${state.year}, ${phaseLabel(state.phase)} Phase`);
  console.log(SEP);
}

function phaseLabel(p: string): string {
  const labels: Record<string, string> = {
    ORDER: "ORDER",
    RESOLUTION: "RESOLUTION",
    RETREAT: "RETREAT",
    BUILD: "BUILD",
  };
  return labels[p] || p;
}

export function showSupplyCenters(state: GameState): void {
  const lines: string[] = [];
  let i = 0;
  for (const player of state.players.values()) {
    const scs = [...state.provinces.values()]
      .filter(p => p.isSupplyCenter && !isOwned(p.id, state, player.id));
    const owned = player.supplyCenterCount;
    const home = getHomeSCs(player.id);
    const label = `${pad(player.id, 9)} ${String(owned).padStart(2)} SCs (${owned - home.length >= 0 ? "+" : ""}${owned - home.length})`;
    lines.push(label);
  }
  console.log("  SUPPLY CENTERS");
  for (const line of lines) {
    console.log("    " + line);
  }
  console.log(BAR);
}

function isOwned(provinceId: string, state: GameState, playerId: string): boolean {
  for (const u of state.units.values()) {
    if (u.locationId === provinceId && u.ownerId === playerId) return true;
  }
  return false;
}

function getHomeSCs(playerId: string): string[] {
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

export function showUnits(state: GameState): void {
  console.log("  UNITS");
  for (const player of state.players.values()) {
    const parts: string[] = [];
    for (const unit of player.units.values()) {
      const typeLabel = unit.type === "A" ? "A" : "F";
      const loc = unit.locationId.replace("_", " ");
      parts.push(`${typeLabel} ${loc}`);
    }
    if (parts.length > 0) {
      console.log(`    ${pad(player.id, 9)} ${parts.join("  ")}`);
    } else {
      console.log(`    ${pad(player.id, 9)} (eliminated)`);
    }
  }
  console.log(BAR);
}

export function showPlayerOrdersPrompt(
  player: Player,
  state: GameState,
  orderCount: number,
): void {
  console.log(`  ▶ ${capitalize(player.id)}'s turn (${player.units.size} units, ${orderCount} orders entered)`);
  console.log();
  for (const unit of player.units.values()) {
    const typeLabel = unit.type === "A" ? "A" : "F";
    const loc = unit.locationId.replace("_", " ");
    const provName = state.provinces.get(unit.locationId)?.name || unit.locationId;
    const valid = getValidMovesDisplay(unit, state);
    console.log(`    ${typeLabel} ${loc}  (${provName})  →  ${valid}`);
  }
  console.log();
  console.log("  Enter order (e.g. \"A PAR -> BUR\") or \"done\":");
  console.log();
}

function getValidMovesDisplay(unit: Unit, state: GameState): string {
  const from = state.provinces.get(unit.locationId);
  if (!from) return "—";
  const moves: string[] = [];
  for (const nId of from.neighbors) {
    const n = state.provinces.get(nId);
    if (!n) continue;
    if (unit.type === "F" as any && n.type === "LAND" as any && !n.landConnection) continue;
    if (unit.type === "F" as any && n.type === ("COAST" as any) && ["SPA", "STP", "BUL"].includes(nId)) continue;
    const name = n.name.length > 15 ? n.name.slice(0, 15) + "…" : n.name;
    moves.push(`${nId} (${name})`);
  }
  return moves.length > 0 ? moves.join(", ") : "—";
}

export function showResolutionResult(result: ResolutionResult): void {
  console.log(SEP);
  console.log("  RESOLUTION");
  console.log(SEP);

  if (result.successfulMoves.length > 0) {
    console.log("  Successful moves:");
    for (const m of result.successfulMoves) {
      console.log(`    ${m.unitId}  ${m.fromLocationId} → ${m.toLocationId}`);
    }
  }
  if (result.bouncedMoves.length > 0) {
    console.log("  Bounced:");
    for (const m of result.bouncedMoves) {
      console.log(`    ${m.unitId}  bounced at ${m.attemptedLocationId}`);
    }
  }
  if (result.dislodgedUnits.length > 0) {
    console.log("  Dislodged:");
    for (const d of result.dislodgedUnits) {
      console.log(`    ${d.unitId}  forced out of ${d.fromLocationId} by ${d.dislodgedByUnitId}`);
    }
  }
  if (result.destroyedUnits.length > 0) {
    console.log("  Destroyed:");
    for (const d of result.destroyedUnits) {
      console.log(`    ${d}  destroyed`);
    }
  }
  console.log(BAR);
}

export function showHelp(): void {
  console.log(SEP);
  console.log("  COMMANDS");
  console.log(SEP);
  console.log("    A PAR -> BUR         Move army in Paris to Burgundy");
  console.log("    F ENG -> NTH         Move fleet in English Channel to North Sea");
  console.log("    A PAR H              Hold army in Paris");
  console.log("    A MAR S A PAR -> BUR  Support army in Paris to move to Burgundy");
  console.log("    A MAR S A PAR         Support army in Paris to hold");
  console.log("    done                 Finish entering orders");
  console.log("    help                 Show this help");
  console.log("    quit                 Quit the game");
  console.log(BAR);
}

export function showRetreatPrompt(player: Player, dislodgedUnitId: string, retreatOptions: string[]): void {
  console.log(`  ▶ ${capitalize(player.id)} — retreat for ${dislodgedUnitId}`);
  console.log(`  Options: ${retreatOptions.join(", ") || "none (will be destroyed)"}`);
  console.log('  Enter destination or "disband":');
  console.log();
}

export function showBuildPrompt(player: Player, buildDelta: number, openHomeSCs: string[]): void {
  const action = buildDelta > 0 ? "build" : "disband";
  const absDelta = Math.abs(buildDelta);
  console.log(`  ▶ ${capitalize(player.id)} — must ${action} ${absDelta} unit(s)`);
  if (buildDelta > 0) {
    console.log(`  Open home centers: ${openHomeSCs.join(", ")}`);
    console.log(`  Enter: "A {home}" to build army or "F {home}" to build fleet`);
  } else {
    console.log(`  Units exceeding SC count. Enter: "{province}" to disband unit there`);
  }
  console.log('  Or enter "done":');
  console.log();
}

export function showVictory(player: Player): void {
  console.log(SEP);
  console.log(`  🏆 ${capitalize(player.id)} WINS THE GAME!`);
  console.log(`  Controls ${player.supplyCenterCount} supply centers`);
  console.log(SEP);
}

export function showMessage(msg: string): void {
  console.log("  " + msg);
}

function pad(s: string, n: number): string {
  return s.length >= n ? s : s + " ".repeat(n - s.length);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
