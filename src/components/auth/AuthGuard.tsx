'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRoles?: string[];
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export function AuthGuard({
  children,
  requireAuth = true,
  requiredRoles = [],
  redirectTo,
  fallback,
}: AuthGuardProps) {
  const { 
    profile, 
    loading, 
    initialized, 
    isAuthenticated, 
    hasAnyRole 
  } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!initialized || loading) {
      return;
    }

    // If auth is required but user is not authenticated
    if (requireAuth && !isAuthenticated) {
      const loginUrl = redirectTo || `/auth/login?redirect=${encodeURIComponent(pathname)}`;
      router.push(loginUrl);
      return;
    }

    // If specific roles are required
    if (requiredRoles.length > 0 && isAuthenticated) {
      if (!profile) {
        // Profile not loaded yet, wait
        return;
      }

      if (!hasAnyRole(requiredRoles)) {
        // User doesn't have required role
        if (requiredRoles.includes('admin')) {
          router.push('/unauthorized');
        } else {
          router.push('/dashboard');
        }
        return;
      }
    }

    // If user is authenticated but on auth pages, redirect to dashboard
    if (isAuthenticated && pathname.startsWith('/auth')) {
      router.push('/dashboard');
      return;
    }
  }, [
    initialized,
    loading,
    isAuthenticated,
    profile,
    requireAuth,
    requiredRoles,
    hasAnyRole,
    router,
    pathname,
    redirectTo,
  ]);

  // Show loading only during initial initialization (first load)
  // But if user is already authenticated, show content immediately
  if (!initialized) {
    // Si l'utilisateur est déjà authentifié (session en cours), afficher le contenu
    // Cela évite le spinner lors de la navigation entre pages
    if (isAuthenticated && !requiredRoles.length) {
      return <>{children}</>;
    }
    return fallback || <AuthLoadingFallback />;
  }

  // If auth is required but user is not authenticated, show loading briefly
  // (redirect will happen in useEffect)
  if (requireAuth && !isAuthenticated) {
    return fallback || <AuthLoadingFallback />;
  }

  // If roles are required but user doesn't have them, show loading
  // (redirect will happen in useEffect)
  if (requiredRoles.length > 0 && isAuthenticated && profile && !hasAnyRole(requiredRoles)) {
    return fallback || <AuthLoadingFallback />;
  }

  // If roles are required but profile is not loaded yet, show loading
  if (requiredRoles.length > 0 && isAuthenticated && !profile) {
    return fallback || <AuthLoadingFallback />;
  }

  return <>{children}</>;
}

function AuthLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground">Vérification de l&apos;authentification...</p>
      </div>
    </div>
  );
}

// Convenience components for common use cases
export function RequireAuth({ children, ...props }: Omit<AuthGuardProps, 'requireAuth'>) {
  return (
    <AuthGuard requireAuth={true} {...props}>
      {children}
    </AuthGuard>
  );
}

export function RequireRoles({ 
  roles, 
  children, 
  ...props 
}: Omit<AuthGuardProps, 'requiredRoles'> & { roles: string[] }) {
  return (
    <AuthGuard requireAuth={true} requiredRoles={roles} {...props}>
      {children}
    </AuthGuard>
  );
}

export function RequireAdmin({ children, ...props }: Omit<AuthGuardProps, 'requiredRoles'>) {
  return (
    <AuthGuard requireAuth={true} requiredRoles={['admin']} {...props}>
      {children}
    </AuthGuard>
  );
}

export function GuestOnly({ children, ...props }: Omit<AuthGuardProps, 'requireAuth'>) {
  return (
    <AuthGuard requireAuth={false} {...props}>
      {children}
    </AuthGuard>
  );
}