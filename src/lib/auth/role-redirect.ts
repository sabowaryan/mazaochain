/**
 * Role-based redirect utilities
 * Handles direct redirection to appropriate dashboard based on user role
 */

export type UserRole = "agriculteur" | "cooperative" | "preteur" | "admin";

/**
 * Get the default dashboard path for a user role
 */
export function getRoleDashboardPath(role: UserRole, locale: string = 'fr'): string {
  const basePath = `/${locale}/dashboard`;
  
  switch (role) {
    case 'agriculteur':
      return `${basePath}/farmer`;
    case 'cooperative':
      return `${basePath}/cooperative`;
    case 'preteur':
      return `${basePath}/lender`;
    case 'admin':
      return `/${locale}/admin`;
    default:
      return basePath;
  }
}

/**
 * Get user profile with role from Supabase
 */
export async function getUserProfile(supabase: any, userId: string) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, is_validated')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error(`Profile query failed: ${error.message}`);
  }

  if (!profile) {
    throw new Error('Profile not found');
  }

  return profile;
}

/**
 * Determine redirect URL after successful login
 */
export function getPostLoginRedirectUrl(
  role: UserRole, 
  locale: string = 'fr',
  returnUrl?: string
): string {
  // If there's a specific return URL, use it (but validate it's safe)
  if (returnUrl && isValidReturnUrl(returnUrl)) {
    return returnUrl;
  }

  // Otherwise, redirect to role-specific dashboard
  return getRoleDashboardPath(role, locale);
}

/**
 * Validate that a return URL is safe to redirect to
 */
function isValidReturnUrl(url: string): boolean {
  try {
    // Must be a relative URL or same origin
    if (url.startsWith('/')) {
      return true;
    }
    
    // If it's an absolute URL, check if it's same origin
    const urlObj = new URL(url);
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    
    return urlObj.origin === currentOrigin;
  } catch {
    return false;
  }
}

/**
 * Get locale from pathname or default
 */
export function getLocaleFromPath(pathname: string): string {
  const segments = pathname.split('/');
  const potentialLocale = segments[1];
  const supportedLocales = ['en', 'fr', 'ln'];
  
  return supportedLocales.includes(potentialLocale) ? potentialLocale : 'fr';
}