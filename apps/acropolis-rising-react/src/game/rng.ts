/**
 * Small, fast, seedable PRNG (mulberry32). Deterministic: the same seed always
 * yields the same sequence, so maps and simulation runs are reproducible and
 * testable. The current `state` can be persisted and restored to resume a run
 * exactly where it left off.
 */
export interface Rng {
  /** Returns the next float in [0, 1). */
  next(): number;
  /** The internal generator state (a uint32); persist/restore to resume. */
  state: number;
}

export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  return {
    get state() {
      return a;
    },
    set state(v: number) {
      a = v >>> 0;
    },
    next() {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}

/** A fresh random uint32 seed, used when starting a brand-new game. */
export function randomSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0;
}
