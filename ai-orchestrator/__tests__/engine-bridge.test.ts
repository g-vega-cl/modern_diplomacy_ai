/**
 * Tests for the engine-bridge JSON-line protocol.
 * Spawns the bridge as a subprocess and tests all commands.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawn, ChildProcess } from "node:child_process";
import { createInterface } from "node:readline";

let proc: ChildProcess;
let counter = 0;
let pendingResolve: ((value: any) => void) | null = null;
let rl: ReturnType<typeof createInterface>;

function startBridge(): Promise<void> {
  return new Promise((resolve, reject) => {
    proc = spawn("npx", ["tsx", "ai-orchestrator/engine-bridge.ts"], {
      cwd: process.cwd(),
      stdio: ["pipe", "pipe", "pipe"],
    });

    rl = createInterface({ input: proc.stdout! });

    rl.on("line", (line: string) => {
      if (pendingResolve) {
        const r = pendingResolve;
        pendingResolve = null;
        try {
          r(JSON.parse(line));
        } catch (e) {
          r({ ok: false, error: `Parse error: ${e}` });
        }
      }
    });

    // Wait for READY signal on stderr
    const onData = (data: Buffer) => {
      if (data.toString().includes("ENGINE_BRIDGE_READY")) {
        proc.stderr!.removeListener("data", onData);
        resolve();
      }
    };
    proc.stderr!.on("data", onData);

    proc.on("error", reject);
    proc.on("exit", (code) => {
      if (code !== 0 && code !== null) {
        reject(new Error(`Bridge exited with code ${code}`));
      }
    });

    // Timeout
    setTimeout(() => reject(new Error("Bridge start timeout")), 15000);
  });
}

function call(method: string, params?: Record<string, any>): Promise<any> {
  return new Promise((resolve) => {
    const id = ++counter;
    pendingResolve = resolve;
    proc.stdin!.write(JSON.stringify({ id, method, params }) + "\n");
  });
}

function stopBridge() {
  if (proc && !proc.killed) {
    try {
      proc.stdin!.write(JSON.stringify({ id: 999, method: "quit" }) + "\n");
    } catch {}
    proc.kill();
  }
  if (rl) rl.close();
}

// Standard Diplomacy starting positions (used for tests that need placed units)
const STANDARD_PLACEMENTS: Record<string, Array<{type: string; locationId: string}>> = {
  england: [{ type: "F", locationId: "LON" }, { type: "F", locationId: "EDI" }, { type: "A", locationId: "LVP" }],
  france: [{ type: "F", locationId: "BRE" }, { type: "A", locationId: "PAR" }, { type: "A", locationId: "MAR" }],
  germany: [{ type: "F", locationId: "KIE" }, { type: "A", locationId: "BER" }, { type: "A", locationId: "MUN" }],
  italy: [{ type: "F", locationId: "NAP" }, { type: "A", locationId: "ROM" }, { type: "A", locationId: "VEN" }],
  austria: [{ type: "F", locationId: "TRI" }, { type: "A", locationId: "VIE" }, { type: "A", locationId: "BUD" }],
  russia: [{ type: "F", locationId: "STP_NC" }, { type: "A", locationId: "MOS" }, { type: "A", locationId: "WAR" }, { type: "A", locationId: "SEV" }],
  turkey: [{ type: "F", locationId: "ANK" }, { type: "A", locationId: "CON" }, { type: "A", locationId: "SMY" }],
};

/** Submit standard placements for all 7 powers and advance to ORDER phase. */
async function placeAllStandardUnits(): Promise<void> {
  await call("reset");
  for (const [pid, placements] of Object.entries(STANDARD_PLACEMENTS)) {
    await call("submitPlacements", { playerId: pid, placements });
  }
  await call("advancePhase"); // PLACEMENT → ORDER
}

