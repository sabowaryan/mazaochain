"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { MazaoChainError } from "@/lib/errors/MazaoChainError";
import { ErrorCode, ErrorSeverity } from "@/lib/errors/types";
import { logger } from "@/lib/errors/logger";
import { ErrorHandler } from "@/lib/errors/handler";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: MazaoChainError, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: MazaoChainError;
  errorId?: string;
}

/**
 * Error Boundary component for catching and handling React errors
 * Provides user-friendly error display and comprehensive error logging
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Convert error to MazaoChainError
    const mazaoError = new MazaoChainError(
      ErrorCode.INTERNAL_SERVER_ERROR,
      error.message,
      {
        severity: ErrorSeverity.HIGH,
        originalError: error,
        userMessage: "Une erreur inattendue s'est produite dans l'application.",
      }
    );

    return {
      hasError: true,
      error: mazaoError,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const mazaoError = this.state.error || ErrorHandler.handle(error);

    // Log the error with React-specific context
    logger.error("React Error Boundary caught error", mazaoError, {
      timestamp: new Date(),
      additionalData: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
        errorId: this.state.errorId,
      },
    });

    // Call custom error handler if provided
    if (this.props.onError && mazaoError) {
      this.props.onError(mazaoError, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI with MazaoChain design system
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-background to-accent-50 dark:from-primary-950 dark:via-background dark:to-accent-950 px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
          <div className="w-full max-w-screen-lg">
            {/* Error Card */}
            <div className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden animate-scale-in">
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-error-500 to-error-600 px-6 py-8 sm:px-8 sm:py-10 text-center">
                {/* Error Icon */}
                <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 animate-pulse-slow">
                  <svg
                    className="w-10 h-10 sm:w-12 sm:h-12 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  Oups! Une erreur s&apos;est produite
                </h1>
                <p className="text-error-50 text-sm sm:text-base">
                  Nous sommes désolés pour ce désagrément
                </p>
              </div>

              {/* Content */}
              <div className="px-6 py-6 sm:px-8 sm:py-8 space-y-6">
                {/* Error Message */}
                <div className="bg-muted rounded-xl p-4 border border-border">
                  <p className="text-sm sm:text-base text-foreground text-center">
                    {this.state.error?.userMessage ||
                      "Une erreur inattendue s'est produite."}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={this.handleRetry}
                    className="touch-target w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Réessayer
                  </button>

                  <button
                    onClick={this.handleReload}
                    className="touch-target w-full flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 active:bg-neutral-100 dark:active:bg-neutral-600 text-foreground font-medium rounded-xl border border-border shadow-sm hover:shadow transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Recharger la page
                  </button>

                  <div className="text-center pt-2">
                    <button
                      onClick={() => (window.location.href = "/")}
                      className="inline-flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors duration-200"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 19l-7-7m0 0l7-7m-7 7h18"
                        />
                      </svg>
                      Retour à l&apos;accueil
                    </button>
                  </div>
                </div>

                {/* Error ID */}
                {this.state.errorId && (
                  <div className="pt-4 border-t border-border">
                    <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-3 space-y-1">
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 text-center">
                        ID d&apos;erreur
                      </p>
                      <p className="text-xs font-mono text-neutral-800 dark:text-neutral-200 text-center break-all">
                        {this.state.errorId}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-500 text-center pt-1">
                        Veuillez inclure cet ID si vous contactez le support
                      </p>
                    </div>
                  </div>
                )}

                {/* Technical Details (Development Only) */}
                {process.env.NODE_ENV === "development" && this.state.error && (
                  <details className="pt-4 border-t border-border">
                    <summary className="cursor-pointer text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 select-none">
                      <span className="inline-flex items-center gap-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                          />
                        </svg>
                        Détails techniques (développement)
                      </span>
                    </summary>
                    <div className="mt-3 p-4 bg-neutral-900 dark:bg-neutral-950 rounded-lg border border-neutral-700 overflow-auto max-h-64">
                      <div className="space-y-2 text-xs font-mono">
                        <div>
                          <span className="text-accent-400">Code:</span>{" "}
                          <span className="text-neutral-300">
                            {this.state.error.code}
                          </span>
                        </div>
                        <div>
                          <span className="text-accent-400">Message:</span>{" "}
                          <span className="text-neutral-300">
                            {this.state.error.message}
                          </span>
                        </div>
                        <div>
                          <span className="text-accent-400">ID:</span>{" "}
                          <span className="text-neutral-300">
                            {this.state.errorId}
                          </span>
                        </div>
                        {this.state.error.originalError && (
                          <div className="pt-2 border-t border-neutral-700">
                            <span className="text-accent-400">Stack:</span>
                            <pre className="text-neutral-400 mt-1 whitespace-pre-wrap break-all">
                              {this.state.error.originalError.stack}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </details>
                )}
              </div>
            </div>

            {/* Help Text */}
            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Si le problème persiste, contactez notre{" "}
                <button
                  onClick={() => (window.location.href = "/support")}
                  className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
                >
                  support technique
                </button>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook for handling errors in functional components
 */
export function useErrorHandler() {
  const handleError = (error: unknown, context?: string) => {
    const mazaoError = ErrorHandler.handle(error, {
      context: ErrorHandler.createContext({
        additionalData: { context, handlerType: "useErrorHandler" },
      }),
    });

    logger.error(
      `Error handled by useErrorHandler${context ? ` (${context})` : ""}`,
      mazaoError
    );

    // In a real app, you might want to show a toast notification
    // or update some global error state here

    return mazaoError;
  };

  return { handleError };
}

/**
 * Higher-order component for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: MazaoChainError, errorInfo: ErrorInfo) => void
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
}
