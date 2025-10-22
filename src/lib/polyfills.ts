// Global polyfills for Node.js modules in browser environment
import { Buffer } from 'buffer';

// Polyfill Buffer constants immediately
const BUFFER_CONSTANTS = {
  MAX_LENGTH: 2147483647,
  MAX_STRING_LENGTH: 536870888
};

// Ensure Buffer is available globally with constants
function setupBuffer(target: any, bufferInstance: any) {
  target.Buffer = bufferInstance;
  
  // Add constants to Buffer
  if (!bufferInstance.constants) {
    bufferInstance.constants = BUFFER_CONSTANTS;
  } else {
    // Ensure all required constants exist
    Object.assign(bufferInstance.constants, BUFFER_CONSTANTS);
  }
}

// Setup for browser environment
if (typeof window !== 'undefined') {
  setupBuffer(window, Buffer);
  (window as any).global = window;
  (window as any).process = (window as any).process || { env: {} };
}

// Setup for Node.js/SSR environment
if (typeof global !== 'undefined') {
  setupBuffer(global, Buffer);
  if (!global.process) {
    (global as any).process = { env: {} };
  }
}

// Setup for modern environments
if (typeof globalThis !== 'undefined') {
  setupBuffer(globalThis, Buffer);
  if (!globalThis.process) {
    (globalThis as any).process = { env: {} };
  }
}

// Ensure Buffer is available as a global
if (typeof Buffer !== 'undefined') {
  setupBuffer(globalThis || global || window, Buffer);
}

export {};