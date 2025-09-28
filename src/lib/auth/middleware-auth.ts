/**
 * Authentication utilities for middleware integration
 * Handles secure token management and role-based access control
 */

import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';

export type UserRole = 'agriculteur' | 'cooperative' | 'preteur' | 'admin';

export interface AuthUser extends User {
  role?: UserRole;
}

export interface AuthResult {
  authenticated: boolean;
  user?: AuthUser;
  role?: UserRole;
  error?: string;
}

/**
 * Route protection configuration
 */
export const ROUTE_CONFIG = {
  // Public routes accessible without authentication
  PUBLIC: [
    '/',
    '/auth/login',
    '/auth/register',
    '/unauthorized',
    '/api/health'
  ],

  // Protected routes requiring authentication
  PROTECTED: {
    // General dashboard access
    DASHBOARD: ['/dashboard'],
    
    // Role-specific routes
    FARMER: ['/dashboard/farmer'],
    COOPERATIVE: ['/dashboard/cooperative'],
    LENDER: ['/dashboard/lender'],
    ADMIN: ['/admin'],
    
    // Development/testing routes
    TEST: ['/test-wallet', '/test-contracts']
  }
} as const;

/**
 * Role hierarchy for access control
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  'agriculteur': 1,
  'cooperative': 2,
  'preteur': 2,
  'admin': 10
};

/**
 * Check if a user role has sufficient permissions for a route
 */
export function hasPermission(userRole: UserRole | undefined, requiredRole: UserRole): boolean {
  if (!userRole) return false;
  
  // Admin has access to everything
  if (userRole === 'admin') return true;
  
  // Check role hierarchy
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Determine required role for a given pathname
 */
export function getRequiredRole(pathname: string): UserRole | null {
  // Remove locale prefix
  const cleanPath = pathname.replace(/^\/[a-z]{2}/, '');
  
  if (cleanPath.startsWith('/admin')) return 'admin';
  if (cleanPath.startsWith('/dashboard/farmer')) return 'agriculteur';
  if (cleanPath.startsWith('/dashboard/cooperative')) return 'cooperative';
  if (cleanPath.startsWith('/dashboard/lender')) return 'preteur';
  
  return null;
}

/**
 * Check if a route is protected
 */
export function isProtectedRoute(pathname: string): boolean {
  const cleanPath = pathname.replace(/^\/[a-z]{2}/, '');
  
  // Check if it's explicitly public
  if (ROUTE_CONFIG.PUBLIC.some(route => cleanPath === route || cleanPath.startsWith(route))) {
    return false;
  }
  
  // Check if it's in protected routes
  return Object.values(ROUTE_CONFIG.PROTECTED)
    .flat()
    .some(route => cleanPath.startsWith(route));
}

/**
 * Validate authentication token server-side
 */
export async function validateAuthToken(token: string): Promise<AuthResult> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return {
        authenticated: false,
        error: authError?.message || 'Invalid token'
      };
    }

    // Get user profile with role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, is_validated')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return {
        authenticated: false,
        error: 'Profile not found'
      };
    }

    // Check if user account is validated (except for farmers who can be unvalidated)
    if (!profile.is_validated && profile.role !== 'agriculteur') {
      return {
        authenticated: false,
        error: 'Account not validated'
      };
    }

    return {
      authenticated: true,
      user: { ...user, role: profile.role },
      role: profile.role
    };
  } catch (error) {
    console.error('Token validation error:', error);
    return {
      authenticated: false,
      error: 'Authentication failed'
    };
  }
}

/**
 * Extract auth token from request cookies
 */
export function extractAuthToken(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  // Parse cookies
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  // Try different possible cookie names
  return cookies['sb-access-token'] || 
         cookies['supabase-auth-token'] || 
         cookies['supabase.auth.token'] ||
         null;
}

/**
 * Create redirect URL with return path
 */
export function createRedirectUrl(baseUrl: string, returnPath: string, reason?: string): string {
  const url = new URL(baseUrl);
  url.searchParams.set('returnUrl', returnPath);
  if (reason) {
    url.searchParams.set('reason', reason);
  }
  return url.toString();
}

/**
 * Security headers for protected routes
 */
export const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
} as const;

/**
 * Rate limiting configuration
 */
export const RATE_LIMITS = {
  LOGIN_ATTEMPTS: 5, // per 15 minutes
  API_REQUESTS: 100, // per minute
  PASSWORD_RESET: 3, // per hour
} as const;