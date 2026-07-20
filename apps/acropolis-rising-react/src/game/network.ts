import { BUILDINGS, COLS, ROWS } from './data';
import type { BuildingId, Point, Tile } from './types';

const DIRS = [
	[1, 0],
	[-1, 0],
	[0, 1],
	[0, -1],
] as const;

const inBounds = (x: number, y: number) => x >= 0 && x < COLS && y >= 0 && y < ROWS;
const idx = (x: number, y: number) => y * COLS + x;
const toPoint = (k: number): Point => ({ x: k % COLS, y: (k - (k % COLS)) / COLS });

/** Result of flooding the path network outward from a set of "source"
    buildings (Agoras, Storehouses). Each visited path tile records its walking
    distance, the previous path tile on the shortest route, and which source it
    was reached from — enough to answer coverage questions and rebuild routes. */
interface PathFlood {
	dist: number[];
	parent: number[];
	source: number[];
}

/**
 * Uniform-cost BFS over path tiles starting from every path tile adjacent to a
 * `source` building. A path tile is reachable if it lies within `range` steps
 * of some source; the search does not expand past `range`, so a tile exactly at
 * the limit is still marked (and can service a neighbour) but leads no further.
 */
function floodPaths(map: Tile[], isSource: (b: BuildingId) => boolean, range: number): PathFlood {
	const dist = new Array<number>(COLS * ROWS).fill(Infinity);
	const parent = new Array<number>(COLS * ROWS).fill(-1);
	const source = new Array<number>(COLS * ROWS).fill(-1);
	const queue: number[] = [];

	for (const t of map) {
		if (!t.building || !isSource(t.building)) continue;
		const here = idx(t.x, t.y);
		for (const [dx, dy] of DIRS) {
			const nx = t.x + dx,
				ny = t.y + dy;
			if (!inBounds(nx, ny)) continue;
			const nk = idx(nx, ny);
			if (map[nk].building === 'road' && dist[nk] > 1) {
				dist[nk] = 1;
				parent[nk] = -1;
				source[nk] = here;
				queue.push(nk);
			}
		}
	}

	for (let head = 0; head < queue.length; head++) {
		const cur = queue[head];
		const cx = cur % COLS;
		const cy = (cur - cx) / COLS;
		const d = dist[cur];
		if (d >= range) continue; // marked, but do not extend the route further
		for (const [dx, dy] of DIRS) {
			const nx = cx + dx,
				ny = cy + dy;
			if (!inBounds(nx, ny)) continue;
			const nk = idx(nx, ny);
			if (map[nk].building === 'road' && dist[nk] > d + 1) {
				dist[nk] = d + 1;
				parent[nk] = cur;
				source[nk] = source[cur];
				queue.push(nk);
			}
		}
	}

	return { dist, parent, source };
}

/** Building ids whose output must reach a Storehouse to be stored. */
export function isProducer(b: BuildingId): boolean {
	return BUILDINGS[b].produces !== undefined;
}

// ---------------------------------------------------------------------------
// Food distribution: Agoras -> houses
// ---------------------------------------------------------------------------

/** Which houses an Agora can reach with food, and how much housing that covers.
    "Serviced" is purely structural (depends only on the map layout), so it is
    stable across ticks and safe to memoise on the map reference. */
export interface FoodCoverage {
	/** Tile indices of houses reached by at least one Agora over the paths. */
	servicedHouses: Set<number>;
	/** Combined capacity of the serviced houses. */
	servicedCapacity: number;
	/** Combined capacity of every house, serviced or not. */
	totalCapacity: number;
	houseCount: number;
	servicedCount: number;
	agoraCount: number;
}

/**
 * Marks the houses an Agora's traders can walk to: houses beside the Agora
 * itself (its forecourt) or beside a path tile within range along the network.
 */
