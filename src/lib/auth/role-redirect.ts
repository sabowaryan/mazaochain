/**
 * Role-based redirect utilities
 */

export type UserRole = 'agriculteur' | 'cooperative' | 'preteur' | 'admin';

export function getRoleDashboardPath(role: UserRole, locale: string = 'fr'): string {
  const basePath = `/${locale}/dashboard`;
  switch (role) {
    case 'agriculteur': return `${basePath}/farmer`;
    case 'cooperative': return `${basePath}/cooperative`;
    case 'preteur': return `${basePath}/lender`;
    case 'admin': return `/${locale}/admin`;
    default: return basePath;
  }
}

export function getPostLoginRedirectUrl(role: UserRole, locale: string = 'fr', returnUrl?: string): string {
  if (returnUrl && isValidReturnUrl(returnUrl)) return returnUrl;
  return getRoleDashboardPath(role, locale);
}

function isValidReturnUrl(url: string): boolean {
  try {
    if (url.startsWith('/')) return true;
    const urlObj = new URL(url);
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    return urlObj.origin === currentOrigin;
  } catch {
    return false;
  }
}

export function getLocaleFromPath(pathname: string): string {
  const segments = pathname.split('/');
  const potentialLocale = segments[1];
  return ['en', 'fr', 'ln'].includes(potentialLocale) ? potentialLocale : 'fr';
}
