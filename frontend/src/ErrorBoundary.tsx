import React, { Component, ErrorInfo, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Vous pouvez loguer l'erreur vers un service de reporting
    console.error("ErrorBoundary a capturé une erreur:", error, errorInfo);
  }

  resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Si un fallback personnalisé est fourni, on l'utilise
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Sinon on utilise notre UI d'erreur par défaut avec daisyUI
      return (
        <div className="min-h-screen flex items-center justify-center bg-base-100">
          <div className="card w-300 bg-base-200 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-error">Une erreur est survenue</h2>
              <div className="alert alert-error mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="stroke-current shrink-0 h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>
                  {this.state.error?.message ||
                    "Une erreur inattendue s'est produite"}
                </span>
              </div>
              <div className="mockup-code mb-4">
                <pre data-prefix="~">
                  <code>{this.state.error?.stack?.split("\n")[0]}</code>
                </pre>
                <pre data-prefix="~">
                  <code>{this.state.error?.stack?.split("\n")[1]}</code>
                </pre>
              </div>
              <div className="card-actions justify-end">
                <button
                  className="btn btn-primary"
                  onClick={this.resetErrorBoundary}
                >
                  Réessayer
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
