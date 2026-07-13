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
