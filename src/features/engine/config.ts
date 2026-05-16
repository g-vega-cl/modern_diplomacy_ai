export const GAME_CONFIG = {
  WINNING_SUPPLY_CENTERS: 18,
  INITIAL_UNITS_PER_PLAYER: 3,
  MAX_UNITS_PER_PLAYER: 18,
  SEASONS_PER_YEAR: 2,
  BUILD_PHASE: "FALL",
  START_YEAR: 1901,
} as const;

export const PLAYERS = ["england", "france", "germany", "italy", "austria", "russia", "turkey"] as const;

export const HOME_SCS: Record<string, readonly string[]> = {
  england: ["EDI", "LON", "LVP"],
  france: ["PAR", "MAR", "BRE"],
  germany: ["BER", "MUN", "KIE"],
  italy: ["ROM", "VEN", "NAP"],
  austria: ["VIE", "TRI", "BUD"],
  russia: ["MOS", "STP", "SEV", "WAR"],
  turkey: ["CON", "ANK", "SMY"],
};

export const STARTING_UNITS: Record<string, Array<{ type: "A" | "F"; locationId: string }>> = {
  england: [{ type: "F", locationId: "LON" }, { type: "F", locationId: "EDI" }, { type: "A", locationId: "LVP" }],
  france: [{ type: "F", locationId: "BRE" }, { type: "A", locationId: "PAR" }, { type: "A", locationId: "MAR" }],
  germany: [{ type: "F", locationId: "KIE" }, { type: "A", locationId: "BER" }, { type: "A", locationId: "MUN" }],
  italy: [{ type: "F", locationId: "NAP" }, { type: "A", locationId: "ROM" }, { type: "A", locationId: "VEN" }],
  austria: [{ type: "F", locationId: "TRI" }, { type: "A", locationId: "VIE" }, { type: "A", locationId: "BUD" }],
  russia: [{ type: "F", locationId: "STP_NC" }, { type: "A", locationId: "MOS" }, { type: "A", locationId: "WAR" }, { type: "A", locationId: "SEV" }],
  turkey: [{ type: "F", locationId: "ANK" }, { type: "A", locationId: "CON" }, { type: "A", locationId: "SMY" }],
};
