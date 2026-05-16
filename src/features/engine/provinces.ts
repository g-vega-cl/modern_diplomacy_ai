import { Province, ProvinceType } from "./types";

function def(
  id: string,
  name: string,
  type: ProvinceType,
  sc: boolean,
  neighbors: string[],
  coastOf?: string,
  landConnection?: boolean,
): Province {
  return { id, name, type, isSupplyCenter: sc, neighbors, coastOf, landConnection: landConnection ?? false };
}

const L = ProvinceType.LAND;
const S = ProvinceType.SEA;
const C = ProvinceType.COAST;

export function createProvinces(): ReadonlyMap<string, Province> {
  const m = new Map<string, Province>();

  // ── 19 Seas ──
  m.set("ADR", def("ADR", "Adriatic Sea", S, false, ["VEN", "TRI", "APU", "ION", "ALB"]));
  m.set("AEG", def("AEG", "Aegean Sea", S, false, ["GRE", "BUL_SC", "CON", "SMY", "EAS", "ION"]));
  m.set("BAL", def("BAL", "Baltic Sea", S, false, ["KIE", "DEN", "SWE", "GOB", "LVN", "PRU", "BER"]));
  m.set("BAR", def("BAR", "Barents Sea", S, false, ["STP_NC", "NWG", "NWY"]));
  m.set("BLA", def("BLA", "Black Sea", S, false, ["SEV", "RUM", "BUL_EC", "CON", "ANK", "ARM"]));
  m.set("EAS", def("EAS", "Eastern Mediterranean", S, false, ["SMY", "SYR", "ION", "AEG"]));
  m.set("ENG", def("ENG", "English Channel", S, false, ["LON", "WAL", "PIC", "BRE", "BEL", "MAO", "IRI", "NTH"]));
  m.set("GOB", def("GOB", "Gulf of Bothnia", S, false, ["SWE", "FIN", "STP_SC", "LVN", "BAL"]));
  m.set("GOL", def("GOL", "Gulf of Lyon", S, false, ["SPA_NC", "MAR", "PIE", "TUS", "TYS", "WES"]));
  m.set("HEL", def("HEL", "Heligoland Bight", S, false, ["KIE", "DEN", "NTH", "HOL"]));
  m.set("ION", def("ION", "Ionian Sea", S, false, ["TUN", "TYS", "NAP", "APU", "ADR", "ALB", "GRE", "AEG", "EAS"]));
  m.set("IRI", def("IRI", "Irish Sea", S, false, ["LVP", "WAL", "ENG", "MAO", "NAO"]));
  m.set("MAO", def("MAO", "Mid-Atlantic Ocean", S, false, ["IRI", "ENG", "BRE", "GAS", "SPA_NC", "SPA_SC", "POR", "NAO", "WES"]));
  m.set("NAO", def("NAO", "North Atlantic Ocean", S, false, ["CLY", "IRI", "MAO", "NWG"]));
  m.set("NTH", def("NTH", "North Sea", S, false, ["EDI", "YOR", "LON", "ENG", "BEL", "HOL", "HEL", "DEN", "NWG", "SKA", "NWY"]));
  m.set("NWG", def("NWG", "Norwegian Sea", S, false, ["CLY", "EDI", "NTH", "NWY", "BAR", "NAO"]));
  m.set("SKA", def("SKA", "Skagerrak", S, false, ["NWY", "SWE", "DEN", "NTH"]));
  m.set("TYS", def("TYS", "Tyrrhenian Sea", S, false, ["TUS", "ROM", "NAP", "ION", "WES", "GOL", "TUN"]));
  m.set("WES", def("WES", "Western Mediterranean", S, false, ["SPA_SC", "GOL", "TYS", "TUN", "MAO"]));

  // ── England (3 SC, 3 non-SC) ──
  m.set("EDI", def("EDI", "Edinburgh", C, true, ["CLY", "LVP", "YOR", "NTH", "NWG"]));
  m.set("LVP", def("LVP", "Liverpool", C, true, ["CLY", "EDI", "YOR", "WAL", "IRI"]));
  m.set("LON", def("LON", "London", C, true, ["WAL", "YOR", "NTH", "ENG"]));
  m.set("CLY", def("CLY", "Clyde", C, false, ["EDI", "LVP", "NAO", "NWG"]));
  m.set("YOR", def("YOR", "Yorkshire", C, false, ["EDI", "LVP", "LON", "NTH"]));
  m.set("WAL", def("WAL", "Wales", C, false, ["LVP", "LON", "ENG", "IRI"]));

  // ── France (3 SC, 3 non-SC) ──
  m.set("BRE", def("BRE", "Brest", C, true, ["PIC", "PAR", "GAS", "MAO", "ENG"]));
  m.set("PAR", def("PAR", "Paris", L, true, ["BRE", "PIC", "BUR", "GAS"]));
  m.set("MAR", def("MAR", "Marseilles", C, true, ["GAS", "BUR", "PIE", "SPA", "GOL"]));
  m.set("BUR", def("BUR", "Burgundy", L, false, ["PAR", "PIC", "GAS", "MAR", "BEL", "RUH", "MUN", "SWI"]));
  m.set("GAS", def("GAS", "Gascony", C, false, ["BRE", "PAR", "BUR", "MAR", "SPA", "SPA_NC", "MAO"]));
  m.set("PIC", def("PIC", "Picardy", C, false, ["BRE", "PAR", "BUR", "BEL", "ENG"]));

  // ── Germany (3 SC, 3 non-SC) ──
  m.set("BER", def("BER", "Berlin", C, true, ["PRU", "SIL", "MUN", "KIE", "BAL"]));
  m.set("KIE", def("KIE", "Kiel", C, true, ["BER", "MUN", "RUH", "HOL", "HEL", "DEN", "BAL"]));
  m.set("MUN", def("MUN", "Munich", L, true, ["BER", "KIE", "RUH", "BUR", "TYR", "BOH", "SIL", "SWI"]));
  m.set("PRU", def("PRU", "Prussia", C, false, ["BER", "SIL", "LVN", "BAL", "WAR"]));
  m.set("RUH", def("RUH", "Ruhr", L, false, ["HOL", "KIE", "MUN", "BUR", "BEL"]));
  m.set("SIL", def("SIL", "Silesia", L, false, ["BER", "PRU", "MUN", "BOH", "GAL", "WAR"]));

  // ── Italy (3 SC, 3 non-SC) ──
  m.set("NAP", def("NAP", "Naples", C, true, ["ROM", "APU", "TYS", "ION"]));
  m.set("ROM", def("ROM", "Rome", C, true, ["TUS", "APU", "NAP", "TYS"]));
  m.set("VEN", def("VEN", "Venice", C, true, ["PIE", "TUS", "APU", "TRI", "ADR", "TYR"]));
  m.set("APU", def("APU", "Apulia", C, false, ["VEN", "ROM", "NAP", "ADR", "ION"]));
  m.set("PIE", def("PIE", "Piedmont", C, false, ["MAR", "TUS", "VEN", "TYR", "SWI", "GOL"]));
  m.set("TUS", def("TUS", "Tuscany", C, false, ["PIE", "ROM", "VEN", "TYS", "GOL"]));

  // ── Austria-Hungary (3 SC, 3 non-SC) ──
  m.set("BUD", def("BUD", "Budapest", L, true, ["VIE", "TRI", "GAL", "RUM", "SER"]));
  m.set("TRI", def("TRI", "Trieste", C, true, ["VIE", "TYR", "VEN", "ADR", "BUD"]));
  m.set("VIE", def("VIE", "Vienna", L, true, ["TRI", "BUD", "BOH", "GAL"]));
  m.set("BOH", def("BOH", "Bohemia", L, false, ["VIE", "MUN", "SIL", "GAL", "TYR"]));
  m.set("GAL", def("GAL", "Galicia", L, false, ["BOH", "VIE", "BUD", "UKR", "WAR", "SIL"]));
  m.set("TYR", def("TYR", "Tyrolia", L, false, ["BOH", "PIE", "VEN", "TRI", "MUN", "SWI"]));

  // ── Russia (4 SC, 3 non-SC) ──
  m.set("MOS", def("MOS", "Moscow", L, true, ["STP", "LVN", "WAR", "UKR", "SEV"]));
  m.set("SEV", def("SEV", "Sevastopol", C, true, ["MOS", "UKR", "BLA", "ARM"]));
  m.set("STP", def("STP", "St Petersburg", C, true, ["MOS", "LVN", "FIN"]));
  m.set("WAR", def("WAR", "Warsaw", L, true, ["PRU", "SIL", "GAL", "UKR", "MOS", "LVN"]));
  m.set("FIN", def("FIN", "Finland", C, false, ["NWY", "SWE", "GOB", "STP", "STP_SC", "STP_NC"]));
  m.set("LVN", def("LVN", "Livonia", C, false, ["PRU", "WAR", "MOS", "STP", "STP_SC", "GOB", "BAL"]));
  m.set("UKR", def("UKR", "Ukraine", L, false, ["MOS", "WAR", "GAL", "RUM", "SEV"]));

  // ── Turkey (3 SC, 2 non-SC) ──
  m.set("ANK", def("ANK", "Ankara", C, true, ["CON", "SMY", "ARM", "BLA"]));
  m.set("CON", def("CON", "Constantinople", C, true, ["ANK", "BUL", "AEG", "BLA", "SMY", "BUL_EC", "BUL_SC"], undefined, true));
  m.set("SMY", def("SMY", "Smyrna", C, true, ["CON", "ANK", "ARM", "SYR", "AEG", "EAS"]));
  m.set("ARM", def("ARM", "Armenia", C, false, ["SEV", "ANK", "SMY", "SYR", "BLA"]));
  m.set("SYR", def("SYR", "Syria", C, false, ["SMY", "ARM", "EAS"]));

  // ── Neutral Supply Centers (12) ──
  m.set("BEL", def("BEL", "Belgium", C, true, ["HOL", "RUH", "BUR", "PIC", "ENG", "NTH"]));
  m.set("BUL", def("BUL", "Bulgaria", C, true, ["RUM", "SER", "GRE", "CON"]));
  m.set("DEN", def("DEN", "Denmark", C, true, ["KIE", "BAL", "SWE", "SKA", "NTH", "HEL"]));
  m.set("GRE", def("GRE", "Greece", C, true, ["ALB", "SER", "BUL", "AEG", "ION", "BUL_SC"]));
  m.set("HOL", def("HOL", "Holland", C, true, ["BEL", "RUH", "KIE", "HEL", "NTH"]));
  m.set("NWY", def("NWY", "Norway", C, true, ["FIN", "SWE", "SKA", "NTH", "NWG", "BAR"]));
  m.set("POR", def("POR", "Portugal", C, true, ["SPA", "SPA_SC", "MAO"]));
  m.set("RUM", def("RUM", "Romania", C, true, ["BUD", "SER", "BUL", "BUL_EC", "BLA", "UKR"]));
  m.set("SER", def("SER", "Serbia", L, true, ["BUD", "RUM", "BUL", "GRE", "ALB"]));
  m.set("SPA", def("SPA", "Spain", C, true, ["GAS", "MAR", "POR"]));
  m.set("SWE", def("SWE", "Sweden", C, true, ["NWY", "FIN", "GOB", "BAL", "SKA", "DEN"]));
  m.set("TUN", def("TUN", "Tunisia", C, true, ["TYS", "ION", "WES"]));

  // ── Neutral Non-SC (2) ──
  m.set("ALB", def("ALB", "Albania", C, false, ["GRE", "SER", "ADR", "ION"]));
  m.set("SWI", def("SWI", "Switzerland", L, false, ["TYR", "MUN", "BUR", "PIE"]));

  // ── Coast Sub-Provinces (6) ──
  m.set("SPA_NC", def("SPA_NC", "Spain North Coast", C, false, ["MAO", "GAS", "GOL"], "SPA"));
  m.set("SPA_SC", def("SPA_SC", "Spain South Coast", C, false, ["MAO", "POR", "WES"], "SPA"));
  m.set("STP_NC", def("STP_NC", "St Petersburg North Coast", C, false, ["BAR", "FIN"], "STP"));
  m.set("STP_SC", def("STP_SC", "St Petersburg South Coast", C, false, ["GOB", "FIN", "LVN"], "STP"));
  m.set("BUL_EC", def("BUL_EC", "Bulgaria East Coast", C, false, ["BLA", "RUM", "CON"], "BUL"));
  m.set("BUL_SC", def("BUL_SC", "Bulgaria South Coast", C, false, ["AEG", "GRE", "CON"], "BUL"));

  return m;
}