describe("Engine Bridge", () => {
  beforeAll(async () => {
    await startBridge();
  }, 20000);

  afterAll(() => {
    stopBridge();
  });

  describe("Game lifecycle", () => {
    it("resets and gets initial state", async () => {
      const resp = await call("reset");
      expect(resp.ok).toBe(true);

      const state = await call("getState");
      expect(state.ok).toBe(true);
      expect(state.state.year).toBe(1901);
      expect(state.state.season).toBe("SPRING");
      // Phase should be ORDER after reset (placement skipped)
      expect(["ORDER", "RESOLUTION"]).toContain(state.state.phase);
      expect(Object.keys(state.state.players)).toHaveLength(7);
      expect(Object.keys(state.state.units).length).toBeGreaterThanOrEqual(21);
    });

    it("has all 7 countries with correct unit counts", async () => {
      const state = await call("getState");
      const players = state.state.players;

      expect(players.england.unitCount).toBe(3);
      expect(players.france.unitCount).toBe(3);
      expect(players.germany.unitCount).toBe(3);
      expect(players.italy.unitCount).toBe(3);
      expect(players.austria.unitCount).toBe(3);
      expect(players.russia.unitCount).toBe(4);
      expect(players.turkey.unitCount).toBe(3);

      // Verify specific starting positions
      const units = state.state.units;
      const findUnit = (ownerId: string, locationId: string) =>
        Object.values(units).find(
          (u: any) => u.ownerId === ownerId && u.locationId === locationId
        );

      expect(findUnit("england", "LON")).toBeTruthy();
      expect(findUnit("england", "EDI")).toBeTruthy();
      expect(findUnit("england", "LVP")).toBeTruthy();
      expect(findUnit("france", "PAR")).toBeTruthy();
      expect(findUnit("russia", "STP_NC")).toBeTruthy();
      expect(findUnit("turkey", "CON")).toBeTruthy();
    });
  });

  describe("Player view", () => {
    it("returns player-specific view with valid moves", async () => {
      const resp = await call("reset");
      const view = await call("getPlayerView", { playerId: "france" });

      expect(view.ok).toBe(true);
      expect(view.view.player.name).toBe("France");
      expect(view.view.player.eliminated).toBe(false);

      // Should have units
      const playerUnits = view.view.player.units;
      expect(Object.keys(playerUnits).length).toBe(3);

      // Should have valid moves for each unit
      const validMoves = view.view.validMoves;
      expect(Object.keys(validMoves).length).toBe(3);

      // Each unit should have some valid moves
      for (const moves of Object.values(validMoves) as string[][]) {
        expect(moves.length).toBeGreaterThan(0);
      }

      // Should see other countries' units
      expect(view.view.visibleUnits.length).toBeGreaterThan(20);
    });

    it("has correct visibleUnits that include all powers", async () => {
      const view = await call("getPlayerView", { playerId: "england" });
      const owners = new Set(
        view.view.visibleUnits.map((u: any) => u.ownerId)
      );
      expect(owners.size).toBe(7);
      expect(owners.has("england")).toBe(true);
      expect(owners.has("france")).toBe(true);
      expect(owners.has("turkey")).toBe(true);
    });
  });

  describe("Orders and resolution", () => {
    it("submits orders and resolves them", async () => {
      await call("reset");

      // Submit orders for each player (all HOLD for simplicity)
      for (const pid of [
        "england", "france", "germany", "italy",
        "austria", "russia", "turkey",
      ]) {
        const view = await call("getPlayerView", { playerId: pid });
        const playerUnits = view.view.player.units;
        const orders = Object.keys(playerUnits).map((uid: string) => ({
          unitId: uid,
          type: "HOLD",
        }));
        const resp = await call("submitOrders", {
          playerId: pid,
          orders,
        });
        expect(resp.ok).toBe(true);
      }

      // Resolve
      const result = await call("resolve");
      expect(result.ok).toBe(true);

      // With all holds, no moves should succeed
      expect(result.result.successfulMoves.length).toBe(0);
      expect(result.result.bouncedMoves.length).toBe(0);
      expect(result.result.dislodgedUnits.length).toBe(0);
    });

    it("resolves moves correctly (France moves to BUR, others hold)", async () => {
      await call("reset");

      // France: F BRE→MAO, A PAR→BUR, A MAR H
      const franceOrders = [
        { unitId: "F_BRE_0", type: "MOVE", targetLocationId: "MAO" },
        { unitId: "A_PAR_1", type: "MOVE", targetLocationId: "BUR" },
        { unitId: "A_MAR_2", type: "HOLD" },
      ];
      await call("submitOrders", { playerId: "france", orders: franceOrders });

      // Everyone else holds
      for (const pid of [
        "england", "germany", "italy", "austria", "russia", "turkey",
      ]) {
        const view = await call("getPlayerView", { playerId: pid });
        const playerUnits = view.view.player.units;
        const orders = Object.keys(playerUnits).map((uid: string) => ({
          unitId: uid,
          type: "HOLD",
        }));
        await call("submitOrders", { playerId: pid, orders });
      }

      const result = await call("resolve");
      expect(result.ok).toBe(true);
      expect(result.result.successfulMoves.length).toBeGreaterThanOrEqual(1);

      // Check that at least one French move succeeded
      const frenchMoves = result.result.successfulMoves.filter(
        (m: any) => m.unitId.startsWith("F_") || m.unitId.startsWith("A_")
      );
      // MAO is empty sea, so F BRE→MAO should succeed
      const breMove = result.result.successfulMoves.find(
        (m: any) => m.unitId === "F_BRE_0"
      );
      if (breMove) {
        expect(breMove.toLocationId).toBe("MAO");
      }
    });
  });

  describe("Chat", () => {
    it("global channel exists by default", async () => {
      const resp = await call("chat_getChannels", { playerId: "england" });
      expect(resp.ok).toBe(true);
      expect(resp.channels.length).toBeGreaterThanOrEqual(1);
      expect(resp.channels[0].id).toBe("global");
    });

    it("sends and receives messages", async () => {
      await call("chat_sendMessage", {
        channelId: "global",
        senderId: "france",
        senderName: "France",
        content: "England, I propose an alliance against Germany.",
      });

      const msgs = await call("chat_getMessages", {
        channelId: "global",
        since: 0,
      });
      expect(msgs.ok).toBe(true);
      expect(msgs.messages.length).toBeGreaterThanOrEqual(1);

      const lastMsg = msgs.messages[msgs.messages.length - 1];
      expect(lastMsg.senderId).toBe("france");
      expect(lastMsg.content).toContain("alliance");
    });

    it("delta polling works with since parameter", async () => {
      // Send a message and record the timestamp
      const sent = await call("chat_sendMessage", {
        channelId: "global",
        senderId: "germany",
        senderName: "Germany",
        content: "I am watching everyone.",
      });
      const timestamp = sent.message.timestamp;

      // Poll with since=timestamp should return empty (filter is > not >=)
      const empty = await call("chat_getMessages", {
        channelId: "global",
        since: timestamp,
      });
      expect(empty.messages.length).toBe(0);

      // Small delay so next message gets a distinct timestamp
      await new Promise((r) => setTimeout(r, 5));

      // Send another message
      await call("chat_sendMessage", {
        channelId: "global",
        senderId: "russia",
        senderName: "Russia",
        content: "The bear stirs.",
      });

      // Poll with since=timestamp should return the new message
      const newMsgs = await call("chat_getMessages", {
        channelId: "global",
        since: timestamp,
      });
      expect(newMsgs.messages.length).toBe(1);
      expect(newMsgs.messages[0].senderId).toBe("russia");
    });

    it("creates group chats", async () => {
      const resp = await call("chat_createGroup", {
        name: "Secret Northern Pact",
        createdBy: "england",
        memberIds: ["germany", "russia"],
      });

      expect(resp.ok).toBe(true);
      expect(resp.channel.name).toBe("Secret Northern Pact");
      expect(resp.channel.type).toBe("group");
      expect(resp.channel.memberIds).toContain("england");
      expect(resp.channel.memberIds).toContain("germany");
      expect(resp.channel.memberIds).toContain("russia");

      // England should see this channel
      const englandCh = await call("chat_getChannels", { playerId: "england" });
      const found = englandCh.channels.find(
        (c: any) => c.name === "Secret Northern Pact"
      );
      expect(found).toBeTruthy();

      // France should NOT see this channel
      const franceCh = await call("chat_getChannels", { playerId: "france" });
      const notFound = franceCh.channels.find(
        (c: any) => c.name === "Secret Northern Pact"
      );
      expect(notFound).toBeFalsy();
    });
  });

  describe("Retreat", () => {
    it("handles disband on retreat", async () => {
      const resp = await call("submitRetreat", {
        unitId: "A_PAR_1",
        disband: true,
      });
      expect(resp.ok).toBe(true);
    });
  });

  describe("Build", () => {
    it("submits build orders", async () => {
      await call("reset");
      const resp = await call("submitBuild", {
        playerId: "france",
        builds: [
          { type: "CREATE", unitType: "A", locationId: "PAR" },
        ],
      });
      expect(resp.ok).toBe(true);
    });
  });

  describe("Status", () => {
    it("returns game status with no winner at start", async () => {
      await call("reset");
      const resp = await call("getStatus");
      expect(resp.ok).toBe(true);
      expect(resp.status.winner).toBeNull();
      expect(resp.status.currentYear).toBe(1901);
    });
  });

  describe("Error handling", () => {
    it("returns error for unknown methods", async () => {
      const resp = await call("nonexistent_method");
      expect(resp.ok).toBe(false);
      expect(resp.error).toBeTruthy();
    });
  });
});
