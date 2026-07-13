import { BLESSINGS, BUILDINGS, COLS, MILESTONES, RESOURCE_ORDER, ROWS, countBuildings, countTemples } from './data';
import { generateMap } from './map';
import { makeRng, randomSeed } from './rng';
import type { ActionResult, BlessingId, BoostTag, BuildingId, GameState, ResourceKey, Tile } from './types';

export function newGameState(seed: number = randomSeed()): GameState {
	const rng = makeRng(seed);
	const map = generateMap(rng);
	return {
		map,
		resources: {
			gold: 150,
			favor: 0,
			wood: 40,
			stone: 20,
			copper: 0,
			bronze: 0,
			fish: 0,
			grain: 0,
			bread: 0,
		},
		storageCap: 300,
		population: 8,
		happiness: 55,
		totalProduced: {
			gold: 0,
			favor: 0,
			wood: 0,
			stone: 0,
			copper: 0,
			bronze: 0,
			fish: 0,
			grain: 0,
			bread: 0,
		},
		blessingsActive: {},
		milestonesDone: {},
		tickCount: 0,
		cityName: 'Elysia',
		seed,
		rngState: rng.state,
	};
}

export function tileAt(s: GameState, x: number, y: number): Tile {
	return s.map[y * COLS + x];
}

export function totalJobs(s: GameState): number {
	let jobs = 0;
	for (const t of s.map) if (t.building) jobs += BUILDINGS[t.building].jobs;
	return jobs;
}

export function housingCapacity(s: GameState): number {
	return countBuildings(s, 'house') * (BUILDINGS.house.capacity ?? 0);
}

export function canAfford(s: GameState, cost: Partial<Record<ResourceKey, number>>): boolean {
	for (const [k, v] of Object.entries(cost)) if ((s.resources[k as ResourceKey] || 0) < v) return false;
	return true;
}

/** Shallow-clones the mutable parts of the state; the map array is reused
    and only replaced by actions that change a tile. */
function cloneState(s: GameState): GameState {
	return {
		...s,
		resources: { ...s.resources },
		totalProduced: { ...s.totalProduced },
		blessingsActive: { ...s.blessingsActive },
		milestonesDone: { ...s.milestonesDone },
	};
}

function pay(s: GameState, cost: Partial<Record<ResourceKey, number>>) {
	for (const [k, v] of Object.entries(cost)) s.resources[k as ResourceKey] -= v;
}

function addResource(s: GameState, key: ResourceKey, amount: number) {
	s.resources[key] += amount;
	s.totalProduced[key] = (s.totalProduced[key] || 0) + amount;
}

/** A boost-emitting building's position and the tags it boosts. */
interface BoostSource {
	x: number;
	y: number;
	boosts: BoostTag[];
}

/** Gathers every boost source once per tick so per-tile lookups don't rescan
    the whole map (keeps tick roughly linear in the number of tiles). */
function collectBoostSources(s: GameState): BoostSource[] {
	const out: BoostSource[] = [];
	for (const t of s.map) {
		if (!t.building) continue;
		const b = BUILDINGS[t.building];
		if (b.boosts) out.push({ x: t.x, y: t.y, boosts: b.boosts });
	}
	return out;
}

function templeBoostWithin(sources: BoostSource[], x: number, y: number, tag: BoostTag, radius: number): boolean {
	for (const s of sources) {
		if (s.boosts.includes(tag) && Math.abs(s.x - x) <= radius && Math.abs(s.y - y) <= radius) return true;
	}
	return false;
}

function anyBoost(sources: BoostSource[], tag: BoostTag): boolean {
	return sources.some(s => s.boosts.includes(tag));
}

function hasRoadAdjacent(s: GameState, x: number, y: number): boolean {
	const neighbors = [
		[1, 0],
		[-1, 0],
		[0, 1],
		[0, -1],
	];
	for (const [dx, dy] of neighbors) {
		const nx = x + dx,
			ny = y + dy;
		if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) {
			if (tileAt(s, nx, ny).building === 'road') return true;
		}
	}
	return false;
}

function zeusBonus(s: GameState): number {
	return countBuildings(s, 'templeZeus') > 0 ? 1.05 : 1;
}

/** Resources each production-boosting blessing effect applies to. */
const BLESSING_EFFECT_RESOURCES: Record<string, ResourceKey[]> = {
	fish: ['fish'],
	grain: ['grain'],
	industry: ['copper', 'stone', 'bronze'],
};

function blessingMultFor(s: GameState, resourceKey: ResourceKey): number {
	let mult = 1;
	for (const id of Object.keys(s.blessingsActive) as BlessingId[]) {
		const bl = BLESSINGS[id];
		if (BLESSING_EFFECT_RESOURCES[bl.effect]?.includes(resourceKey)) mult *= bl.mult ?? 1;
	}
	return mult;
}

function checkMilestones(s: GameState, toasts: string[]) {
	for (const m of MILESTONES) {
		if (s.milestonesDone[m.id]) continue;
		if (m.check(s)) {
			s.milestonesDone[m.id] = true;
			for (const [k, v] of Object.entries(m.reward)) addResource(s, k as ResourceKey, v);
			toasts.push(`🏆 Milestone: ${m.desc}`);
		}
	}
}

