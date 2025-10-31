import { NextResponse } from "next/server";
import type { NextRequest } from 'next/server';
import { 
  hasPermission,
  createRedirectUrl,
  SECURITY_HEADERS,
  type UserRole 
} from './lib/auth/middleware-auth';
import { createMiddlewareClient } from './lib/supabase/middleware';

// Supported locales
const LOCALES = ['en', 'fr', 'ln'] as const;
const DEFAULT_LOCALE = 'fr'; // French as default for RDC

// Development mode check
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Check if a route is protected (requires authentication)
 */
function isProtectedRoute(pathname: string): boolean {
  // Remove locale prefix for checking (e.g., /fr/, /en/, /ln/)
  const cleanPath = pathname.replace(/^\/[a-z]{2}\//, '/') || pathname;
  
  // Always allow auth routes - they should never be protected
  if (cleanPath.startsWith('/auth/')) {
    return false;
  }
  
  // Always allow public routes
  const publicRoutes = [
    '/',
    '/unauthorized',
    '/test-wallet', // Allow test routes in development
    '/test-contracts'
  ];
  
  const isExplicitlyPublic = publicRoutes.some(route => {
    if (route === '/') {
      return cleanPath === '/';
    }
    return cleanPath === route || cleanPath.startsWith(route + '/');
  });
  
  if (isExplicitlyPublic) {
    return false;
  }
  
  // Check protected routes
  const protectedPrefixes = ['/dashboard', '/admin'];
  return protectedPrefixes.some(prefix => cleanPath.startsWith(prefix));
}

/**
 * Get required role for a route
 */
function getRequiredRole(pathname: string): UserRole | null {
  // Remove locale prefix (e.g., /fr/, /en/, /ln/)
  const cleanPath = pathname.replace(/^\/[a-z]{2}\//, '/') || pathname;
  
  if (cleanPath.startsWith('/admin')) return 'admin';
  if (cleanPath.startsWith('/dashboard/farmer')) return 'agriculteur';
  if (cleanPath.startsWith('/dashboard/cooperative')) return 'cooperative';
  if (cleanPath.startsWith('/dashboard/lender')) return 'preteur';
  
  return null;
}

/**
 * Get the preferred locale from request
 */
function getLocale(request: NextRequest): string {
  // First check URL parameter
  const localeFromUrl = request.nextUrl.searchParams.get('lang');
  if (localeFromUrl && LOCALES.includes(localeFromUrl as typeof LOCALES[number])) {
    return localeFromUrl;
  }

  // Then check Accept-Language header
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    const preferredLocale = acceptLanguage
      .split(',')[0]
      .split('-')[0]
      .toLowerCase();
    
    if (LOCALES.includes(preferredLocale as typeof LOCALES[number])) {
      return preferredLocale;
    }
  }
  
  return DEFAULT_LOCALE;
}

/**
 * Check if pathname has locale prefix
 */
function hasLocalePrefix(pathname: string): boolean {
  return LOCALES.some(locale => 
    pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
}

/**
 * Extract locale from pathname
 */
function extractLocale(pathname: string): string {
  const segments = pathname.split('/');
  const potentialLocale = segments[1];
  return LOCALES.includes(potentialLocale as typeof LOCALES[number]) ? potentialLocale : DEFAULT_LOCALE;
}

/**
 * Remove locale prefix from pathname
 */
function removeLocalePrefix(pathname: string): string {
  return pathname.replace(/^\/[a-z]{2}\//, '/') || pathname;
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

/**
 * Handle authentication for protected routes using Supabase
 */
async function handleAuthentication(request: NextRequest, response: NextResponse) {
  try {
    // Create Supabase client for middleware
    const supabase = createMiddlewareClient(request, response);

    // Get the current user (more secure than getSession)
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { authenticated: false, error: userError?.message || 'No authenticated user' };
    }

    // Get user profile with role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, is_validated')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return { authenticated: false, error: 'Profile not found' };
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
      user: user,
      role: profile.role as UserRole
    };
  } catch (error: unknown) {
    console.error('Authentication error in middleware:', error);
    return { authenticated: false, error: 'Authentication failed' };
  }
}

/**
 * Get role-specific dashboard path
 */
function getRoleDashboardPath(role: UserRole, locale: string): string {
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
 * Main middleware function
 * Handles authentication, authorization, and internationalization
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and Next.js internals
  if (pathname.startsWith('/_next') || 
      pathname.startsWith('/favicon') ||
      pathname.startsWith('/screenshot') ||
      pathname.startsWith('/logo') ||
      pathname.startsWith('/icon') ||
      pathname.includes('.')) {
    return NextResponse.next();
  }

  // Create Supabase client for API routes to handle cookie updates
  // Handle API routes separately - just ensure cookies are refreshed
  if (pathname.startsWith('/api')) {
    const response = NextResponse.next();
    const supabase = createMiddlewareClient(request, response);
    try {
      // This refreshes the session cookies if needed
      await supabase.auth.getUser();
    } catch (error) {
      console.error('Error refreshing session for API route:', error);
    }
    return response;
  }

  // Skip authentication for development test routes in dev mode
  if (isDevelopment && (pathname.startsWith('/test-') || pathname.startsWith('/debug-'))) {
    return NextResponse.next();
  }

  // Handle locale routing
  const hasLocale = hasLocalePrefix(pathname);
  const locale = hasLocale ? extractLocale(pathname) : getLocale(request);
  const localizedPathname = hasLocale ? pathname : `/${locale}${pathname}`;
  const cleanPathname = removeLocalePrefix(localizedPathname);

  // Create response object early for Supabase cookie management
  let response = hasLocale ? NextResponse.next() : NextResponse.redirect(new URL(localizedPathname, request.url));

  // Check if route requires protection
  if (isProtectedRoute(cleanPathname)) {
    const authResult = await handleAuthentication(request, response);
    
    if (!authResult.authenticated) {
      console.log(`❌ Authentication failed for ${cleanPathname}: ${authResult.error}`);
      
      // Redirect to login with return URL
      const loginUrl = createRedirectUrl(
        `${request.nextUrl.origin}/${locale}/auth/login`,
        localizedPathname,
        'authentication_required'
      );
      return NextResponse.redirect(loginUrl);
    }

    // Handle generic /dashboard route - redirect to role-specific dashboard
    if (cleanPathname === '/dashboard' && authResult.role) {
      const roleDashboard = getRoleDashboardPath(authResult.role, locale);
      console.log(`🎯 Redirecting from generic dashboard to role-specific: ${roleDashboard}`);
      return NextResponse.redirect(new URL(roleDashboard, request.url));
    }

    // Check role-based access
    const requiredRole = getRequiredRole(cleanPathname);
    if (requiredRole && !hasPermission(authResult.role, requiredRole)) {
      console.log(`❌ Insufficient permissions for ${cleanPathname}. Required: ${requiredRole}, User: ${authResult.role}`);
      
      // If user is trying to access wrong dashboard, redirect to their correct one
      if (cleanPathname.startsWith('/dashboard/') && authResult.role) {
        const correctDashboard = getRoleDashboardPath(authResult.role, locale);
        console.log(`🔄 Redirecting to correct dashboard: ${correctDashboard}`);
        return NextResponse.redirect(new URL(correctDashboard, request.url));
      }
      
      const unauthorizedUrl = createRedirectUrl(
        `${request.nextUrl.origin}/${locale}/unauthorized`,
        localizedPathname,
        'insufficient_permissions'
      );
      return NextResponse.redirect(unauthorizedUrl);
    }

    console.log(`✅ Access granted to ${cleanPathname} for user ${authResult.user?.email} (${authResult.role})`);

    // Add user info to headers for downstream use
    response.headers.set('x-user-id', authResult.user?.id || '');
    response.headers.set('x-user-role', authResult.role || '');
    response.headers.set('x-user-email', authResult.user?.email || '');
    response.headers.set('x-user-authenticated', 'true');
    
    // Add security headers
    return addSecurityHeaders(response);
  }

  // Handle locale redirect if needed
  if (!hasLocale) {
    const redirectUrl = new URL(localizedPathname, request.url);
    response = NextResponse.redirect(redirectUrl);
  }

  // Add basic security headers to all responses
  return addSecurityHeaders(response);
}

export const config = {
  matcher: [
    // Skip all internal paths (_next)
    '/((?!_next).*)',
    // Optional: only run on root (/) URL
    // '/'
  ],
}