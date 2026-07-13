import { COLS, RESOURCE_ORDER, ROWS } from './data';
import type { GameState, ResourceKey } from './types';

const SAVE_KEY = 'acropolis-save';

/** Bump whenever the GameState shape changes in a way older saves can't satisfy.
    Saves written by a different version are rejected rather than loaded blindly. */
export const SAVE_VERSION = 1;

interface SaveEnvelope {
  v: number;
  state: GameState;
}

function isFiniteNumber(x: unknown): x is number {
  return typeof x === 'number' && Number.isFinite(x);
}

function hasAllResources(r: unknown): r is Record<ResourceKey, number> {
  if (typeof r !== 'object' || r === null) return false;
  const rec = r as Record<string, unknown>;
  return RESOURCE_ORDER.every((k) => isFiniteNumber(rec[k]));
}

/** Structural check guarding against corrupt or stale saves so a bad payload
    starts a fresh game instead of poisoning the simulation with NaN/undefined. */
function isValidGameState(x: unknown): x is GameState {
  if (typeof x !== 'object' || x === null) return false;
  const s = x as Record<string, unknown>;
  if (!Array.isArray(s.map) || s.map.length !== COLS * ROWS) return false;
  if (!hasAllResources(s.resources)) return false;
  if (!hasAllResources(s.totalProduced)) return false;
  if (!isFiniteNumber(s.storageCap)) return false;
  if (!isFiniteNumber(s.population)) return false;
  if (!isFiniteNumber(s.happiness)) return false;
  if (!isFiniteNumber(s.tickCount)) return false;
  if (!isFiniteNumber(s.seed)) return false;
  if (!isFiniteNumber(s.rngState)) return false;
  if (typeof s.cityName !== 'string') return false;
  if (typeof s.blessingsActive !== 'object' || s.blessingsActive === null)
    return false;
  if (typeof s.milestonesDone !== 'object' || s.milestonesDone === null)
    return false;
  return true;
}

export function loadSavedState(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SaveEnvelope>;
    if (parsed?.v !== SAVE_VERSION) return null;
    return isValidGameState(parsed.state) ? parsed.state : null;
  } catch {
    return null;
  }
}

export function saveState(s: GameState): boolean {
  try {
    const envelope: SaveEnvelope = { v: SAVE_VERSION, state: s };
    localStorage.setItem(SAVE_KEY, JSON.stringify(envelope));
    return true;
  } catch {
    return false;
  }
}
