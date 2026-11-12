import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { logger } from "@/lib/logger";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Catches render-time and lazy-load failures so a broken route shows a
 * recoverable message instead of a blank page.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logger.error("Unhandled UI error:", error, info.componentStack);
  }

  private handleRetry = () => {
    window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) {
      return this.props.children;
    }

    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md space-y-4 rounded-xl border border-gold-dark/30 bg-[#14110a] p-6 text-center">
          <h2 className="font-display text-xl text-gold">
            Something went wrong
          </h2>
          <p className="text-sm text-text-muted">
            The page failed to load. Your progress is saved separately, so it is
            safe to try again.
          </p>
          {error.message && (
            <p className="break-words rounded bg-black/30 p-2 font-mono text-xs text-danger">
              {error.message}
            </p>
          )}
          <button
            type="button"
            onClick={this.handleRetry}
            className="rounded-md border border-gold-dark/40 bg-gold/10 px-4 py-2 text-sm font-semibold text-gold transition-colors hover:bg-gold/20"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }
}
