import type {
  Blessing,
  BlessingId,
  Building,
  BuildingId,
  GameState,
  Milestone,
  ResourceKey,
  Terrain,
} from './types';

export const COLS = 20;
export const ROWS = 14;
export const TILE = 40;

/** How many path tiles an Agora's traders can walk to reach a house. */
export const AGORA_RANGE = 6;

/** How many path tiles a producer may be from a Storehouse to deliver goods. */
export const STOREHOUSE_RANGE = 8;

export const TERRAIN_COLOR: Record<Terrain, string> = {
  grass: '#7f9457',
  coast: '#8fae74',
  forest: '#3f5a2b',
  hill: '#a8804e',
  mountain: '#8b8378',
  water: '#2E6E82',
};

export const BUILDINGS: Record<BuildingId, Building> = {
  road: {
    name: 'Path',
    cat: 'Infrastructure',
    icon: '▪️',
    cost: { gold: 2, wood: 1 },
    allow: ['grass', 'coast'],
    jobs: 0,
    desc: 'Connects buildings. +10% output to adjacent producers and carries Agora food to houses.',
  },
  house: {
    name: 'House',
    cat: 'Infrastructure',
    icon: '🏠',
    cost: { gold: 12, wood: 15 },
    allow: ['grass', 'coast'],
    jobs: 0,
    capacity: 6,
    desc: 'Homes citizens (capacity 6). Only grows when an Agora delivers food along a path.',
  },
  agora: {
    name: 'Agora',
    cat: 'Infrastructure',
    icon: '🏪',
    cost: { gold: 45, wood: 15, stone: 10 },
    allow: ['grass', 'coast'],
    jobs: 2,
    desc: 'Market whose traders walk paths to deliver food to houses within 6 path tiles.',
  },
  storehouse: {
    name: 'Storehouse',
    cat: 'Infrastructure',
    icon: '📦',
    cost: { gold: 28, stone: 15 },
    allow: ['grass', 'coast'],
    jobs: 1,
    storageBonus: 200,
    desc: '+200 storage for every resource.',
  },

  lumber: {
    name: 'Lumber Camp',
    cat: 'Gathering',
    icon: '🪓',
    cost: { gold: 20 },
    allow: ['forest'],
    jobs: 2,
    produces: 'wood',
    rate: 2.2,
    desc: 'Harvests wood from the forest.',
  },
  quarry: {
    name: 'Quarry',
    cat: 'Gathering',
    icon: '⛏️',
    cost: { gold: 25, wood: 5 },
    allow: ['mountain'],
    jobs: 2,
    produces: 'stone',
    rate: 1.8,
    desc: 'Cuts stone from the mountain.',
  },
  mine: {
    name: 'Copper Mine',
    cat: 'Gathering',
    icon: '⚒️',
    cost: { gold: 32, wood: 5 },
    allow: ['hill'],
    jobs: 3,
    produces: 'copper',
    rate: 1.5,
    desc: 'Mines copper ore from the hills.',
  },
  dock: {
    name: 'Fishing Dock',
    cat: 'Gathering',
    icon: '🎣',
    cost: { gold: 20, wood: 5 },
    allow: ['coast'],
    jobs: 2,
    produces: 'fish',
    rate: 2.4,
    desc: 'Catches fish along the coast.',
  },
  farm: {
    name: 'Farm',
    cat: 'Gathering',
    icon: '🌾',
    cost: { gold: 16, wood: 5 },
    allow: ['grass'],
    jobs: 2,
    produces: 'grain',
    rate: 2.6,
    desc: 'Grows grain in the fields.',
  },

  forge: {
    name: 'Bronze Forge',
    cat: 'Production',
    icon: '🔥',
    cost: { gold: 42, stone: 15 },
    allow: ['grass', 'coast'],
    jobs: 3,
    consumes: 'copper',
    consumeRate: 3,
    produces: 'bronze',
    ratio: 0.8,
    desc: 'Smelts copper into bronze.',
  },
  granary: {
    name: 'Granary',
    cat: 'Production',
    icon: '🍞',
    cost: { gold: 30, wood: 10 },
    allow: ['grass', 'coast'],
    jobs: 2,
    consumes: 'grain',
    consumeRate: 4,
    produces: 'bread',
    ratio: 0.9,
    desc: 'Bakes grain into bread.',
  },

  templeZeus: {
    name: 'Temple of Zeus',
    cat: 'Temples',
    icon: '⚡',
    cost: { gold: 120, stone: 40, bronze: 20 },
    allow: ['grass', 'coast'],
    jobs: 1,
    god: 'zeus',
    desc: 'King of the Gods. +5% output citywide, generates Favor.',
  },
  templePoseidon: {
    name: 'Temple of Poseidon',
    cat: 'Temples',
    icon: '🔱',
    cost: { gold: 90, stone: 30 },
    allow: ['grass', 'coast'],
    jobs: 1,
    god: 'poseidon',
    boosts: ['fish'],
    desc: 'God of the Sea. +50% fish within 3 tiles.',
  },
  templeDemeter: {
    name: 'Temple of Demeter',
    cat: 'Temples',
    icon: '🌿',
    cost: { gold: 90, stone: 30 },
    allow: ['grass', 'coast'],
    jobs: 1,
    god: 'demeter',
    boosts: ['grain'],
    desc: 'Goddess of the Harvest. +50% grain within 3 tiles.',
  },
  templeHephaestus: {
    name: 'Temple of Hephaestus',
    cat: 'Temples',
    icon: '🔨',
    cost: { gold: 100, stone: 35, bronze: 10 },
    allow: ['grass', 'coast'],
    jobs: 1,
    god: 'hephaestus',
    boosts: ['copper', 'stone', 'bronze'],
    desc: 'God of the Forge. +50% copper/stone/bronze within 3 tiles.',
  },
  templeAthena: {
    name: 'Temple of Athena',
    cat: 'Temples',
    icon: '🦉',
    cost: { gold: 90, stone: 30 },
    allow: ['grass', 'coast'],
    jobs: 1,
    god: 'athena',
    boosts: ['happiness'],
    desc: 'Goddess of Wisdom. Raises happiness within 3 tiles.',
  },
};

