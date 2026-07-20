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
 * A producer can store its goods if it sits beside a Storehouse or beside a
 * path tile within range of one. Without a route to storage it produces
 * nothing — goods have nowhere to go.
 */
export function computeStorageAccess(map: Tile[], range = 8): StorageAccess {
	const flood = floodPaths(map, b => b === 'storehouse', range);
	const connected = new Set<number>();

	let producerCount = 0;
	let storehouseCount = 0;

	for (const t of map) {
		if (t.building === 'storehouse') storehouseCount++;
		if (!t.building || !isProducer(t.building)) continue;
		producerCount++;
		const here = idx(t.x, t.y);
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
// Cart routes: animated deliveries Agora -> houses
// ---------------------------------------------------------------------------

/** A delivery route as a polyline of tile coordinates from an Agora to a house. */
export interface CartRoute {
	tiles: Point[];
}

/** Cap on how many carts we draw per Agora, to keep the map legible and cheap. */
const MAX_ROUTES_PER_AGORA = 4;

/**
 * Builds a walkable polyline (Agora → path tiles → house) for a sample of the
 * houses each Agora feeds, used to animate market carts along the network.
 */
export function computeCartRoutes(map: Tile[], range = 6): CartRoute[] {
	const flood = floodPaths(map, b => b === 'agora', range);
	const routes: CartRoute[] = [];
	const perAgora = new Map<number, number>();
	const toPoint = (k: number): Point => ({ x: k % COLS, y: (k - (k % COLS)) / COLS });

	for (const t of map) {
		if (t.building !== 'house') continue;
		// Find the reachable path tile (or Agora) that feeds this house.
		let feederRoad = -1;
		let forecourtAgora = -1;
		for (const [dx, dy] of DIRS) {
			const nx = t.x + dx,
				ny = t.y + dy;
			if (!inBounds(nx, ny)) continue;
			const nk = idx(nx, ny);
			const n = map[nk];
			if (n.building === 'agora') {
				forecourtAgora = nk;
				break;
			}
			if (n.building === 'road' && flood.dist[nk] < Infinity && (feederRoad === -1 || flood.dist[nk] < flood.dist[feederRoad])) {
				feederRoad = nk;
			}
		}

		const house = idx(t.x, t.y);
		if (forecourtAgora !== -1) {
			const count = perAgora.get(forecourtAgora) ?? 0;
			if (count >= MAX_ROUTES_PER_AGORA) continue;
			perAgora.set(forecourtAgora, count + 1);
			routes.push({ tiles: [toPoint(forecourtAgora), toPoint(house)] });
			continue;
		}
		if (feederRoad === -1) continue;

		const agora = flood.source[feederRoad];
		if (agora === -1) continue;
		const count = perAgora.get(agora) ?? 0;
		if (count >= MAX_ROUTES_PER_AGORA) continue;
		perAgora.set(agora, count + 1);

		// Walk parents from the feeder road back to the seed, then order the
		// polyline Agora -> ...roads... -> house.
		const roadChain: number[] = [];
		for (let r = feederRoad; r !== -1; r = flood.parent[r]) roadChain.push(r);
		roadChain.reverse();
		routes.push({ tiles: [toPoint(agora), ...roadChain.map(toPoint), toPoint(house)] });
	}

	return routes;
}
