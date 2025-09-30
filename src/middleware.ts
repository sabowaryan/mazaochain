import { NextResponse } from "next/server";
import type { NextRequest } from 'next/server';
import { 
  validateAuthToken, 
  hasPermission,
  createRedirectUrl,
  SECURITY_HEADERS,
  type UserRole 
} from './lib/auth/middleware-auth';

// Supported locales
const LOCALES = ['en', 'fr', 'ln'] as const;
const DEFAULT_LOCALE = 'fr'; // French as default for RDC

// Development mode check
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Check if a route is protected (requires authentication)
 */
function isProtectedRoute(pathname: string): boolean {
  // Remove locale prefix for checking
  const cleanPath = pathname.replace(/^\/[a-z]{2}/, '') || '/';
  
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
  const cleanPath = pathname.replace(/^\/[a-z]{2}/, '') || '/';
  
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
  if (localeFromUrl && LOCALES.includes(localeFromUrl as any)) {
    return localeFromUrl;
  }

  // Then check Accept-Language header
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    const preferredLocale = acceptLanguage
      .split(',')[0]
      .split('-')[0]
      .toLowerCase();
    
    if (LOCALES.includes(preferredLocale as any)) {
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
  return LOCALES.includes(potentialLocale as unknown) ? potentialLocale : DEFAULT_LOCALE;
}

/**
 * Remove locale prefix from pathname
 */
function removeLocalePrefix(pathname: string): string {
  return pathname.replace(/^\/[a-z]{2}/, '') || '/';
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
async function handleAuthentication(request: NextRequest, pathname: string) {
  try {
    // Get Supabase auth cookies
    const accessToken = request.cookies.get('sb-access-token')?.value ||
                       request.cookies.get('supabase-auth-token')?.value ||
                       request.cookies.get('supabase.auth.token')?.value;
    
    const refreshToken = request.cookies.get('sb-refresh-token')?.value ||
                        request.cookies.get('supabase-refresh-token')?.value;

    if (!accessToken && !refreshToken) {
      return { authenticated: false, error: 'No auth tokens found' };
    }

    // Use the validateAuthToken function from middleware-auth
    if (accessToken) {
      const authResult = await validateAuthToken(accessToken);
      return authResult;
    }

    return { authenticated: false, error: 'No valid access token' };
  } catch (error) {
    console.error('Authentication error in middleware:', error);
    return { authenticated: false, error: 'Authentication failed' };
  }
}

/**
 * Main middleware function
 * Handles authentication, authorization, and internationalization
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files, API routes, and Next.js internals
  if (pathname.startsWith('/_next') || 
      pathname.startsWith('/api') || 
      pathname.includes('.') ||
      pathname === '/favicon.ico' ||
      pathname === '/sw.js' ||
      pathname === '/manifest.json' ||
      pathname === '/site.webmanifest') {
    return NextResponse.next();
  }

  // Skip authentication for development test routes in dev mode
  if (isDevelopment && (pathname.startsWith('/test-') || pathname.startsWith('/debug-'))) {
    return NextResponse.next();
  }

  // Handle locale routing
  const hasLocale = hasLocalePrefix(pathname);
  let locale = hasLocale ? extractLocale(pathname) : getLocale(request);
  let localizedPathname = hasLocale ? pathname : `/${locale}${pathname}`;
  let cleanPathname = removeLocalePrefix(localizedPathname);

  // Check if route requires protection
  if (isProtectedRoute(cleanPathname)) {
    console.log(`🔒 Protecting route: ${cleanPathname}`);
    
    const authResult = await handleAuthentication(request, cleanPathname);
    
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

    // Check role-based access
    const requiredRole = getRequiredRole(cleanPathname);
    if (requiredRole && !hasPermission(authResult.role, requiredRole)) {
      console.log(`❌ Insufficient permissions for ${cleanPathname}. Required: ${requiredRole}, User: ${authResult.role}`);
      
      const unauthorizedUrl = createRedirectUrl(
        `${request.nextUrl.origin}/${locale}/unauthorized`,
        localizedPathname,
        'insufficient_permissions'
      );
      return NextResponse.redirect(unauthorizedUrl);
    }

    console.log(`✅ Access granted to ${cleanPathname} for user ${authResult.user?.email} (${authResult.role})`);

    // Create response with user info in headers
    const response = hasLocale ? NextResponse.next() : NextResponse.redirect(new URL(localizedPathname, request.url));
    
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
    return NextResponse.redirect(redirectUrl);
  }

  // Add basic security headers to all responses
  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    // Skip all internal paths (_next)
    '/((?!_next).*)',
    // Optional: only run on root (/) URL
    // '/'
  ],
}