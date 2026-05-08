export enum ProvinceType {
  LAND = "LAND",
  SEA = "SEA",
  COAST = "COAST",
}

export enum UnitType {
  ARMY = "A",
  FLEET = "F",
}

export enum OrderType {
  HOLD = "HOLD",
  MOVE = "MOVE",
  SUPPORT = "SUPPORT",
}

export enum Phase {
  PLACEMENT = "PLACEMENT",
  ORDER = "ORDER",
  RESOLUTION = "RESOLUTION",
  RETREAT = "RETREAT",
  BUILD = "BUILD",
}

export interface Province {
  readonly id: string;
  readonly name: string;
  readonly type: ProvinceType;
  readonly isSupplyCenter: boolean;
  readonly neighbors: readonly string[];
  readonly coastOf?: string;
  readonly landConnection?: boolean;
}

export interface Unit {
  readonly id: string;
  readonly type: UnitType;
  readonly ownerId: string;
  locationId: string;
  mustRetreat: boolean;
}

export interface Order {
  readonly unitId: string;
  readonly type: OrderType;
  readonly targetLocationId?: string;
  readonly supportUnitId?: string;
  readonly supportOrderType?: OrderType;
  readonly supportTargetLocationId?: string;
}

export interface Player {
  readonly id: string;
  readonly name: string;
  supplyCenterCount: number;
  units: Map<string, Unit>;
  eliminated: boolean;
}

export interface GameState {
  readonly year: number;
  readonly season: "SPRING" | "FALL";
  readonly phase: Phase;
  readonly players: ReadonlyMap<string, Player>;
  readonly provinces: ReadonlyMap<string, Province>;
  readonly units: ReadonlyMap<string, Unit>;
  readonly orders: ReadonlyMap<string, Order>;
  readonly retreatsNeeded: readonly string[];
}

export interface ResolutionResult {
  readonly successfulMoves: ReadonlyArray<{
    unitId: string;
    fromLocationId: string;
    toLocationId: string;
  }>;
  readonly bouncedMoves: ReadonlyArray<{
    unitId: string;
    attemptedLocationId: string;
  }>;
  readonly dislodgedUnits: ReadonlyArray<{
    unitId: string;
    fromLocationId: string;
    dislodgedByUnitId: string;
  }>;
  readonly destroyedUnits: ReadonlyArray<string>;
  readonly combatLog: ReadonlyArray<string>;
}

export interface BuildOrder {
  readonly playerId: string;
  readonly type: "CREATE" | "DESTROY";
  readonly unitType?: UnitType;
  readonly locationId?: string;
}

export interface Placement {
  readonly type: UnitType;
  readonly locationId: string;
}

export interface GameConfig {
  readonly winningSupplyCenters: number;
  readonly initialUnitsPerPlayer: number;
}
