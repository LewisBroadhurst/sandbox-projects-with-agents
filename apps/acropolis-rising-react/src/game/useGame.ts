import { useCallback, useEffect, useRef, useState } from 'react';
import { bulldoze, castBlessing, newGameState, tick, tryPlace } from './simulation';
import { loadSavedState, saveState } from './storage';
import type { ActionResult, BlessingId, BuildingId, GameState, Point } from './types';

export type Speed = 0 | 1 | 2;

export interface Toast {
	id: number;
	msg: string;
}

const AUTOSAVE_MS = 30000;
const TOAST_MS = 4200;
const TUTORIAL_KEY = 'acropolis-tutorial-seen';

let nextToastId = 0;

export function useGame() {
	const loadedFromSave = useRef(false);
	const [state, setState] = useState<GameState>(() => {
		const saved = loadSavedState();
		if (saved) {
			loadedFromSave.current = true;
			return saved;
		}
		return newGameState();
	});
	const [speed, setSpeed] = useState<Speed>(1);
	const [selectedBuild, setSelectedBuild] = useState<BuildingId | null>(null);
	const [selectedTile, setSelectedTile] = useState<Point | null>(null);
	const [toasts, setToasts] = useState<Toast[]>([]);
	// Auto-open the tutorial for brand-new players (fresh game, never seen it).
	const [showTutorial, setShowTutorial] = useState<boolean>(() => {
		try {
			return !loadedFromSave.current && localStorage.getItem(TUTORIAL_KEY) !== 'true';
		} catch {
			return false;
		}
	});

	const stateRef = useRef(state);
	stateRef.current = state;

	const pushToast = useCallback((msg: string) => {
		const id = nextToastId++;
		setToasts(prev => [...prev, { id, msg }]);
		setTimeout(() => {
			setToasts(prev => prev.filter(t => t.id !== id));
		}, TOAST_MS);
	}, []);

	// Applies a game action outside React's render cycle so toasts fire exactly
	// once (a setState updater could be invoked twice under StrictMode).
	const apply = useCallback(
		(action: (s: GameState) => ActionResult) => {
			const result = action(stateRef.current);
			stateRef.current = result.state;
			setState(result.state);
			for (const msg of result.toasts) pushToast(msg);
		},
		[pushToast],
	);

	// simulation loop
	useEffect(() => {
		if (speed === 0) return;
		const timer = setInterval(() => apply(tick), 1000 / speed);
		return () => clearInterval(timer);
	}, [speed, apply]);

	const saveGame = useCallback(() => {
		if (saveState(stateRef.current)) pushToast('City saved to the archives.');
		else pushToast('Save failed — please try again.');
	}, [pushToast]);

	// autosave
	useEffect(() => {
		const timer = setInterval(() => saveState(stateRef.current), AUTOSAVE_MS);
		return () => clearInterval(timer);
	}, []);

	// welcome toast (once, even under StrictMode's double effect run)
	const welcomed = useRef(false);
	useEffect(() => {
		if (welcomed.current) return;
		welcomed.current = true;
		pushToast(loadedFromSave.current ? `Welcome back to ${stateRef.current.cityName}.` : 'Found a new city on the Aegean coast.');
	}, [pushToast]);

	const openTutorial = useCallback(() => setShowTutorial(true), []);
	const closeTutorial = useCallback(() => {
		setShowTutorial(false);
		try {
			localStorage.setItem(TUTORIAL_KEY, 'true');
		} catch {
			/* ignore storage errors — the tutorial simply reopens next time */
		}
	}, []);

	const cancelBuild = useCallback(() => setSelectedBuild(null), []);

	// Escape cancels placement
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') cancelBuild();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [cancelBuild]);

	const togglePause = useCallback(() => setSpeed(s => (s === 0 ? 1 : 0)), []);

	const selectBuild = useCallback((id: BuildingId) => {
		setSelectedBuild(cur => (cur === id ? null : id));
		setSelectedTile(null);
	}, []);

	const handleTileClick = useCallback(
		(x: number, y: number) => {
			if (selectedBuild) {
				apply(s => tryPlace(s, selectedBuild, x, y));
			} else {
				setSelectedTile({ x, y });
			}
		},
		[selectedBuild, apply],
	);

	const demolish = useCallback((x: number, y: number) => apply(s => bulldoze(s, x, y)), [apply]);

	const invokeBlessing = useCallback((id: BlessingId) => apply(s => castBlessing(s, id)), [apply]);

	const loadGame = useCallback(() => {
		const saved = loadSavedState();
		if (saved) {
			stateRef.current = saved;
			setState(saved);
			setSelectedBuild(null);
			setSelectedTile(null);
			pushToast('City restored from the archives.');
		} else {
			pushToast('No saved city found.');
		}
	}, [pushToast]);

	const newCity = useCallback(() => {
		if (!window.confirm('Start a new city? This will not erase your saved game unless you save over it.')) return;
		const fresh = newGameState();
		stateRef.current = fresh;
		setState(fresh);
		setSelectedBuild(null);
		setSelectedTile(null);
		pushToast('A new city rises from the shore.');
	}, [pushToast]);

	return {
		state,
		speed,
		selectedBuild,
		selectedTile,
		toasts,
		showTutorial,
		openTutorial,
		closeTutorial,
		setSpeed,
		togglePause,
		selectBuild,
		cancelBuild,
		handleTileClick,
		demolish,
		invokeBlessing,
		saveGame,
		loadGame,
		newCity,
	};
}
