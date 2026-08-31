import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Last-resort net around the whole app. The circuit simulator is written to never throw
 * (bad data degrades to a reported issue, not an exception — see simulator.ts), but a
 * WebMCP tool call is agent-controlled input reaching deep into React state, so this stays
 * as defense-in-depth against anything that slips past that guarantee.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("LogicLab crashed:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="crash-screen">
          <h1>Something went wrong.</h1>
          <p>{this.state.error.message}</p>
          <button type="button" onClick={() => location.reload()}>
            Reload LogicLab
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
