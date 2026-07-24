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
 * A producer can store its goods only over an orthogonal road route: either it
 * sits right beside a Storehouse (its loading dock — no road needed, like an
 * Agora's forecourt) or beside a path tile within `range` of a Storehouse along
 * the network. A gatherer on forest/hill/mountain, where paths can't be laid,
 * connects by putting a road on the adjacent grass/coast. Without such a route
 * it produces nothing — goods have nowhere to go.
 */
export function computeStorageAccess(map: Tile[], range = 8): StorageAccess {
	const flood = floodPaths(map, b => b === 'storehouse', range);
	const connected = new Set<number>();
	let storehouseCount = 0;
	let producerCount = 0;

	for (const t of map) if (t.building === 'storehouse') storehouseCount++;

	for (const t of map) {
		if (!t.building || !isProducer(t.building)) continue;
		producerCount++;
		const here = idx(t.x, t.y);

		// beside a Storehouse (loading dock) or beside a reachable path tile
		for (const [dx, dy] of DIRS) {
			const nx = t.x + dx,
				ny = t.y + dy;
			if (!inBounds(nx, ny)) continue;
			const n = map[idx(nx, ny)];
			if (n.building === 'storehouse' || (n.building === 'road' && flood.dist[idx(nx, ny)] < Infinity)) {
				connected.add(here);
				break;
			}
		}
	}

	return {
		connected,
		producerCount,
		connectedCount: connected.size,
		storehouseCount,
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

		// Prefer hauling food along the path network whenever the house sits beside
		// a reachable road, so carts always travel the roads the player laid — even
		// when an Agora stands right next door.
		const feeder = bestFeederRoad(map, t, flood);
		if (feeder !== -1) {
			const agora = flood.source[feeder];
			if (agora !== -1 && bump(agora)) {
				// Order the polyline Agora -> ...roads... -> house.
				const roadChain = roadChainToSeed(feeder, flood).reverse();
				routes.push({ kind: 'food', tiles: [toPoint(agora), ...roadChain.map(toPoint), toPoint(house)] });
			}
			continue;
		}

		// Fallback: no road reaches the house, so a directly adjacent Agora feeds
		// it straight from its forecourt.
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
		if (forecourtAgora !== -1 && bump(forecourtAgora)) {
			routes.push({ kind: 'food', tiles: [toPoint(forecourtAgora), toPoint(house)] });
		}
	}

	return routes;
}

/**
 * Builds delivery polylines from each connected producer to the Storehouse that
 * stores its goods: a single orthogonal hop to a Storehouse right beside the
 * producer, or a walk along the path network for a longer haul. Mirrors
 * computeStorageAccess, so every segment runs along a tile row or column.
 */
export function computeGoodsRoutes(map: Tile[], range = 8): CartRoute[] {
	const flood = floodPaths(map, b => b === 'storehouse', range);
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

		// Prefer hauling goods along the path network whenever the producer sits
		// beside a reachable road, so carts follow the roads the player laid — even
		// when a Storehouse stands right beside the producer.
		const feeder = bestFeederRoad(map, t, flood);
		if (feeder !== -1) {
			const sh = flood.source[feeder];
			if (sh !== -1 && bump(sh)) {
				// feeder..seed already runs toward the Storehouse; append the store itself.
				const roadChain = roadChainToSeed(feeder, flood);
				routes.push({ kind: 'goods', tiles: [toPoint(prod), ...roadChain.map(toPoint), toPoint(sh)] });
			}
			continue;
		}

		// Fallback: no road reaches the producer, so a Storehouse right beside it
		// takes goods from its loading dock — a single orthogonal hop, no road needed.
		let dock = -1;
		for (const [dx, dy] of DIRS) {
			const nx = t.x + dx,
				ny = t.y + dy;
			if (!inBounds(nx, ny)) continue;
			const nk = idx(nx, ny);
			if (map[nk].building === 'storehouse') {
				dock = nk;
				break;
			}
		}
		if (dock !== -1 && bump(dock)) {
			routes.push({ kind: 'goods', tiles: [toPoint(prod), toPoint(dock)] });
		}
	}

	return routes;
}
