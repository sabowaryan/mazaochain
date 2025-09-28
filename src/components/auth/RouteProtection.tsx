/**
 * Route Protection Components
 * Provides client-side route protection that works with middleware
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useMiddlewareAuth, useRoleCheck } from '@/hooks/useMiddlewareAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { UserRole } from '@/lib/auth/middleware-auth';

interface RouteProtectionProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * Main route protection component
 */
export function RouteProtection({ 
  children, 
  requiredRole, 
  fallback,
  redirectTo 
}: RouteProtectionProps) {
  const { isAuthenticated, isLoading, userRole } = useMiddlewareAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    // Check authentication
    if (!isAuthenticated) {
      const loginUrl = `/auth/login?returnUrl=${encodeURIComponent(pathname)}`;
      router.push(redirectTo || loginUrl);
      return;
    }

    // Check role if required
    if (requiredRole) {
      const hasRequiredRole = userRole === requiredRole || userRole === 'admin';
      if (!hasRequiredRole) {
        const unauthorizedUrl = `/unauthorized?reason=insufficient_permissions&required=${requiredRole}&current=${userRole}`;
        router.push(redirectTo || unauthorizedUrl);
        return;
      }
    }

    setShouldRender(true);
  }, [isAuthenticated, isLoading, userRole, requiredRole, pathname, router, redirectTo]);

  if (isLoading) {
    return fallback || <RouteProtectionLoading />;
  }

  if (!shouldRender) {
    return fallback || <RouteProtectionLoading />;
  }

  return <>{children}</>;
}

/**
 * Role-specific protection components
 */
export function FarmerProtection({ children, fallback }: Omit<RouteProtectionProps, 'requiredRole'>) {
  return (
    <RouteProtection requiredRole="agriculteur" fallback={fallback}>
      {children}
    </RouteProtection>
  );
}

export function CooperativeProtection({ children, fallback }: Omit<RouteProtectionProps, 'requiredRole'>) {
  return (
    <RouteProtection requiredRole="cooperative" fallback={fallback}>
      {children}
    </RouteProtection>
  );
}

export function LenderProtection({ children, fallback }: Omit<RouteProtectionProps, 'requiredRole'>) {
  return (
    <RouteProtection requiredRole="preteur" fallback={fallback}>
      {children}
    </RouteProtection>
  );
}

export function AdminProtection({ children, fallback }: Omit<RouteProtectionProps, 'requiredRole'>) {
  return (
    <RouteProtection requiredRole="admin" fallback={fallback}>
      {children}
    </RouteProtection>
  );
}

/**
 * Component that shows content only if user has specific role
 */
interface RoleGateProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
  showLoading?: boolean;
}

export function RoleGate({ children, allowedRoles, fallback, showLoading = false }: RoleGateProps) {
  const { userRole, isLoading, isAuthenticated } = useMiddlewareAuth();

  if (isLoading && showLoading) {
    return <LoadingSpinner size="sm" />;
  }

  if (!isAuthenticated || !userRole) {
    return fallback || null;
  }

  const hasAllowedRole = allowedRoles.includes(userRole) || userRole === 'admin';
  
  if (!hasAllowedRole) {
    return fallback || null;
  }

  return <>{children}</>;
}

/**
 * Loading component for route protection
 */
function RouteProtectionLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Vérification des permissions...</p>
      </div>
    </div>
  );
}

/**
 * Hook for conditional rendering based on role
 */
export function useConditionalRender(allowedRoles: UserRole[]) {
  const { userRole, isAuthenticated } = useMiddlewareAuth();
  
  const canRender = isAuthenticated && userRole && 
    (allowedRoles.includes(userRole) || userRole === 'admin');
  
  return { canRender, userRole };
}

/**
 * Higher-order component for page-level protection
 */
export function withPageProtection<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole?: UserRole
) {
  return function ProtectedPage(props: P) {
    return (
      <RouteProtection requiredRole={requiredRole}>
        <Component {...props} />
      </RouteProtection>
    );
  };
}

/**
 * Component for development-only routes
 */
export function DevOnlyProtection({ children }: { children: React.ReactNode }) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (!isDevelopment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Accès Refusé</h1>
          <p className="text-gray-600 mt-2">Cette page n'est disponible qu'en mode développement.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}