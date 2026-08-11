import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/sign-in', '/terms-of-service', '/privacy-policy', '/about'];

function withNoIndex(response: NextResponse): NextResponse {
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/terms-of-service') {
    return withNoIndex(
      NextResponse.redirect('https://thecanvassing.xyz/rez/terms', 301),
    );
  }

  if (pathname === '/privacy-policy') {
    return withNoIndex(
      NextResponse.redirect('https://thecanvassing.xyz/rez/privacy', 301),
    );
  }

  if (pathname === '/') {
    const dashboardUrl = new URL('/dashboard', request.url);
    return withNoIndex(NextResponse.redirect(dashboardUrl));
  }

  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    if (pathname === '/sign-in') {
      const token = request.cookies.get('firebaseToken');
      if (token) {
        const orgId = request.cookies.get('organizationId');
        if (!orgId) {
          const onboardingUrl = new URL('/organization-onboarding', request.url);
          return withNoIndex(NextResponse.redirect(onboardingUrl));
        }
        const dashboardUrl = new URL('/dashboard', request.url);
        return withNoIndex(NextResponse.redirect(dashboardUrl));
      }
    }
    return withNoIndex(NextResponse.next());
  }

  const token = request.cookies.get('firebaseToken');
  if (!token) {
    const signInUrl = new URL('/sign-in', request.url);
    return withNoIndex(NextResponse.redirect(signInUrl));
  }

  const orgId = request.cookies.get('organizationId');
  if (orgId && pathname === '/organization-onboarding') {
    const dashboardUrl = new URL('/dashboard', request.url);
    return withNoIndex(NextResponse.redirect(dashboardUrl));
  }
  if (!orgId && pathname !== '/organization-onboarding') {
    const onboardingUrl = new URL('/organization-onboarding', request.url);
    return withNoIndex(NextResponse.redirect(onboardingUrl));
  }

  return withNoIndex(NextResponse.next());
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
