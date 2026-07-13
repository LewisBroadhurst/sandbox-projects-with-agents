import { describe, expect, it } from 'vitest';
import { COLS, ROWS } from './data';
import { generateMap } from './map';
import { makeRng } from './rng';

describe('generateMap', () => {
  it('fills the whole grid', () => {
    const map = generateMap(makeRng(1));
    expect(map).toHaveLength(COLS * ROWS);
    map.forEach((t, i) => {
      expect(t.x).toBe(i % COLS);
      expect(t.y).toBe(Math.floor(i / COLS));
      expect(t.building).toBeNull();
    });
  });

  it('is deterministic for a given seed', () => {
    const a = generateMap(makeRng(42)).map((t) => t.terrain);
    const b = generateMap(makeRng(42)).map((t) => t.terrain);
    expect(a).toEqual(b);
  });

  it('produces different terrain for different seeds', () => {
    const a = generateMap(makeRng(1)).map((t) => t.terrain);
    const b = generateMap(makeRng(2)).map((t) => t.terrain);
    expect(a).not.toEqual(b);
  });
});