/** Advances the simulation by one tick (one game second). */
export function tick(prev: GameState): ActionResult {
	const s = cloneState(prev);
	const toasts: string[] = [];
	const rng = makeRng(s.rngState);
	s.tickCount++;
	const jobs = totalJobs(s);
	const employmentRatio = jobs > 0 ? Math.min(1, s.population / jobs) : 1;
	const zb = zeusBonus(s);
	const boosts = collectBoostSources(s);

	// production / gathering
	for (const t of s.map) {
		if (!t.building) continue;
		const b = BUILDINGS[t.building];
		if (!b.produces) continue;
		const roadBonus = hasRoadAdjacent(s, t.x, t.y) ? 1.1 : 1;
		const templeBonus = templeBoostWithin(boosts, t.x, t.y, b.produces, 3) ? 1.5 : 1;
		const bMult = blessingMultFor(s, b.produces);

		if (b.consumes) {
			const want = (b.consumeRate ?? 0) * employmentRatio * roadBonus;
			const avail = Math.min(want, s.resources[b.consumes] || 0);
			s.resources[b.consumes] -= avail;
			addResource(s, b.produces, avail * (b.ratio ?? 0) * templeBonus * bMult * zb);
		} else {
			const amount = (b.rate ?? 0) * employmentRatio * roadBonus * templeBonus * bMult * zb;
			addResource(s, b.produces, amount);
		}
	}

	// food consumption
	const foodNeed = s.population * 0.35;
	let remaining = foodNeed;
	for (const foodRes of ['bread', 'fish', 'grain'] as const) {
		const take = Math.min(remaining, s.resources[foodRes]);
		s.resources[foodRes] -= take;
		remaining -= take;
	}
	const starving = remaining > 0.01;

	// gold tax
	const happinessFactor = Math.max(0.2, s.happiness / 100);
	s.resources.gold += s.population * 0.09 * happinessFactor;

	// favor from temples
	const temples = countTemples(s);
	if (temples > 0) addResource(s, 'favor', temples * 0.4 * happinessFactor);

	// happiness dynamics
	let target = 45;
	target += anyBoost(boosts, 'happiness') ? 15 : 0;
	target += Math.min(20, temples * 4);
	target += employmentRatio > 0.85 ? 8 : employmentRatio < 0.4 ? -10 : 0;
	target += starving ? -25 : 5;
	s.happiness += (target - s.happiness) * 0.05;
	s.happiness = Math.max(0, Math.min(100, s.happiness));

	// population dynamics
	const housingCap = housingCapacity(s);
	if (!starving && s.happiness >= 40 && s.population < housingCap) {
		if (rng.next() < 0.35 * (s.happiness / 100)) {
			s.population = Math.min(housingCap, s.population + (1 + Math.floor(rng.next() * 3)));
		}
	} else if (starving || s.happiness < 18) {
		s.population = Math.max(0, s.population - 1);
	}

	// clamp storable resources to cap (gold/favor uncapped)
	for (const key of RESOURCE_ORDER) {
		if (key === 'gold' || key === 'favor') continue;
		s.resources[key] = Math.min(s.storageCap, s.resources[key]);
	}

	// clear expired blessings
	for (const id of Object.keys(s.blessingsActive) as BlessingId[]) {
		const expires = s.blessingsActive[id];
		if (expires !== undefined && expires <= s.tickCount) delete s.blessingsActive[id];
	}

	checkMilestones(s, toasts);
	s.rngState = rng.state;
	return { state: s, toasts };
}

export function tryPlace(prev: GameState, buildId: BuildingId, x: number, y: number): ActionResult {
	const b = BUILDINGS[buildId];
	const t = tileAt(prev, x, y);
	if (t.building) {
		return { state: prev, toasts: ['That tile is already built on.'] };
	}
	if (!b.allow.includes(t.terrain)) {
		return {
			state: prev,
			toasts: [`${b.name} cannot be built on ${t.terrain}.`],
		};
	}
	if (!canAfford(prev, b.cost)) {
		return { state: prev, toasts: ['Not enough resources.'] };
	}
	const s = cloneState(prev);
	pay(s, b.cost);
	s.map = prev.map.map(tile => (tile.x === x && tile.y === y ? { ...tile, building: buildId } : tile));
	if (b.storageBonus) s.storageCap += b.storageBonus;
	return { state: s, toasts: [`Built ${b.name}.`] };
}

export function bulldoze(prev: GameState, x: number, y: number): ActionResult {
	const t = tileAt(prev, x, y);
	if (!t.building) return { state: prev, toasts: [] };
	const b = BUILDINGS[t.building];
	const s = cloneState(prev);
	for (const [k, v] of Object.entries(b.cost)) {
		const key = k as ResourceKey;
		s.resources[key] = Math.min(s.storageCap, s.resources[key] + v * 0.5);
	}
	if (b.storageBonus) s.storageCap = Math.max(300, s.storageCap - b.storageBonus);
	s.map = prev.map.map(tile => (tile.x === x && tile.y === y ? { ...tile, building: null } : tile));
	return { state: s, toasts: [`Demolished ${b.name}.`] };
}

export function castBlessing(prev: GameState, id: BlessingId): ActionResult {
	const bl = BLESSINGS[id];
	if (prev.resources.favor < bl.cost) return { state: prev, toasts: [] };
	if (bl.dur > 0 && prev.blessingsActive[id]) return { state: prev, toasts: [] };
	const s = cloneState(prev);
	s.resources.favor -= bl.cost;
	if (bl.effect === 'gold') {
		s.resources.gold += bl.amount ?? 0;
		return { state: s, toasts: [`${bl.name}: +${bl.amount} gold!`] };
	}
	if (bl.effect === 'happiness') {
		s.happiness = Math.min(100, s.happiness + (bl.amount ?? 0));
		return { state: s, toasts: [`${bl.name}: +${bl.amount} happiness!`] };
	}
	s.blessingsActive[id] = s.tickCount + bl.dur;
	return { state: s, toasts: [`${bl.name} invoked!`] };
}
