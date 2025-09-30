/**
 * Hook to access authentication information set by middleware
 * Provides seamless integration between server-side auth checks and client-side components
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';
import type { UserRole } from '@/lib/auth/middleware-auth';

interface MiddlewareAuthInfo {
  userId?: string;
  userRole?: UserRole;
  userEmail?: string;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * Custom hook to access middleware authentication information
 */
export function useMiddlewareAuth(): MiddlewareAuthInfo {
  const [authInfo, setAuthInfo] = useState<MiddlewareAuthInfo>({
    isAuthenticated: false,
    isLoading: true
  });
  
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If we have user from auth context, use that
    if (!loading && user) {
      setAuthInfo({
        userId: user.id,
        userRole: (user as any).role,
        userEmail: user.email || undefined,
        isAuthenticated: true,
        isLoading: false
      });
      return;
    }

    // If no user and not loading, user is not authenticated
    if (!loading && !user) {
      setAuthInfo({
        isAuthenticated: false,
        isLoading: false
      });
      return;
    }

    // Still loading
    setAuthInfo(prev => ({ ...prev, isLoading: loading }));
  }, [user, loading]);

  return authInfo;
}

/**
 * Hook to check if user has specific role
 */
export function useRoleCheck(requiredRole: UserRole): {
  hasRole: boolean;
  isLoading: boolean;
  currentRole?: UserRole;
} {
  const { userRole, isAuthenticated, isLoading } = useMiddlewareAuth();

  return {
    hasRole: isAuthenticated && (userRole === requiredRole || userRole === 'admin'),
    isLoading,
    currentRole: userRole
  };
}

/**
 * Hook to protect components based on role
 */
export function useRoleProtection(requiredRole: UserRole, redirectTo?: string) {
  const { hasRole, isLoading, currentRole } = useRoleCheck(requiredRole);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !hasRole) {
      const destination = redirectTo || '/unauthorized?reason=insufficient_permissions';
      router.push(destination);
    }
  }, [hasRole, isLoading, redirectTo, router]);

  return {
    hasAccess: hasRole,
    isLoading,
    currentRole
  };
}

/**
 * Hook for route-specific authentication checks
 */
export function useRouteAuth(routePath: string) {
  const { isAuthenticated, userRole, isLoading } = useMiddlewareAuth();
  const router = useRouter();

  const checkAccess = () => {
    if (isLoading) return { hasAccess: false, isLoading: true };

    if (!isAuthenticated) {
      return { hasAccess: false, isLoading: false, reason: 'not_authenticated' };
    }

    // Check role-specific access
    if (routePath.includes('/dashboard/farmer') && userRole !== 'agriculteur' && userRole !== 'admin') {
      return { hasAccess: false, isLoading: false, reason: 'wrong_role' };
    }

    if (routePath.includes('/dashboard/cooperative') && userRole !== 'cooperative' && userRole !== 'admin') {
      return { hasAccess: false, isLoading: false, reason: 'wrong_role' };
    }

    if (routePath.includes('/dashboard/lender') && userRole !== 'preteur' && userRole !== 'admin') {
      return { hasAccess: false, isLoading: false, reason: 'wrong_role' };
    }

    if (routePath.includes('/admin') && userRole !== 'admin') {
      return { hasAccess: false, isLoading: false, reason: 'admin_required' };
    }

    return { hasAccess: true, isLoading: false };
  };

  const accessResult = checkAccess();

  // Auto-redirect if no access
  useEffect(() => {
    if (!accessResult.isLoading && !accessResult.hasAccess) {
      if (accessResult.reason === 'not_authenticated') {
        router.push(`/auth/login?returnUrl=${encodeURIComponent(routePath)}`);
      } else {
        router.push(`/unauthorized?reason=${accessResult.reason}`);
      }
    }
  }, [accessResult, routePath, router]);

  return accessResult;
}

// HOC removed - use AuthGuard components instead