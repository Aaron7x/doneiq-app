import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if a 'session' cookie exists
  const session = request.cookies.get('getdone-session');

  const { pathname } = request.nextUrl;

  // 1. Allow the request if it's for the Register page or the landing page
  if (pathname === '/' || pathname === '/register' || pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // 2. Redirect to Register if there is no session and they try to access Dashboard
  if (!session) {
    return NextResponse.redirect(new URL('/register', request.url));
  }

  return NextResponse.next();
}

// Only run this middleware on these specific paths
export const config = {
  matcher: ['/dashboard/:path*', '/projects/:path*'], 
};