export const BUILD_CATEGORIES = [
  'Infrastructure',
  'Gathering',
  'Production',
  'Temples',
] as const;

export const RES_META: Record<ResourceKey, { icon: string; label: string }> = {
  gold: { icon: '🪙', label: 'Gold' },
  favor: { icon: '✨', label: 'Favor' },
  wood: { icon: '🪵', label: 'Wood' },
  stone: { icon: '🪨', label: 'Stone' },
  copper: { icon: '🔶', label: 'Copper' },
  bronze: { icon: '🥉', label: 'Bronze' },
  fish: { icon: '🐟', label: 'Fish' },
  grain: { icon: '🌾', label: 'Grain' },
  bread: { icon: '🍞', label: 'Bread' },
};

export const RESOURCE_ORDER: ResourceKey[] = [
  'gold',
  'favor',
  'wood',
  'stone',
  'copper',
  'bronze',
  'fish',
  'grain',
  'bread',
];

export const BLESSINGS: Record<BlessingId, Blessing> = {
  poseidon: {
    name: "Poseidon's Bounty",
    cost: 50,
    dur: 60,
    icon: '🔱',
    effect: 'fish',
    mult: 2,
    desc: 'x2 fish for 60s',
  },
  demeter: {
    name: "Demeter's Harvest",
    cost: 50,
    dur: 60,
    icon: '🌿',
    effect: 'grain',
    mult: 2,
    desc: 'x2 grain for 60s',
  },
  hephaestus: {
    name: "Hephaestus' Fire",
    cost: 60,
    dur: 60,
    icon: '🔨',
    effect: 'industry',
    mult: 2,
    desc: 'x2 copper/stone/bronze for 60s',
  },
  zeus: {
    name: "Zeus' Bounty",
    cost: 80,
    dur: 0,
    icon: '⚡',
    effect: 'gold',
    amount: 250,
    desc: '+250 gold instantly',
  },
  athena: {
    name: "Athena's Wisdom",
    cost: 40,
    dur: 0,
    icon: '🦉',
    effect: 'happiness',
    amount: 20,
    desc: '+20 happiness instantly',
  },
};

export function countBuildings(s: GameState, type: BuildingId): number {
  let n = 0;
  for (const t of s.map) if (t.building === type) n++;
  return n;
}

export function countTemples(s: GameState): number {
  let n = 0;
  for (const t of s.map) if (t.building && t.building.startsWith('temple')) n++;
  return n;
}

export const MILESTONES: Milestone[] = [
  {
    id: 'm1',
    desc: 'Found your first House',
    reward: { gold: 20 },
    check: (s) => countBuildings(s, 'house') >= 1,
  },
  {
    id: 'm2',
    desc: 'Open a Copper Mine',
    reward: { favor: 15 },
    check: (s) => countBuildings(s, 'mine') >= 1,
  },
  {
    id: 'm3',
    desc: 'Build a Granary',
    reward: { favor: 20 },
    check: (s) => countBuildings(s, 'granary') >= 1,
  },
  {
    id: 'm4',
    desc: 'Grow to 25 citizens',
    reward: { gold: 100 },
    check: (s) => s.population >= 25,
  },
  {
    id: 'm5',
    desc: 'Raise your first Temple',
    reward: { favor: 40 },
    check: (s) => countTemples(s) >= 1,
  },
  {
    id: 'm6',
    desc: 'Forge 100 Bronze (lifetime)',
    reward: { gold: 80 },
    check: (s) => s.totalProduced.bronze >= 100,
  },
  {
    id: 'm7',
    desc: 'Grow to 100 citizens',
    reward: { favor: 60 },
    check: (s) => s.population >= 100,
  },
  {
    id: 'm8',
    desc: 'Complete the Pantheon (all 5 Temples)',
    reward: { gold: 300, favor: 100 },
    check: (s) => countTemples(s) >= 5,
  },
  {
    id: 'm9',
    desc: 'Haul 200 Fish (lifetime)',
    reward: { gold: 60 },
    check: (s) => s.totalProduced.fish >= 200,
  },
  {
    id: 'm10',
    desc: 'Store 500 Favor',
    reward: { gold: 200 },
    check: (s) => s.resources.favor >= 500,
  },
  {
    id: 'm11',
    desc: 'Open your first Agora',
    reward: { gold: 40 },
    check: (s) => countBuildings(s, 'agora') >= 1,
  },
  {
    id: 'm12',
    desc: 'Lay 12 Paths to link your city',
    reward: { favor: 25 },
    check: (s) => countBuildings(s, 'road') >= 12,
  },
];
