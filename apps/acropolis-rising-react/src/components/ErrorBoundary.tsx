import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/** Catches render/runtime errors anywhere below it so a single throw degrades
    to a recoverable message instead of a blank white screen. */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Acropolis Rising crashed:', error, info.componentStack);
  }

  private handleReset = () => this.setState({ error: null });

  override render() {
    if (this.state.error) {
      return (
        <div id="errorFallback" role="alert">
          <h1>🏛️ The city has crumbled</h1>
          <p>Something went wrong while rendering the game.</p>
          <pre>{this.state.error.message}</pre>
          <button className="ghost" onClick={this.handleReset}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
