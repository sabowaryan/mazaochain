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

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') ||
    pathname.startsWith('/api')
  ) {
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
    return NextResponse.redirect(new URL(`/${locale}${pathname}`, request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next|favicon|icon|logo|screenshot|.*\\..*).*)'],
};
