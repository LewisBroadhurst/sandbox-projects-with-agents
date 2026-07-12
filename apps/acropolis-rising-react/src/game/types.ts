export type Terrain =
  | 'grass'
  | 'coast'
  | 'forest'
  | 'hill'
  | 'mountain'
  | 'water';

export type ResourceKey =
  | 'gold'
  | 'favor'
  | 'wood'
  | 'stone'
  | 'copper'
  | 'bronze'
  | 'fish'
  | 'grain'
  | 'bread';

export type BuildingCategory =
  | 'Infrastructure'
  | 'Gathering'
  | 'Production'
  | 'Temples';

export type BuildingId =
  | 'road'
  | 'house'
  | 'storehouse'
  | 'lumber'
  | 'quarry'
  | 'mine'
  | 'dock'
  | 'farm'
  | 'forge'
  | 'granary'
  | 'templeZeus'
  | 'templePoseidon'
  | 'templeDemeter'
  | 'templeHephaestus'
  | 'templeAthena';

export type BlessingId =
  | 'poseidon'
  | 'demeter'
  | 'hephaestus'
  | 'zeus'
  | 'athena';

/** Tags a temple can boost: a produced resource or citywide happiness. */
export type BoostTag = ResourceKey | 'happiness';

export interface Building {
  name: string;
  cat: BuildingCategory;
  icon: string;
  cost: Partial<Record<ResourceKey, number>>;
  allow: Terrain[];
  jobs: number;
  capacity?: number;
  storageBonus?: number;
  produces?: ResourceKey;
  rate?: number;
  consumes?: ResourceKey;
  consumeRate?: number;
  ratio?: number;
  god?: string;
  boosts?: BoostTag[];
  desc: string;
}

export interface Blessing {
  name: string;
  cost: number;
  /** Duration in ticks; 0 means an instant effect. */
  dur: number;
  icon: string;
  effect: 'fish' | 'grain' | 'industry' | 'gold' | 'happiness';
  mult?: number;
  amount?: number;
  desc: string;
}

export interface Milestone {
  id: string;
  desc: string;
  reward: Partial<Record<ResourceKey, number>>;
  check: (s: GameState) => boolean;
}

export interface Tile {
  x: number;
  y: number;
  terrain: Terrain;
  building: BuildingId | null;
}

export interface GameState {
  map: Tile[];
  resources: Record<ResourceKey, number>;
  storageCap: number;
  population: number;
  happiness: number;
  totalProduced: Record<ResourceKey, number>;
  /** Blessing id -> tick at which it expires. */
  blessingsActive: Partial<Record<BlessingId, number>>;
  milestonesDone: Record<string, boolean>;
  tickCount: number;
  cityName: string;
}

export interface Point {
  x: number;
  y: number;
}

/** Result of applying a game action: the next state plus toast messages to show. */
export interface ActionResult {
  state: GameState;
  toasts: string[];
}
