import React from "react";

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type State = {
  hasError: boolean;
};

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error("Mangochase UI error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="rounded-xl border bg-card p-6 shadow-soft">
            <h2 className="font-display text-xl font-bold">Something went wrong</h2>
            <p className="mt-1 text-sm text-muted-foreground">Try refreshing the page.</p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
