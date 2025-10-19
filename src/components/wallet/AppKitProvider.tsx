'use client';

// AppKit provider wrapper for the application
import { useEffect, useState } from 'react';
import { env } from '@/lib/config/env';

interface AppKitProviderProps {
  children: React.ReactNode;
}

/**
 * AppKit provider that initializes the AppKit modal
 * Only initializes when NEXT_PUBLIC_USE_APPKIT is enabled
 */
export function AppKitProvider({ children }: AppKitProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Only initialize if AppKit is enabled
    if (!env.NEXT_PUBLIC_USE_APPKIT) {
      setIsInitialized(true);
      return;
    }

    const initializeAppKit = async () => {
      try {
        // Dynamically import AppKit configuration
        const { initializeAppKit } = await import('@/lib/wallet/appkit-config');
        
        // Initialize AppKit
        initializeAppKit();
        
        setIsInitialized(true);
        console.log('AppKit initialized successfully');
      } catch (error) {
        console.error('Failed to initialize AppKit:', error);
        // Still set initialized to true to allow app to render
        setIsInitialized(true);
      }
    };

    initializeAppKit();
  }, []);

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing wallet connection...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
