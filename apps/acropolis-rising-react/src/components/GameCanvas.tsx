import { useEffect, useRef } from 'react';
import { BUILDINGS, COLS, ROWS, TERRAIN_COLOR, TILE } from '../game/data';
import type { BuildingId, Point, Tile } from '../game/types';

interface GameCanvasProps {
  map: Tile[];
  selectedTile: Point | null;
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

function drawBuilding(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  bId: BuildingId
) {
  const b = BUILDINGS[bId];
  const px = x * TILE,
    py = y * TILE;
  if (bId === 'road') {
    ctx.fillStyle = '#5c4a33';
    ctx.fillRect(px + 6, py + 6, TILE - 12, TILE - 12);
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
}

export function GameCanvas({
  map,
  selectedTile,
  onTileClick,
  onCancelBuild,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const t = map[y * COLS + x];
        ctx.fillStyle = TERRAIN_COLOR[t.terrain];
        ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
        // subtle texture dots
        ctx.fillStyle = 'rgba(0,0,0,0.05)';
        if ((x + y) % 2 === 0) ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
        ctx.strokeStyle = 'rgba(0,0,0,0.08)';
        ctx.strokeRect(x * TILE, y * TILE, TILE, TILE);

        if (t.building) {
          drawBuilding(ctx, x, y, t.building);
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
  }, [map, selectedTile]);

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
    </div>
  );
}
