'use client';

import React from 'react';
import { WalletError } from '@/lib/wallet/wallet-error-handler';

interface WalletErrorBoundaryState {
  hasError: boolean;
  error?: WalletError;
}

interface WalletErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: WalletError; retry: () => void }>;
}

export class WalletErrorBoundary extends React.Component<
  WalletErrorBoundaryProps,
  WalletErrorBoundaryState
> {
  constructor(props: WalletErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): WalletErrorBoundaryState {
    if (error instanceof WalletError) {
      return { hasError: true, error };
    }
    return { hasError: true, error: new WalletError(error.message) };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('WalletErrorBoundary caught an error:', error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} retry={this.retry} />;
      }

      return <DefaultWalletErrorFallback error={this.state.error} retry={this.retry} />;
    }

    return this.props.children;
  }
}

function DefaultWalletErrorFallback({ 
  error, 
  retry 
}: { 
  error: WalletError; 
  retry: () => void; 
}) {
  return (
    <div className="p-4 border border-red-200 rounded-lg bg-red-50">
      <div className="flex items-center mb-2">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            Erreur de Wallet
          </h3>
        </div>
      </div>
      <div className="ml-8">
        <p className="text-sm text-red-700 mb-3">
          {error.message}
        </p>
        {error.code && (
          <p className="text-xs text-red-600 mb-3">
            Code d'erreur: {error.code}
          </p>
        )}
        <button
          onClick={retry}
          className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200 transition-colors"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}