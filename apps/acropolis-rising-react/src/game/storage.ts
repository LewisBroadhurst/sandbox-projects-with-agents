import { COLS, RESOURCE_ORDER, ROWS } from './data';
import type { GameState } from './types';

const SAVE_KEY = 'acropolis-save';

/** Bump whenever the GameState shape changes in a way older saves can't satisfy.
    Saves written by a different version are rejected rather than loaded blindly. */
export const SAVE_VERSION = 1;

interface SaveEnvelope {
  v: number;
  state: GameState;
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null;

const isFiniteNumber = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v);

const isString = (v: unknown): v is string => typeof v === 'string';

const hasAllResources = (v: unknown): boolean =>
  isObject(v) && RESOURCE_ORDER.every((k) => isFiniteNumber(v[k]));

/** Each persisted field mapped to the predicate its value must satisfy. */
const STATE_SCHEMA: Record<string, (v: unknown) => boolean> = {
  map: (v) => Array.isArray(v) && v.length === COLS * ROWS,
  resources: hasAllResources,
  totalProduced: hasAllResources,
  storageCap: isFiniteNumber,
  population: isFiniteNumber,
  happiness: isFiniteNumber,
  tickCount: isFiniteNumber,
  seed: isFiniteNumber,
  rngState: isFiniteNumber,
  cityName: isString,
  blessingsActive: isObject,
  milestonesDone: isObject,
};

/** Structural check guarding against corrupt or stale saves so a bad payload
    starts a fresh game instead of poisoning the simulation with NaN/undefined. */
function isValidGameState(x: unknown): x is GameState {
  return (
    isObject(x) && Object.entries(STATE_SCHEMA).every(([key, ok]) => ok(x[key]))
  );
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
