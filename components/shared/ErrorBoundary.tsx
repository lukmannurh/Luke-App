"use client";

import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary — Client Component.
 * Catches React rendering errors and shows a user-friendly fallback.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          className="neo-card p-6 text-center"
          style={{ boxShadow: "var(--shadow-neo-destructive)", borderColor: "var(--color-destructive)" }}
          role="alert"
        >
          <div className="text-4xl mb-3" aria-hidden="true">⚠️</div>
          <h2
            className="text-lg font-black mb-2"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-destructive)" }}
          >
            Something went wrong
          </h2>
          <p className="text-sm mb-4" style={{ color: "var(--color-muted-foreground)" }}>
            An unexpected error occurred. Please refresh the page to try again.
          </p>
          <button
            id="error-boundary-refresh-btn"
            onClick={() => window.location.reload()}
            className="neo-btn neo-btn-outline neo-btn-sm"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
