import { describe, expect, it } from 'vitest';
import { bulldoze, canAfford, castBlessing, newGameState, tick, tryPlace } from './simulation';
import type { GameState } from './types';

/** A fresh state with a flat, empty grass map for predictable placement. */
function blankState(seed = 1): GameState {
	const s = newGameState(seed);
	s.map = s.map.map(t => ({ ...t, terrain: 'grass', building: null }));
	return s;
}

describe('canAfford', () => {
	it('accepts affordable costs and rejects unaffordable ones', () => {
		expect(canAfford(blankState(), { gold: 100 })).toBe(true);
		expect(canAfford(blankState(), { gold: 1000 })).toBe(false);
	});
});

describe('tryPlace', () => {
	it('places a building and pays its cost', () => {
		const { state } = tryPlace(blankState(), 'house', 0, 0);
		expect(state.map[0].building).toBe('house');
		expect(state.resources.gold).toBe(138); // 150 - 12
		expect(state.resources.wood).toBe(25); // 40 - 15
	});

	it('rejects an already-occupied tile without changing state', () => {
		const placed = tryPlace(blankState(), 'house', 0, 0).state;
		const result = tryPlace(placed, 'house', 0, 0);
		expect(result.state).toBe(placed);
		expect(result.toasts[0]).toMatch(/already built/i);
	});

	it('rejects placement on disallowed terrain', () => {
		const result = tryPlace(blankState(), 'lumber', 0, 0); // needs forest
		expect(result.toasts[0]).toMatch(/cannot be built/i);
	});

	it('rejects placement when resources are insufficient', () => {
		const s = blankState();
		s.resources.gold = 0;
		const result = tryPlace(s, 'house', 0, 0);
		expect(result.toasts[0]).toMatch(/not enough/i);
	});

	it('applies a storehouse storage bonus', () => {
		const { state } = tryPlace(blankState(), 'storehouse', 0, 0);
		expect(state.storageCap).toBe(500); // 300 + 200
	});
});

describe('bulldoze', () => {
	it('clears the tile and refunds half the cost', () => {
		const placed = tryPlace(blankState(), 'house', 0, 0).state;
		const { state } = bulldoze(placed, 0, 0);
		expect(state.map[0].building).toBeNull();
		expect(state.resources.gold).toBe(144); // 138 + 6
		expect(state.resources.wood).toBeCloseTo(32.5, 5); // 25 + 7.5
	});

	it('never lowers storage capacity below the base of 300', () => {
		const placed = tryPlace(blankState(), 'storehouse', 0, 0).state;
		const { state } = bulldoze(placed, 0, 0);
		expect(state.storageCap).toBe(300);
	});
});

describe('castBlessing', () => {
	it('grants an instant gold blessing', () => {
		const s = blankState();
		s.resources.favor = 100;
		const { state, toasts } = castBlessing(s, 'zeus');
		expect(state.resources.favor).toBe(20); // 100 - 80
		expect(state.resources.gold).toBe(400); // 150 + 250
		expect(toasts[0]).toMatch(/gold/i);
	});

	it('grants an instant happiness blessing', () => {
		const s = blankState();
		s.resources.favor = 50;
		const { state } = castBlessing(s, 'athena');
		expect(state.happiness).toBe(75); // 55 + 20
	});

	it('activates a timed blessing and blocks re-casting while active', () => {
		const s = blankState();
		s.resources.favor = 60;
		s.tickCount = 5;
		const { state } = castBlessing(s, 'poseidon');
		expect(state.resources.favor).toBe(10);
		expect(state.blessingsActive.poseidon).toBe(65); // 5 + 60
		const recast = castBlessing(state, 'poseidon');
		expect(recast.state).toBe(state);
	});

	it('is a no-op when favor is insufficient', () => {
		const s = blankState();
		s.resources.favor = 10;
		const result = castBlessing(s, 'zeus');
		expect(result.state).toBe(s);
	});
});

describe('tick', () => {
	it('produces resources at the building rate under full employment', () => {
		const s = blankState();
		s.map[0] = { ...s.map[0], terrain: 'forest', building: 'lumber' };
		const { state } = tick(s);
		expect(state.resources.wood).toBeCloseTo(42.2, 5); // 40 + 2.2
	});

	it('doubles production for a matching active blessing (reads Blessing.mult)', () => {
		const base = blankState();
		base.map[0] = { ...base.map[0], terrain: 'hill', building: 'mine' };
		const plain = tick(base).state.resources.copper;
		const blessed = tick({ ...base, blessingsActive: { hephaestus: 60 } }).state.resources.copper;
		expect(plain).toBeCloseTo(1.5, 5);
		expect(blessed).toBeCloseTo(3.0, 5); // hephaestus mult of 2 from data
	});

	it('awards a milestone once its condition is met', () => {
		const s = blankState();
		s.map[0] = { ...s.map[0], building: 'house' };
		const { state, toasts } = tick(s);
		expect(state.milestonesDone['m1']).toBe(true);
		expect(toasts.some(t => /Milestone/.test(t))).toBe(true);
	});

	it('is fully deterministic for a given seed', () => {
		let a = newGameState(777);
		let b = newGameState(777);
		for (let i = 0; i < 50; i++) {
			a = tick(a).state;
			b = tick(b).state;
		}
		expect(a).toEqual(b);
	});
});
