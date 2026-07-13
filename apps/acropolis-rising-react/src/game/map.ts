import { COLS, ROWS } from './data';
import type { Rng } from './rng';
import type { Terrain, Tile } from './types';

export function generateMap(rng: Rng): Tile[] {
  const map: Tile[] = [];
  for (let y = 0; y < ROWS; y++)
    for (let x = 0; x < COLS; x++)
      map.push({ x, y, terrain: 'grass', building: null });
  const at = (x: number, y: number) => map[y * COLS + x];

  // carve coastline on the right edge, jagged
  for (let y = 0; y < ROWS; y++) {
    const depth =
      3 + Math.floor(Math.sin(y * 0.7) * 1.5) + Math.floor(rng.next() * 2);
    for (let x = COLS - 1; x >= COLS - depth; x--) {
      if (x >= 0) at(x, y).terrain = 'water';
    }
  }

  // random walk clusters
  function cluster(terrain: Terrain, seeds: number, len: number) {
    for (let s = 0; s < seeds; s++) {
      let x = Math.floor(rng.next() * (COLS - 6)) + 1;
      let y = Math.floor(rng.next() * ROWS);
      for (let i = 0; i < len; i++) {
        if (x >= 0 && x < COLS - 4 && y >= 0 && y < ROWS) {
          const t = at(x, y);
          if (t.terrain === 'grass') t.terrain = terrain;
        }
        x += Math.floor(rng.next() * 3) - 1;
        y += Math.floor(rng.next() * 3) - 1;
        x = Math.max(0, Math.min(COLS - 5, x));
        y = Math.max(0, Math.min(ROWS - 1, y));
      }
    }
  }

  cluster('forest', 4, 14);
  cluster('hill', 3, 7);
  cluster('mountain', 2, 7);

  // mark coast: grass tiles adjacent to water
  for (let y = 0; y < ROWS; y++)
    for (let x = 0; x < COLS; x++) {
      const t = at(x, y);
      if (t.terrain === 'grass') {
        const neighbors = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ];
        for (const [dx, dy] of neighbors) {
          const nx = x + dx,
            ny = y + dy;
          if (
            nx >= 0 &&
            nx < COLS &&
            ny >= 0 &&
            ny < ROWS &&
            at(nx, ny).terrain === 'water'
          ) {
            t.terrain = 'coast';
            break;
          }
        }
      }
    }
  return map;
}