export function computeCoverage(map: Tile[], range = 6): FoodCoverage {
	const houseCap = BUILDINGS.house.capacity ?? 0;
	const flood = floodPaths(map, b => b === 'agora', range);
	const serviced = new Set<number>();

	let houseCount = 0;
	let totalCapacity = 0;
	let agoraCount = 0;

	for (const t of map) {
		if (t.building === 'agora') agoraCount++;
		else if (t.building === 'house') {
			houseCount++;
			totalCapacity += houseCap;
			const here = idx(t.x, t.y);
			for (const [dx, dy] of DIRS) {
				const nx = t.x + dx,
					ny = t.y + dy;
				if (!inBounds(nx, ny)) continue;
				const n = map[idx(nx, ny)];
				// beside an Agora (forecourt) or beside a reachable path tile
				if (n.building === 'agora' || (n.building === 'road' && flood.dist[idx(nx, ny)] < Infinity)) {
					serviced.add(here);
					break;
				}
			}
		}
	}

	return {
		servicedHouses: serviced,
		servicedCapacity: serviced.size * houseCap,
		totalCapacity,
		houseCount,
		servicedCount: serviced.size,
		agoraCount,
	};
}

// ---------------------------------------------------------------------------
// Storage access: producers -> Storehouses
// ---------------------------------------------------------------------------

/** Which gathering/production buildings can deliver their output to storage. */
export interface StorageAccess {
	/** Tile indices of producers connected to a Storehouse. */
	connected: Set<number>;
	producerCount: number;
	connectedCount: number;
	storehouseCount: number;
}

/**
 * A producer can store its goods if a Storehouse is within `pickupRadius`
 * straight-line tiles (local pickup — the common case for gatherers on terrain
 * where paths can't be laid) or it sits beside a path within `range` of one.
 * Without a route to storage it produces nothing — goods have nowhere to go.
 */
export function computeStorageAccess(map: Tile[], range = 8, pickupRadius = 2): StorageAccess {
	const flood = floodPaths(map, b => b === 'storehouse', range);
	const storehouses: Tile[] = [];
	const connected = new Set<number>();
	let producerCount = 0;

	for (const t of map) if (t.building === 'storehouse') storehouses.push(t);

	for (const t of map) {
		if (!t.building || !isProducer(t.building)) continue;
		producerCount++;
		const here = idx(t.x, t.y);

		// local pickup: any Storehouse within the straight-line radius
		let ok = storehouses.some(sh => Math.max(Math.abs(sh.x - t.x), Math.abs(sh.y - t.y)) <= pickupRadius);
		// otherwise, a path route: beside a road reachable from a Storehouse
		if (!ok) {
			for (const [dx, dy] of DIRS) {
				const nx = t.x + dx,
					ny = t.y + dy;
				if (!inBounds(nx, ny)) continue;
				const nk = idx(nx, ny);
				if (map[nk].building === 'road' && flood.dist[nk] < Infinity) {
					ok = true;
					break;
				}
			}
		}
		if (ok) connected.add(here);
	}

	return {
		connected,
		producerCount,
		connectedCount: connected.size,
		storehouseCount: storehouses.length,
	};
}

// ---------------------------------------------------------------------------
// Cart routes: animated deliveries (food Agora->house, goods producer->store)
// ---------------------------------------------------------------------------

/** A delivery route as a polyline of tile coordinates, tagged by what it hauls. */
export interface CartRoute {
	tiles: Point[];
	kind: 'food' | 'goods';
}

/** Cap on how many carts we draw per source, to keep the map legible and cheap. */
const MAX_ROUTES_PER_SOURCE = 4;

/** Nearest 4-adjacent road reachable from a flood source, or -1. */
function bestFeederRoad(map: Tile[], t: Tile, flood: PathFlood): number {
	let feeder = -1;
	for (const [dx, dy] of DIRS) {
		const nx = t.x + dx,
			ny = t.y + dy;
		if (!inBounds(nx, ny)) continue;
		const nk = idx(nx, ny);
		if (map[nk].building === 'road' && flood.dist[nk] < Infinity && (feeder === -1 || flood.dist[nk] < flood.dist[feeder])) {
			feeder = nk;
		}
	}
	return feeder;
}

