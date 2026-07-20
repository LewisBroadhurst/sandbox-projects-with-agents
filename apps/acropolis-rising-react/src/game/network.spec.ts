import { describe, expect, it } from 'vitest';
import { BUILDINGS, COLS, ROWS } from './data';
import { computeCartRoutes, computeCoverage, computeStorageAccess } from './network';
import type { BuildingId, Tile } from './types';

/** A flat grass grid with no buildings. */
function grid(): Tile[] {
	const m: Tile[] = [];
	for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) m.push({ x, y, terrain: 'grass', building: null });
	return m;
}

const put = (m: Tile[], x: number, y: number, b: BuildingId) => {
	m[y * COLS + x] = { ...m[y * COLS + x], building: b };
};
const houseCap = BUILDINGS.house.capacity ?? 0;

describe('computeCoverage', () => {
	it('counts every house in totalCapacity but services none without an Agora', () => {
		const m = grid();
		put(m, 1, 0, 'house');
		put(m, 2, 0, 'house');
		const cov = computeCoverage(m);
		expect(cov.houseCount).toBe(2);
		expect(cov.totalCapacity).toBe(2 * houseCap);
		expect(cov.agoraCount).toBe(0);
		expect(cov.servicedCount).toBe(0);
		expect(cov.servicedCapacity).toBe(0);
	});

	it('services a house on the Agora forecourt (directly adjacent, no path needed)', () => {
		const m = grid();
		put(m, 5, 5, 'agora');
		put(m, 4, 5, 'house');
		const cov = computeCoverage(m);
		expect(cov.servicedHouses.has(5 * COLS + 4)).toBe(true);
		expect(cov.servicedCapacity).toBe(houseCap);
	});

	it('carries food to a distant house along a chain of paths within range', () => {
		const m = grid();
		put(m, 0, 0, 'agora');
		for (let x = 1; x <= 6; x++) put(m, x, 0, 'road'); // 6 path steps out
		put(m, 6, 1, 'house'); // beside the path tile 6 steps away
		const cov = computeCoverage(m, 6);
		expect(cov.servicedHouses.has(1 * COLS + 6)).toBe(true);
	});

	it('does not reach a house beyond the path range', () => {
		const m = grid();
		put(m, 0, 0, 'agora');
		for (let x = 1; x <= 7; x++) put(m, x, 0, 'road'); // path continues past range
		put(m, 8, 0, 'house'); // only reachable via the 7th path tile (out of range)
		const cov = computeCoverage(m, 6);
		expect(cov.servicedHouses.has(0 * COLS + 8)).toBe(false);
		expect(cov.servicedCount).toBe(0);
	});

	it('does not service a house separated from the network by a gap', () => {
		const m = grid();
		put(m, 0, 0, 'agora');
		put(m, 1, 0, 'road');
		// gap at (2,0): no path tile there
		put(m, 3, 0, 'road');
		put(m, 3, 1, 'house');
		const cov = computeCoverage(m, 6);
		expect(cov.servicedHouses.has(1 * COLS + 3)).toBe(false);
	});
});

describe('computeStorageAccess', () => {
	it('connects a producer sitting beside a Storehouse (no path needed)', () => {
		const m = grid();
		put(m, 5, 5, 'storehouse');
		put(m, 4, 5, 'lumber');
		const acc = computeStorageAccess(m);
		expect(acc.connected.has(5 * COLS + 4)).toBe(true);
		expect(acc.connectedCount).toBe(1);
		expect(acc.producerCount).toBe(1);
		expect(acc.storehouseCount).toBe(1);
	});

	it('connects a producer linked to a Storehouse along a path within range', () => {
		const m = grid();
		put(m, 0, 0, 'storehouse');
		for (let x = 1; x <= 4; x++) put(m, x, 0, 'road');
		put(m, 4, 1, 'farm'); // beside the path tile 4 steps out
		const acc = computeStorageAccess(m, 8);
		expect(acc.connected.has(1 * COLS + 4)).toBe(true);
	});

	it('leaves a producer with no Storehouse route disconnected', () => {
		const m = grid();
		put(m, 3, 3, 'quarry'); // isolated, no storehouse
		const acc = computeStorageAccess(m);
		expect(acc.producerCount).toBe(1);
		expect(acc.connectedCount).toBe(0);
	});

	it('does not connect a producer beyond the Storehouse range', () => {
		const m = grid();
		put(m, 0, 0, 'storehouse');
		for (let x = 1; x <= 9; x++) put(m, x, 0, 'road'); // path runs past range 8
		put(m, 9, 1, 'mine'); // reachable only via the out-of-range 9th tile
		const acc = computeStorageAccess(m, 8);
		expect(acc.connected.has(1 * COLS + 9)).toBe(false);
	});
});

describe('computeCartRoutes', () => {
	it('has no routes without an Agora', () => {
		const m = grid();
		put(m, 1, 0, 'house');
		expect(computeCartRoutes(m)).toEqual([]);
	});

	it('makes a direct 2-point route for a forecourt house', () => {
		const m = grid();
		put(m, 5, 5, 'agora');
		put(m, 4, 5, 'house');
		const routes = computeCartRoutes(m);
		expect(routes).toHaveLength(1);
		expect(routes[0].tiles).toEqual([
			{ x: 5, y: 5 },
			{ x: 4, y: 5 },
		]);
	});

	it('routes along the path from the Agora to a distant house', () => {
		const m = grid();
		put(m, 0, 0, 'agora');
		for (let x = 1; x <= 3; x++) put(m, x, 0, 'road');
		put(m, 3, 1, 'house');
		const routes = computeCartRoutes(m, 6);
		expect(routes).toHaveLength(1);
		const tiles = routes[0].tiles;
		expect(tiles[0]).toEqual({ x: 0, y: 0 }); // starts at the Agora
		expect(tiles[tiles.length - 1]).toEqual({ x: 3, y: 1 }); // ends at the house
		expect(tiles.length).toBeGreaterThan(2); // walks the path between
	});
});
