import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import App from './app';

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
});
