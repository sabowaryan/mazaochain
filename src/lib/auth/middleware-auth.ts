/**
 * Authentication utilities — role checks and security headers.
 * Auth is handled by Clerk. Role data comes from Neon (profiles table).
 */

export type UserRole = 'agriculteur' | 'cooperative' | 'preteur' | 'admin';

export interface AuthResult {
  authenticated: boolean;
  userId?: string;
  role?: UserRole;
  error?: string;
}

export const ROUTE_CONFIG = {
  PUBLIC: ['/', '/auth/login', '/auth/register', '/unauthorized', '/api/health'],
  PROTECTED: {
    DASHBOARD: ['/dashboard'],
    FARMER: ['/dashboard/farmer'],
    COOPERATIVE: ['/dashboard/cooperative'],
    LENDER: ['/dashboard/lender'],
    ADMIN: ['/admin'],
    TEST: ['/test-wallet', '/test-contracts'],
  },
} as const;

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  agriculteur: 1,
  cooperative: 2,
  preteur: 2,
  admin: 10,
};

export function hasPermission(userRole: UserRole | undefined, requiredRole: UserRole): boolean {
  if (!userRole) return false;
  if (userRole === 'admin') return true;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function getRequiredRole(pathname: string): UserRole | null {
  const cleanPath = pathname.replace(/^\/[a-z]{2}\//, '/') || pathname;
  if (cleanPath.startsWith('/admin')) return 'admin';
  if (cleanPath.startsWith('/dashboard/farmer')) return 'agriculteur';
  if (cleanPath.startsWith('/dashboard/cooperative')) return 'cooperative';
  if (cleanPath.startsWith('/dashboard/lender')) return 'preteur';
  return null;
}

export function isProtectedRoute(pathname: string): boolean {
  const cleanPath = pathname.replace(/^\/[a-z]{2}\//, '/') || pathname;
  const isPublic = ROUTE_CONFIG.PUBLIC.some(route =>
    route === '/' ? cleanPath === '/' : cleanPath === route || cleanPath.startsWith(route + '/')
  );
  if (isPublic) return false;
  return Object.values(ROUTE_CONFIG.PROTECTED)
    .flat()
    .some(route => cleanPath.startsWith(route));
}

export function createRedirectUrl(baseUrl: string, returnPath: string, reason?: string): string {
  const url = new URL(baseUrl);
  url.searchParams.set('returnUrl', returnPath);
  if (reason) url.searchParams.set('reason', reason);
  return url.toString();
}

export const SECURITY_HEADERS = {
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
} as const;

export const RATE_LIMITS = {
  LOGIN_ATTEMPTS: 5,
  API_REQUESTS: 100,
  PASSWORD_RESET: 3,
} as const;
