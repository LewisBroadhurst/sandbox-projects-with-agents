import { describe, expect, it } from 'vitest';
import { makeRng } from './rng';

describe('rng', () => {
  it('is deterministic for a given seed', () => {
    const a = makeRng(12345);
    const b = makeRng(12345);
    const seqA = Array.from({ length: 20 }, () => a.next());
    const seqB = Array.from({ length: 20 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('produces different sequences for different seeds', () => {
    const a = makeRng(1);
    const b = makeRng(2);
    expect(a.next()).not.toEqual(b.next());
  });

  it('returns values within [0, 1)', () => {
    const rng = makeRng(99);
    for (let i = 0; i < 1000; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('can resume from a persisted state', () => {
    const a = makeRng(7);
    a.next();
    a.next();
    const resumed = makeRng(0);
    resumed.state = a.state;
    expect(resumed.next()).toEqual(a.next());
  });
});
