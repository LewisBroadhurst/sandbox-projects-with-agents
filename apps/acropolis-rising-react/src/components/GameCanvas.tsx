import { useEffect, useRef } from 'react';
import { BUILDINGS, COLS, ROWS, TERRAIN_COLOR, TILE } from '../game/data';
import type { CartRoute } from '../game/network';
import { isProducer } from '../game/network';
import type { BuildingId, Point, Tile } from '../game/types';

interface GameCanvasProps {
  map: Tile[];
  selectedTile: Point | null;
  /** Tile indices of houses an Agora reaches with food (from computeCoverage). */
  servicedHouses: Set<number>;
  /** Tile indices of producers linked to a Storehouse (from computeStorageAccess). */
  connectedProducers: Set<number>;
  /** Delivery polylines to animate market carts along (from computeCartRoutes). */
  cartRoutes: CartRoute[];
  /** Current population; changes drive citizens walking in (growth) or out (decline). */
  population: number;
  /** When true the simulation is paused; freeze the animations. */
  paused: boolean;
  onTileClick: (x: number, y: number) => void;
  onCancelBuild: () => void;
}

/** A citizen sprite walking between the map edge and a house. */
interface Walker {
  from: Point;
  to: Point;
  bornAt: number; // performance.now() timestamp the walk starts
  dur: number;
  kind: 'arrive' | 'leave';
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function isRoad(map: Tile[], x: number, y: number): boolean {
  if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return false;
  return map[y * COLS + x].building === 'road';
}

/** Draws a path tile as a node with arms reaching toward adjacent paths so the
    network reads as one connected road rather than scattered squares. */
function drawRoad(ctx: CanvasRenderingContext2D, x: number, y: number, map: Tile[]) {
  const px = x * TILE,
    py = y * TILE;
  const cx = px + TILE / 2,
    cy = py + TILE / 2;
  const half = 7; // half-width of the path ribbon
  ctx.fillStyle = '#6b5942';
  // central node
  ctx.fillRect(cx - half, cy - half, half * 2, half * 2);
  // arms toward connected neighbours
  if (isRoad(map, x + 1, y)) ctx.fillRect(cx - half, cy - half, TILE / 2 + half, half * 2);
  if (isRoad(map, x - 1, y)) ctx.fillRect(px, cy - half, TILE / 2 + half, half * 2);
  if (isRoad(map, x, y + 1)) ctx.fillRect(cx - half, cy - half, half * 2, TILE / 2 + half);
  if (isRoad(map, x, y - 1)) ctx.fillRect(cx - half, py, half * 2, TILE / 2 + half);
}

/** Small coloured dot used to flag a building that is missing a connection. */
function warnDot(ctx: CanvasRenderingContext2D, px: number, py: number, color: string) {
  ctx.beginPath();
  ctx.arc(px + TILE - 8, py + 8, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawBuilding(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  bId: BuildingId,
  map: Tile[],
  unservicedHouse: boolean,
  disconnectedProducer: boolean
) {
  const b = BUILDINGS[bId];
  const px = x * TILE,
    py = y * TILE;
  if (bId === 'road') {
    drawRoad(ctx, x, y, map);
    return;
  }
  ctx.fillStyle = b.god ? '#e8c14a' : '#ede4cb';
  ctx.strokeStyle = '#2b2622';
  ctx.lineWidth = 1.5;
  roundRect(ctx, px + 3, py + 3, TILE - 6, TILE - 6, 6);
  ctx.fill();
  ctx.stroke();
  ctx.font = '19px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(b.icon, px + TILE / 2, py + TILE / 2 + 1);
  // red: house no Agora feeds; orange: producer with no route to a Storehouse
  if (unservicedHouse) warnDot(ctx, px, py, '#c1502e');
  else if (disconnectedProducer) warnDot(ctx, px, py, '#d98a2b');
}

/** Draws a little cart (body + two wheels) centred on a pixel point. Food carts
    (Agora → house) are ochre; goods carts (producer → Storehouse) are wood-brown. */
function drawCart(ctx: CanvasRenderingContext2D, px: number, py: number, kind: 'food' | 'goods') {
  ctx.fillStyle = '#3a2c1c';
  ctx.beginPath();
  ctx.arc(px - 4, py + 4, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(px + 4, py + 4, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = kind === 'goods' ? '#9c6b2f' : '#e0b34a';
  roundRect(ctx, px - 6, py - 5, 12, 8, 2);
  ctx.fill();
  ctx.strokeStyle = '#5c3d16';
  ctx.lineWidth = 1;
  ctx.stroke();
}

const CART_SPEED = 2.2; // path tiles per second

const WALK_DUR = 2600; // ms for a citizen to cross between edge and house
const MAX_WALKERS = 16; // concurrent citizen sprites
const MAX_SPAWN_PER_EVENT = 4; // sprites spawned for a single population change
const ANIMATE_DELTA_LIMIT = 6; // ignore big jumps (load / new city), not real migration

/** Draws a tiny toga-clad citizen. Arrivals are bright; departures are muted. */
function drawWalker(ctx: CanvasRenderingContext2D, x: number, y: number, kind: 'arrive' | 'leave') {
  const tunic = kind === 'leave' ? '#9a8f7a' : '#efe0b6';
  const trim = kind === 'leave' ? '#6f6656' : '#b5642f';
  ctx.fillStyle = tunic;
  ctx.beginPath();
  ctx.moveTo(x - 3, y + 5);
  ctx.lineTo(x + 3, y + 5);
  ctx.lineTo(x + 2, y - 1);
  ctx.lineTo(x - 2, y - 1);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = trim;
  ctx.lineWidth = 0.75;
  ctx.stroke();
  ctx.fillStyle = '#e8c9a0';
  ctx.beginPath();
  ctx.arc(x, y - 3, 2.4, 0, Math.PI * 2);
  ctx.fill();
}

/** Nearest off-canvas edge point to a pixel position (where a citizen enters/exits). */
function edgePoint(p: Point): Point {
  const w = COLS * TILE,
    h = ROWS * TILE;
  const dl = p.x,
    dr = w - p.x,
    dt = p.y,
    db = h - p.y;
  const m = Math.min(dl, dr, dt, db);
  if (m === dl) return { x: -8, y: p.y };
  if (m === dr) return { x: w + 8, y: p.y };
  if (m === dt) return { x: p.x, y: -8 };
  return { x: p.x, y: h + 8 };
}

/** Position along a route's polyline at time `t`, walking out and back. */
function cartPosition(tiles: Point[], t: number): Point {
  const segCount = tiles.length - 1;
  const phase = t % (segCount * 2);
  const s = phase <= segCount ? phase : segCount * 2 - phase; // ping-pong
  const seg = Math.min(segCount - 1, Math.floor(s));
  const f = s - seg;
  const a = tiles[seg],
    b = tiles[seg + 1];
  return {
    x: (a.x + (b.x - a.x) * f) * TILE + TILE / 2,
    y: (a.y + (b.y - a.y) * f) * TILE + TILE / 2,
  };
}

export function GameCanvas({
  map,
  selectedTile,
  servicedHouses,
  connectedProducers,
  cartRoutes,
  population,
  paused,
  onTileClick,
  onCancelBuild,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cartCanvasRef = useRef<HTMLCanvasElement>(null);
  const walkersRef = useRef<Walker[]>([]);
  const prevPopRef = useRef(population);
  // Kept in refs so the population effect can read the latest map/coverage
  // without re-running on every map change.
  const mapRef = useRef(map);
  mapRef.current = map;
  const servicedRef = useRef(servicedHouses);
  servicedRef.current = servicedHouses;

  // Spawn citizens whenever the population changes: walking toward a fed house
  // when it grows, or off the nearest map edge when the city shrinks.
  useEffect(() => {
    const prev = prevPopRef.current;
    prevPopRef.current = population;
    const delta = Math.round(population - prev);
    if (delta === 0 || Math.abs(delta) > ANIMATE_DELTA_LIMIT) return;

    const houses: { x: number; y: number; serviced: boolean }[] = [];
    mapRef.current.forEach((t, i) => {
      if (t.building === 'house') houses.push({ x: t.x, y: t.y, serviced: servicedRef.current.has(i) });
    });
    const center: Point = { x: (COLS / 2) * TILE, y: (ROWS / 2) * TILE };
    const houseCenter = (h: { x: number; y: number }): Point => ({ x: h.x * TILE + TILE / 2, y: h.y * TILE + TILE / 2 });

    const arrive = delta > 0;
    // Arrivals head for fed houses; departures leave from the least-served ones.
    const preferred = arrive ? houses.filter(h => h.serviced) : houses.filter(h => !h.serviced);
    const pool = preferred.length ? preferred : houses;

    const now = performance.now();
    const spawned: Walker[] = [];
    for (let k = 0; k < Math.min(Math.abs(delta), MAX_SPAWN_PER_EVENT); k++) {
      const anchor = pool.length ? houseCenter(pool[Math.floor(Math.random() * pool.length)]) : center;
      const edge = edgePoint(anchor);
      spawned.push({
        from: arrive ? edge : anchor,
        to: arrive ? anchor : edge,
        bornAt: now + k * 200, // stagger so they don't overlap exactly
        dur: WALK_DUR,
        kind: arrive ? 'arrive' : 'leave',
      });
    }
    walkersRef.current = [...walkersRef.current, ...spawned].slice(-MAX_WALKERS);
  }, [population]);

  // Static layer: terrain, paths, buildings, connection markers, selection.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const i = y * COLS + x;
        const t = map[i];
        ctx.fillStyle = TERRAIN_COLOR[t.terrain];
        ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
        // subtle texture dots
        ctx.fillStyle = 'rgba(0,0,0,0.05)';
        if ((x + y) % 2 === 0) ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
        ctx.strokeStyle = 'rgba(0,0,0,0.08)';
        ctx.strokeRect(x * TILE, y * TILE, TILE, TILE);

        if (t.building) {
          const unserviced = t.building === 'house' && !servicedHouses.has(i);
          const disconnected = isProducer(t.building) && !connectedProducers.has(i);
          drawBuilding(ctx, x, y, t.building, map, unserviced, disconnected);
        }
      }
    }
    if (selectedTile) {
      ctx.strokeStyle = '#e8c14a';
      ctx.lineWidth = 3;
      ctx.strokeRect(
        selectedTile.x * TILE + 1.5,
        selectedTile.y * TILE + 1.5,
        TILE - 3,
        TILE - 3
      );
      ctx.lineWidth = 1;
    }
  }, [map, selectedTile, servicedHouses, connectedProducers]);

  // Animated layer: delivery carts along routes + citizens walking in and out.
  useEffect(() => {
    const canvas = cartCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const startMs = performance.now();
    const drawFrame = (nowMs: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // carts
      const elapsed = (nowMs - startMs) / 1000;
      for (let i = 0; i < cartRoutes.length; i++) {
        const route = cartRoutes[i];
        if (route.tiles.length < 2) continue;
        // stagger carts so they don't march in lockstep
        const pos = cartPosition(route.tiles, elapsed * CART_SPEED + i * 0.7);
        drawCart(ctx, pos.x, pos.y, route.kind);
      }
      // citizens (dropping any that have completed their walk)
      const alive: Walker[] = [];
      for (const w of walkersRef.current) {
        const raw = (nowMs - w.bornAt) / w.dur;
        if (raw >= 1) continue;
        const t = Math.max(0, raw);
        drawWalker(ctx, w.from.x + (w.to.x - w.from.x) * t, w.from.y + (w.to.y - w.from.y) * t, w.kind);
        alive.push(w);
      }
      walkersRef.current = alive;
    };

    if (paused) {
      drawFrame(performance.now()); // one frozen frame while paused
      return;
    }

    let raf = 0;
    const loop = (now: number) => {
      drawFrame(now);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [cartRoutes, paused]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width,
      scaleY = canvas.height / rect.height;
    const x = Math.floor(((e.clientX - rect.left) * scaleX) / TILE);
    const y = Math.floor(((e.clientY - rect.top) * scaleY) / TILE);
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return;
    onTileClick(x, y);
  };

  return (
    <div id="canvasWrap">
      <div id="canvasStack">
        <canvas
          ref={canvasRef}
          id="gameCanvas"
          width={COLS * TILE}
          height={ROWS * TILE}
          onClick={handleClick}
          onContextMenu={(e) => {
            e.preventDefault();
            onCancelBuild();
          }}
        />
        <canvas
          ref={cartCanvasRef}
          id="cartCanvas"
          width={COLS * TILE}
          height={ROWS * TILE}
        />
      </div>
    </div>
  );
}
