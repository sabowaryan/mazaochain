/**
 * Client-side redirect information storage
 * Provides clean URLs by storing redirect info in sessionStorage
 */

const REDIRECT_KEY = 'auth_redirect_info';

export interface RedirectInfo {
  returnUrl: string;
  reason?: string;
  timestamp: number;
}

export function storeRedirectInfo(returnUrl: string, reason?: string): void {
  if (typeof window === 'undefined') return;
  
  const redirectInfo: RedirectInfo = {
    returnUrl,
    reason,
    timestamp: Date.now()
  };
  
  try {
    sessionStorage.setItem(REDIRECT_KEY, JSON.stringify(redirectInfo));
  } catch (error) {
    console.warn('Failed to store redirect info:', error);
  }
}

export function getRedirectInfo(): RedirectInfo | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = sessionStorage.getItem(REDIRECT_KEY);
    if (!stored) return null;
    
    const data: RedirectInfo = JSON.parse(stored);
    
    // Expirer après 10 minutes pour éviter les redirections obsolètes
    const TEN_MINUTES = 10 * 60 * 1000;
    if (Date.now() - data.timestamp > TEN_MINUTES) {
      sessionStorage.removeItem(REDIRECT_KEY);
      return null;
    }
    
    return data;
  } catch (error) {
    console.warn('Failed to get redirect info:', error);
    sessionStorage.removeItem(REDIRECT_KEY);
    return null;
  }
}

export function clearRedirectInfo(): void {
  if (typeof window === 'undefined') return;
  
  try {
    sessionStorage.removeItem(REDIRECT_KEY);
  } catch (error) {
    console.warn('Failed to clear redirect info:', error);
  }
}

export function hasRedirectInfo(): boolean {
  return getRedirectInfo() !== null;
}