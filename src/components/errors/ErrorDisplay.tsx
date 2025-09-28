'use client';

import React from 'react';
import { MazaoChainError } from '@/lib/errors/MazaoChainError';
import { ErrorSeverity } from '@/lib/errors/types';

interface ErrorDisplayProps {
  error: MazaoChainError | string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
  className?: string;
}

/**
 * Reusable component for displaying errors with appropriate styling and actions
 */
export function ErrorDisplay({
  error,
  onRetry,
  onDismiss,
  showDetails = false,
  className = ''
}: ErrorDisplayProps) {
  if (!error) return null;

  const mazaoError = typeof error === 'string' 
    ? new MazaoChainError('INTERNAL_SERVER_ERROR' as any, error)
    : error;

  const getSeverityStyles = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return 'bg-red-100 border-red-500 text-red-900';
      case ErrorSeverity.HIGH:
        return 'bg-red-50 border-red-400 text-red-800';
      case ErrorSeverity.MEDIUM:
        return 'bg-yellow-50 border-yellow-400 text-yellow-800';
      case ErrorSeverity.LOW:
        return 'bg-blue-50 border-blue-400 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-400 text-gray-800';
    }
  };

  const getSeverityIcon = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return (
          <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case ErrorSeverity.MEDIUM:
        return (
          <svg className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case ErrorSeverity.LOW:
        return (
          <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const severityStyles = getSeverityStyles(mazaoError.severity);
  const icon = getSeverityIcon(mazaoError.severity);

  return (
    <div className={`border-l-4 p-4 ${severityStyles} ${className}`} role="alert">
      <div className="flex">
        <div className="flex-shrink-0">
          {icon}
        </div>
        
        <div className="ml-3 flex-1">
          <div className="flex justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-medium">
                {mazaoError.severity === ErrorSeverity.CRITICAL ? 'Erreur critique' :
                 mazaoError.severity === ErrorSeverity.HIGH ? 'Erreur importante' :
                 mazaoError.severity === ErrorSeverity.MEDIUM ? 'Attention' :
                 'Information'}
              </h3>
              
              <p className="mt-1 text-sm">
                {mazaoError.userMessage}
              </p>

              {showDetails && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs opacity-75 hover:opacity-100">
                    Détails techniques
                  </summary>
                  <div className="mt-1 text-xs opacity-75 font-mono">
                    <p><strong>Code:</strong> {mazaoError.code}</p>
                    <p><strong>Message:</strong> {mazaoError.message}</p>
                    {mazaoError.context?.timestamp && (
                      <p><strong>Heure:</strong> {mazaoError.context.timestamp.toLocaleString()}</p>
                    )}
                  </div>
                </details>
              )}
            </div>

            {onDismiss && (
              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={onDismiss}
                  className="inline-flex rounded-md p-1.5 hover:bg-black hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-current"
                  aria-label="Fermer"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {(onRetry && mazaoError.retryable) && (
            <div className="mt-3">
              <button
                onClick={onRetry}
                className="text-sm font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current rounded"
              >
                Réessayer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact error display for inline use
 */
export function InlineErrorDisplay({
  error,
  className = ''
}: {
  error: MazaoChainError | string | null;
  className?: string;
}) {
  if (!error) return null;

  const mazaoError = typeof error === 'string' 
    ? new MazaoChainError('VALIDATION_ERROR' as any, error)
    : error;

  return (
    <div className={`flex items-center text-sm text-red-600 ${className}`}>
      <svg className="h-4 w-4 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      <span>{mazaoError.userMessage}</span>
    </div>
  );
}

/**
 * Toast-style error notification
 */
export function ErrorToast({
  error,
  onDismiss,
  autoHide = true,
  hideDelay = 5000
}: {
  error: MazaoChainError | string | null;
  onDismiss: () => void;
  autoHide?: boolean;
  hideDelay?: number;
}) {
  React.useEffect(() => {
    if (autoHide && error) {
      const timer = setTimeout(onDismiss, hideDelay);
      return () => clearTimeout(timer);
    }
  }, [error, autoHide, hideDelay, onDismiss]);

  if (!error) return null;

  const mazaoError = typeof error === 'string' 
    ? new MazaoChainError('INTERNAL_SERVER_ERROR' as any, error)
    : error;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      <div className="bg-white border border-red-200 rounded-lg shadow-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900">Erreur</p>
            <p className="text-sm text-gray-600 mt-1">{mazaoError.userMessage}</p>
          </div>
          
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={onDismiss}
              className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}