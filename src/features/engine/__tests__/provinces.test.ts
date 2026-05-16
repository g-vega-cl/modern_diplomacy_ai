import { describe, it, expect } from "vitest";
import { createProvinces } from "../provinces";
import { ProvinceType } from "../types";

describe("createProvinces", () => {
  const provinces = createProvinces();

  it("contains 56 land parent entries + 19 sea entries + 6 coastal sub-entries = 81 entries", () => {
    expect(provinces.size).toBe(81);
  });

  it("contains exactly 34 supply centers", () => {
    const scs = [...provinces.values()].filter(p => p.isSupplyCenter);
    expect(scs.length).toBe(34);
  });

  it("contains exactly 19 sea provinces", () => {
    const seas = [...provinces.values()].filter(p => p.type === ProvinceType.SEA);
    expect(seas.length).toBe(19);
  });

  it("has bidirectional neighbor relationships", () => {
    for (const p of provinces.values()) {
      for (const nId of p.neighbors) {
        const neighbor = provinces.get(nId);
        expect(neighbor).toBeDefined();
        expect(neighbor!.neighbors).toContain(p.id);
      }
    }
  });

  it("marks the 6 coast sub-provinces with coastOf", () => {
    const coastSubs = ["SPA_NC", "SPA_SC", "STP_NC", "STP_SC", "BUL_EC", "BUL_SC"];
    for (const id of coastSubs) {
      const p = provinces.get(id);
      expect(p, `${id} should exist`).toBeDefined();
      expect(p!.coastOf).toBe(id.replace(/_.*$/, ""));
    }
  });

  it("sets landConnection on CON", () => {
    const con = provinces.get("CON");
    expect(con).toBeDefined();
    expect(con!.landConnection).toBe(true);
  });

  it("sets PAR neighbors correctly", () => {
    const par = provinces.get("PAR")!;
    expect(par.neighbors).toContain("BUR");
    expect(par.neighbors).toContain("BRE");
    expect(par.neighbors).toContain("PIC");
    expect(par.neighbors).toContain("GAS");
  });

  it("sets ENG neighbors correctly", () => {
    const eng = provinces.get("ENG")!;
    expect(eng.neighbors).toContain("LON");
    expect(eng.neighbors).toContain("WAL");
    expect(eng.neighbors).toContain("PIC");
    expect(eng.neighbors).toContain("MAO");
    expect(eng.neighbors).toContain("IRI");
    expect(eng.neighbors).toContain("NTH");
  });

  it("BUL_EC borders BLA and RUM but BUL_SC does not", () => {
    const bul_ec = provinces.get("BUL_EC")!;
    const bul_sc = provinces.get("BUL_SC")!;
    expect(bul_ec.neighbors).toContain("BLA");
    expect(bul_ec.neighbors).toContain("RUM");
    expect(bul_sc.neighbors).not.toContain("BLA");
    expect(bul_sc.neighbors).not.toContain("RUM");
  });

  it("SPA_NC borders GOL, MAO, GAS; SPA_SC borders WES, MAO, POR", () => {
    const spa_nc = provinces.get("SPA_NC")!;
    const spa_sc = provinces.get("SPA_SC")!;
    expect(spa_nc.neighbors).toContain("GOL");
    expect(spa_nc.neighbors).toContain("MAO");
    expect(spa_nc.neighbors).toContain("GAS");
    expect(spa_sc.neighbors).toContain("WES");
    expect(spa_sc.neighbors).toContain("MAO");
    expect(spa_sc.neighbors).toContain("POR");
  });

  it("STP_NC borders BAR, FIN; STP_SC borders GOB, FIN, LVN", () => {
    const stp_nc = provinces.get("STP_NC")!;
    const stp_sc = provinces.get("STP_SC")!;
    expect(stp_nc.neighbors).toContain("BAR");
    expect(stp_nc.neighbors).toContain("FIN");
    expect(stp_nc.neighbors).not.toContain("NWG");
    expect(stp_sc.neighbors).toContain("GOB");
    expect(stp_sc.neighbors).toContain("FIN");
    expect(stp_sc.neighbors).toContain("LVN");
  });

  it("CON can be passed through by fleets (landConnection), neighbors include BLA and AEG", () => {
    const con = provinces.get("CON")!;
    expect(con.neighbors).toContain("BLA");
    expect(con.neighbors).toContain("AEG");
  });
});
