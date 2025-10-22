// Hedera SDK specific polyfills
// Based on solutions from Hedera community and GitHub issues

// Ensure Buffer is available globally with all required constants
export function setupHederaPolyfills() {
  // Only run in browser environment
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    // Dynamic import to avoid build-time issues
    import('buffer').then(({ Buffer }) => {
      try {
        // Define all Buffer constants that Hedera SDK might need
        const bufferConstants = {
          MAX_LENGTH: 2147483647,
          MAX_STRING_LENGTH: 536870888,
          MAX_SAFE_INTEGER: 9007199254740991,
        };

        // Setup Buffer globally with error handling
        const setupBuffer = (target: any) => {
          try {
            if (!target.Buffer) {
              target.Buffer = Buffer;
            }
            
            // Ensure constants exist with safe assignment
            if (!target.Buffer.constants) {
              target.Buffer.constants = { ...bufferConstants };
            } else {
              // Safely merge with existing constants
              target.Buffer.constants = { ...target.Buffer.constants, ...bufferConstants };
            }
            
            // Also set as direct properties for compatibility
            Object.keys(bufferConstants).forEach(key => {
              if (!(key in target.Buffer)) {
                target.Buffer[key] = bufferConstants[key as keyof typeof bufferConstants];
              }
            });
          } catch (error) {
            console.warn('Error setting up Buffer on target:', error);
          }
        };

        // Setup for browser environment
        setupBuffer(window);
        (window as any).global = window;
        if (!(window as any).process) {
          (window as any).process = { env: {} };
        }

        // Setup for globalThis if available
        if (typeof globalThis !== 'undefined') {
          setupBuffer(globalThis);
          if (!globalThis.process) {
            (globalThis as any).process = { env: {} };
          }
        }

        console.log('Hedera polyfills setup completed');
        resolve();
      } catch (error) {
        console.warn('Error in Hedera polyfills setup:', error);
        resolve(); // Don't fail, just warn
      }
    }).catch(error => {
      console.warn('Failed to load Buffer for Hedera polyfills:', error);
      resolve(); // Don't fail, just warn
    });
  });
}

// Auto-setup if in browser
if (typeof window !== 'undefined') {
  setupHederaPolyfills();
}

export default setupHederaPolyfills;