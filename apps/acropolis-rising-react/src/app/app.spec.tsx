import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import App from './app';
import { newGameState } from '../game/simulation';
import { saveState } from '../game/storage';

describe('App', () => {
	afterEach(() => {
		cleanup();
		localStorage.clear();
	});

	it('should render successfully', () => {
		const { baseElement } = render(<App />);
		expect(baseElement).toBeTruthy();
	});

	it('should render the game title', () => {
		render(<App />);
		expect(screen.getByText('Acropolis Rising')).toBeTruthy();
	});

	it('should render the city stats for a new city', () => {
		render(<App />);
		expect(screen.getByText('City of Elysia')).toBeTruthy();
	});

	// Regression: the app used to crash to a blank screen when a saved game
	// existed in localStorage (issue #5). Previously no test exercised the
	// load-from-save path, so it slipped through CI.
	it('hydrates from a saved game in localStorage without crashing', () => {
		// A distinctly-named saved city so we can prove the app loaded the SAVE
		// rather than silently starting a fresh game.
		saveState({ ...newGameState(42), cityName: 'Sparta' });

		render(<App />);

		// Renders (no blank screen)...
		expect(screen.getByText('Acropolis Rising')).toBeTruthy();
		// ...and the resource bar (the exact throw site in issue #5) is present...
		expect(screen.getAllByText('/300').length).toBeGreaterThan(0);
		// ...and it hydrated from the save, not a fresh 'Elysia'.
		expect(screen.getByText('City of Sparta')).toBeTruthy();
		expect(screen.queryByText('City of Elysia')).toBeNull();
	});
});
