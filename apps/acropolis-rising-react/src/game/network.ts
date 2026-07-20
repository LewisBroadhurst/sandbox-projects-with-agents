import { BUILDINGS, COLS, ROWS } from './data';
import type { Tile } from './types';

const DIRS = [
	[1, 0],
	[-1, 0],
	[0, 1],
	[0, -1],
] as const;

const inBounds = (x: number, y: number) => x >= 0 && x < COLS && y >= 0 && y < ROWS;
const idx = (x: number, y: number) => y * COLS + x;

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
 * Flood-fills the path network out of every Agora and marks the houses its
 * traders can walk to. An Agora reaches a house if the house is next to the
 * Agora itself (its forecourt) or next to a path tile within `range` steps of
 * the Agora along connected paths. Uniform-cost BFS, so each path tile keeps
 * its shortest walking distance from the nearest Agora.
 */
export function computeCoverage(map: Tile[], range = 6): FoodCoverage {
	const houseCap = BUILDINGS.house.capacity ?? 0;
	const serviced = new Set<number>();
	const roadDist = new Array<number>(COLS * ROWS).fill(Infinity);
	const queue: number[] = [];

	let houseCount = 0;
	let totalCapacity = 0;
	let agoraCount = 0;

	// Seed the search: every Agora feeds its immediate neighbours and pushes any
	// adjacent path tile onto the frontier at distance 1.
	for (const t of map) {
		if (t.building === 'house') {
			houseCount++;
			totalCapacity += houseCap;
		} else if (t.building === 'agora') {
			agoraCount++;
			for (const [dx, dy] of DIRS) {
				const nx = t.x + dx,
					ny = t.y + dy;
				if (!inBounds(nx, ny)) continue;
				const nk = idx(nx, ny);
				const n = map[nk];
				if (n.building === 'house') serviced.add(nk);
				else if (n.building === 'road' && roadDist[nk] > 1) {
					roadDist[nk] = 1;
					queue.push(nk);
				}
			}
		}
	}

	// Walk the path network, servicing houses beside each reachable path tile.
	for (let head = 0; head < queue.length; head++) {
		const cur = queue[head];
		const cx = cur % COLS;
		const cy = (cur - cx) / COLS;
		const d = roadDist[cur];
		for (const [dx, dy] of DIRS) {
			const nx = cx + dx,
				ny = cy + dy;
			if (!inBounds(nx, ny)) continue;
			const nk = idx(nx, ny);
			const n = map[nk];
			if (n.building === 'house') serviced.add(nk);
			else if (n.building === 'road' && d < range && roadDist[nk] > d + 1) {
				roadDist[nk] = d + 1;
				queue.push(nk);
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