/** Ordered path tiles from a feeder road back to its seed (nearest the source). */
function roadChainToSeed(feeder: number, flood: PathFlood): number[] {
	const chain: number[] = [];
	for (let r = feeder; r !== -1; r = flood.parent[r]) chain.push(r);
	return chain;
}

/**
 * Builds a walkable polyline (Agora → path tiles → house) for a sample of the
 * houses each Agora feeds, used to animate market carts along the network.
 */
export function computeCartRoutes(map: Tile[], range = 6): CartRoute[] {
	const flood = floodPaths(map, b => b === 'agora', range);
	const routes: CartRoute[] = [];
	const perAgora = new Map<number, number>();
	const bump = (a: number) => {
		const c = perAgora.get(a) ?? 0;
		if (c >= MAX_ROUTES_PER_SOURCE) return false;
		perAgora.set(a, c + 1);
		return true;
	};

	for (const t of map) {
		if (t.building !== 'house') continue;
		const house = idx(t.x, t.y);
		// A house beside an Agora is fed straight from its forecourt.
		let forecourtAgora = -1;
		for (const [dx, dy] of DIRS) {
			const nx = t.x + dx,
				ny = t.y + dy;
			if (!inBounds(nx, ny)) continue;
			if (map[idx(nx, ny)].building === 'agora') {
				forecourtAgora = idx(nx, ny);
				break;
			}
		}
		if (forecourtAgora !== -1) {
			if (bump(forecourtAgora)) routes.push({ kind: 'food', tiles: [toPoint(forecourtAgora), toPoint(house)] });
			continue;
		}

		const feeder = bestFeederRoad(map, t, flood);
		if (feeder === -1) continue;
		const agora = flood.source[feeder];
		if (agora === -1 || !bump(agora)) continue;
		// Order the polyline Agora -> ...roads... -> house.
		const roadChain = roadChainToSeed(feeder, flood).reverse();
		routes.push({ kind: 'food', tiles: [toPoint(agora), ...roadChain.map(toPoint), toPoint(house)] });
	}

	return routes;
}

/**
 * Builds delivery polylines from each connected producer to the Storehouse that
 * stores its goods: a straight hop for a Storehouse within pickup range, or a
 * walk along the path network for a longer haul. Mirrors computeStorageAccess.
 */
export function computeGoodsRoutes(map: Tile[], range = 8, pickupRadius = 2): CartRoute[] {
	const flood = floodPaths(map, b => b === 'storehouse', range);
	const storehouses: number[] = [];
	for (const t of map) if (t.building === 'storehouse') storehouses.push(idx(t.x, t.y));

	const routes: CartRoute[] = [];
	const perStore = new Map<number, number>();
	const bump = (sh: number) => {
		const c = perStore.get(sh) ?? 0;
		if (c >= MAX_ROUTES_PER_SOURCE) return false;
		perStore.set(sh, c + 1);
		return true;
	};

	for (const t of map) {
		if (!t.building || !isProducer(t.building)) continue;
		const prod = idx(t.x, t.y);

		// nearest Storehouse within straight pickup range → a direct hop
		let best = -1;
		let bestD = Infinity;
		for (const sh of storehouses) {
			const p = toPoint(sh);
			const d = Math.max(Math.abs(p.x - t.x), Math.abs(p.y - t.y));
			if (d <= pickupRadius && d < bestD) {
				bestD = d;
				best = sh;
			}
		}
		if (best !== -1) {
			if (bump(best)) routes.push({ kind: 'goods', tiles: [toPoint(prod), toPoint(best)] });
			continue;
		}

		// otherwise haul along the path network to the Storehouse feeding it
		const feeder = bestFeederRoad(map, t, flood);
		if (feeder === -1) continue;
		const sh = flood.source[feeder];
		if (sh === -1 || !bump(sh)) continue;
		// feeder..seed already runs toward the Storehouse; append the store itself.
		const roadChain = roadChainToSeed(feeder, flood);
		routes.push({ kind: 'goods', tiles: [toPoint(prod), ...roadChain.map(toPoint), toPoint(sh)] });
	}

	return routes;
}
