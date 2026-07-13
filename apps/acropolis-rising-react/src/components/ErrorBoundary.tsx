import type { ReactNode } from 'react';
import {
  ErrorBoundary as ReactErrorBoundary,
  type FallbackProps,
} from 'react-error-boundary';

/** The recoverable UI shown when a render error is caught below the boundary. */
function GameCrashFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div id="errorFallback" role="alert">
      <h1>🏛️ The city has crumbled</h1>
      <p>Something went wrong while rendering the game.</p>
      <pre>{error instanceof Error ? error.message : String(error)}</pre>
      <button className="ghost" onClick={resetErrorBoundary}>
        Try again
      </button>
    </div>
  );
}

/** Catches render/runtime errors below it so a single throw degrades to a
    recoverable message instead of a blank white screen. */
export function ErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ReactErrorBoundary
      FallbackComponent={GameCrashFallback}
      onError={(error, info) =>
        console.error('Acropolis Rising crashed:', error, info.componentStack)
      }
    >
      {children}
    </ReactErrorBoundary>
  );
}
