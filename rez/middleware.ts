import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of public routes
const PUBLIC_PATHS = ['/sign-in'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Example: Check for a Firebase Auth token in cookies
  // You should set this cookie on sign-in (e.g., 'firebaseToken')
  const token = request.cookies.get('firebaseToken');

  // If no token, redirect to sign-in
  if (!token) {
    const signInUrl = new URL('/sign-in', request.url);
    return NextResponse.redirect(signInUrl);
  }

  // TODO: Optionally, validate the token here (e.g., verify JWT)

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
     * - Files with extensions (static assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};