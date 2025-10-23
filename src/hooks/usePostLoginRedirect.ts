/**
 * Hook for handling post-login redirections
 * Provides utilities for role-based navigation after authentication
 */

import { useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { getPostLoginRedirectUrl, getLocaleFromPath, type UserRole } from '@/lib/auth/role-redirect';
import { getRedirectInfo, clearRedirectInfo } from '@/lib/auth/redirect-storage';

export function usePostLoginRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  const redirectAfterLogin = useCallback((userRole: UserRole) => {
    // Get locale from current pathname
    const locale = getLocaleFromPath(pathname);
    
    // Check for any stored redirect info
    const redirectInfo = getRedirectInfo();
    const returnUrl = redirectInfo?.returnUrl;
    
    // Clear stored redirect info
    clearRedirectInfo();
    
    // Get the appropriate redirect URL based on user role
    const redirectUrl = getPostLoginRedirectUrl(
      userRole,
      locale,
      returnUrl
    );
    
    // Perform the redirect
    router.push(redirectUrl);
  }, [router, pathname]);

  const redirectToRoleDashboard = useCallback((userRole: UserRole, locale?: string) => {
    const currentLocale = locale || getLocaleFromPath(pathname);
    const redirectUrl = getPostLoginRedirectUrl(userRole, currentLocale);
    
    console.log(`🏠 Dashboard redirect: ${userRole} → ${redirectUrl}`);
    router.push(redirectUrl);
  }, [router, pathname]);

  return {
    redirectAfterLogin,
    redirectToRoleDashboard,
  };
}

/**
 * Hook for getting role-specific URLs without navigation
 */
export function useRoleUrls() {
  const pathname = usePathname();
  
  const getRoleUrl = useCallback((userRole: UserRole, locale?: string) => {
    const currentLocale = locale || getLocaleFromPath(pathname);
    return getPostLoginRedirectUrl(userRole, currentLocale);
  }, [pathname]);

  return {
    getRoleUrl,
  };
}