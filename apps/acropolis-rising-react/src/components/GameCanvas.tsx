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
  /** When true the simulation is paused; freeze the cart animation. */
  paused: boolean;
  onTileClick: (x: number, y: number) => void;
  onCancelBuild: () => void;
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

/** Draws a little market cart (body + two wheels) centred on a pixel point. */
function drawCart(ctx: CanvasRenderingContext2D, px: number, py: number) {
  ctx.fillStyle = '#3a2c1c';
  ctx.beginPath();
  ctx.arc(px - 4, py + 4, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(px + 4, py + 4, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d9a441';
  roundRect(ctx, px - 6, py - 5, 12, 8, 2);
  ctx.fill();
  ctx.strokeStyle = '#7a531f';
  ctx.lineWidth = 1;
  ctx.stroke();
}

const CART_SPEED = 2.2; // path tiles per second

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
  paused,
  onTileClick,
  onCancelBuild,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cartCanvasRef = useRef<HTMLCanvasElement>(null);

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

  // Animated layer: market carts ferrying food along the delivery routes.
  useEffect(() => {
    const canvas = cartCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const draw = (elapsed: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < cartRoutes.length; i++) {
        const tiles = cartRoutes[i].tiles;
        if (tiles.length < 2) continue;
        // stagger carts so they don't march in lockstep
        const pos = cartPosition(tiles, elapsed * CART_SPEED + i * 0.7);
        drawCart(ctx, pos.x, pos.y);
      }
    };

    if (paused) {
      draw(0); // one frozen frame while paused
      return;
    }

    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => {
      draw((now - start) / 1000);
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
