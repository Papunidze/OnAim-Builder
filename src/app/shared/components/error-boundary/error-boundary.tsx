import React, { type ErrorInfo, type JSX, type ReactNode } from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: ErrorInfo) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  componentName?: string;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ error, errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  render(): JSX.Element | ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.state.errorInfo!);
      }

      return (
        <div
          style={{
            color: "red",
            padding: "16px",
            border: "1px solid #ff6b6b",
            borderRadius: "4px",
            margin: "8px 0",
            backgroundColor: "#fff5f5",
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
            Component Error in {this.props.componentName || "Unknown Component"}
          </div>
          <div style={{ fontSize: "14px", marginBottom: "8px" }}>
            {this.state.error.message}
          </div>
          <details style={{ fontSize: "12px", color: "#666" }}>
            <summary>Error Details</summary>
            <pre style={{ marginTop: "8px", overflow: "auto" }}>
              {this.state.error.stack}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
