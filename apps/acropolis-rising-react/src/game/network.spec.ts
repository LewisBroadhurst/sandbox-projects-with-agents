import { describe, expect, it } from 'vitest';
import { BUILDINGS, COLS, ROWS } from './data';
import { computeCoverage } from './network';
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
