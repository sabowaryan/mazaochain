import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const LOCALES = ['en', 'fr', 'ln'] as const;
const DEFAULT_LOCALE = 'fr';

const isProtectedRoute = createRouteMatcher([
  '/(en|fr|ln)/dashboard(.*)',
  '/(en|fr|ln)/admin(.*)',
]);

function getLocale(request: NextRequest): string {
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    const preferred = acceptLanguage.split(',')[0].split('-')[0].toLowerCase();
    if (LOCALES.includes(preferred as typeof LOCALES[number])) return preferred;
  }
  return DEFAULT_LOCALE;
}

function hasLocalePrefix(pathname: string): boolean {
  return LOCALES.some(l => pathname.startsWith(`/${l}/`) || pathname === `/${l}`);
}

function isClerkHandshake(request: NextRequest): boolean {
  const search = request.nextUrl.search;
  return (
    search.includes('__clerk_db_jwt') ||
    search.includes('__clerk_handshake') ||
    search.includes('__clerk_status') ||
    search.includes('__clerk_redirect_count')
  );
}

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') ||
    pathname.startsWith('/api/webhooks') ||
    pathname.startsWith('/api')
  ) {
    return NextResponse.next();
  }

  // Let Clerk handle its own handshake without locale redirects
  if (isClerkHandshake(request)) {
    return NextResponse.next();
  }

  if (isProtectedRoute(request)) {
    const locale = hasLocalePrefix(pathname)
      ? pathname.split('/')[1]
      : getLocale(request);
    await auth.protect({
      unauthenticatedUrl: `${request.nextUrl.origin}/${locale}/auth/login`,
    });
  }

  if (!hasLocalePrefix(pathname)) {
    const locale = getLocale(request);
    const redirectUrl = new URL(`/${locale}${pathname}`, request.url);
    // Preserve query params
    request.nextUrl.searchParams.forEach((value, key) => {
      redirectUrl.searchParams.set(key, value);
    });
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next|favicon|icon|logo|screenshot|.*\\..*).*)'],
};
