'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { MazaoChainError } from '@/lib/errors/MazaoChainError';
import { ErrorCode, ErrorSeverity } from '@/lib/errors/types';
import { logger } from '@/lib/errors/logger';
import { ErrorHandler } from '@/lib/errors/handler';

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
        userMessage: 'Une erreur inattendue s\'est produite dans l\'application.'
      }
    );

    return {
      hasError: true,
      error: mazaoError,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const mazaoError = this.state.error || ErrorHandler.handle(error);
    
    // Log the error with React-specific context
    logger.error('React Error Boundary caught error', mazaoError, {
      timestamp: new Date(),
      additionalData: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
        errorId: this.state.errorId
      }
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

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 text-red-500">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Oops! Une erreur s'est produite
              </h2>
              
              <p className="mt-2 text-sm text-gray-600">
                {this.state.error?.userMessage || 'Une erreur inattendue s\'est produite.'}
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    Détails techniques (développement)
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-800 overflow-auto">
                    <p><strong>Code:</strong> {this.state.error.code}</p>
                    <p><strong>Message:</strong> {this.state.error.message}</p>
                    <p><strong>ID:</strong> {this.state.errorId}</p>
                    {this.state.error.originalError && (
                      <p><strong>Stack:</strong> {this.state.error.originalError.stack}</p>
                    )}
                  </div>
                </details>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Réessayer
              </button>
              
              <button
                onClick={this.handleReload}
                className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Recharger la page
              </button>

              <div className="text-center">
                <a
                  href="/"
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Retour à l'accueil
                </a>
              </div>
            </div>

            {this.state.errorId && (
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  ID d'erreur: {this.state.errorId}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Veuillez inclure cet ID si vous contactez le support.
                </p>
              </div>
            )}
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
        additionalData: { context, handlerType: 'useErrorHandler' }
      })
    });

    logger.error(`Error handled by useErrorHandler${context ? ` (${context})` : ''}`, mazaoError);
    
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

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}