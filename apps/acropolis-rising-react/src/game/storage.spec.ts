import { afterEach, describe, expect, it } from 'vitest';
import { newGameState } from './simulation';
import { loadSavedState, saveState, SAVE_VERSION } from './storage';

const SAVE_KEY = 'acropolis-save';

describe('storage', () => {
	afterEach(() => localStorage.clear());

	it('round-trips a valid game state', () => {
		const s = newGameState(123);
		expect(saveState(s)).toBe(true);
		expect(loadSavedState()).toEqual(s);
	});

	// Regression guard for issue #5: on disk the save is a { v, state } envelope,
	// but loadSavedState must return the *unwrapped* state. If it ever returned the
	// envelope again, `state.resources` would be undefined and the UI would crash.
	it('unwraps the envelope: returns the state, not the { v, state } wrapper', () => {
		const s = newGameState(5);
		saveState(s);

		const raw = JSON.parse(localStorage.getItem(SAVE_KEY) as string);
		expect(Object.keys(raw).sort()).toEqual(['state', 'v']);

		const loaded = loadSavedState();
		expect(loaded).not.toBeNull();
		// The load result is the state itself, with a real resources object.
		expect(loaded?.resources).toBeDefined();
		expect(loaded?.resources.gold).toBe(s.resources.gold);
		// And it is NOT the envelope.
		expect((loaded as unknown as Record<string, unknown>).v).toBeUndefined();
		expect((loaded as unknown as Record<string, unknown>).state).toBeUndefined();
	});

	it('returns null when there is no save', () => {
		expect(loadSavedState()).toBeNull();
	});

	it('rejects a save from a different version', () => {
		const s = newGameState(1);
		localStorage.setItem(SAVE_KEY, JSON.stringify({ v: SAVE_VERSION + 1, state: s }));
		expect(loadSavedState()).toBeNull();
	});

	it('rejects an unversioned (legacy) save', () => {
		const s = newGameState(1);
		localStorage.setItem(SAVE_KEY, JSON.stringify(s));
		expect(loadSavedState()).toBeNull();
	});

	it('rejects corrupt JSON', () => {
		localStorage.setItem(SAVE_KEY, '{not json');
		expect(loadSavedState()).toBeNull();
	});

	it('rejects a structurally invalid state', () => {
		const s = newGameState(1) as unknown as Record<string, unknown>;
		delete s.resources;
		localStorage.setItem(SAVE_KEY, JSON.stringify({ v: SAVE_VERSION, state: s }));
		expect(loadSavedState()).toBeNull();
	});

	it('rejects a state with a NaN resource', () => {
		const s = newGameState(1);
		s.resources.gold = NaN;
		localStorage.setItem(SAVE_KEY, JSON.stringify({ v: SAVE_VERSION, state: s }));
		// NaN serializes to null in JSON, which fails the finite-number check.
		expect(loadSavedState()).toBeNull();
	});
});
