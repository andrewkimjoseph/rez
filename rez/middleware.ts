import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of public routes
const PUBLIC_PATHS = ['/sign-in'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always redirect "/" to "/dashboard"
  if (pathname === '/') {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Allow public routes
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    // If user is already signed in, redirect away from /sign-in
    const token = request.cookies.get('firebaseToken');
    if (token) {
      // Optionally, parse a user cookie for organizationId
      const orgId = request.cookies.get('organizationId');
      if (!orgId) {
        const onboardingUrl = new URL('/organization-onboarding', request.url);
        return NextResponse.redirect(onboardingUrl);
      }
      // Redirect to dashboard if already has org
      const dashboardUrl = new URL('/dashboard', request.url);
      return NextResponse.redirect(dashboardUrl);
    }
    return NextResponse.next();
  }

  // Check for a Firebase Auth token in cookies
  const token = request.cookies.get('firebaseToken');
  if (!token) {
    const signInUrl = new URL('/sign-in', request.url);
    return NextResponse.redirect(signInUrl);
  }

  // Check for organizationId in cookies
  const orgId = request.cookies.get('organizationId');
  if (orgId && pathname === '/organization-onboarding') {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }
  if (!orgId && pathname !== '/organization-onboarding') {
    const onboardingUrl = new URL('/organization-onboarding', request.url);
    return NextResponse.redirect(onboardingUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Files with extensions (static assets like .svg, .png, .css, .js, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};