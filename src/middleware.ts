import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 1. Fetch the active user to verify the session
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl;

  // 2. Allow public routes
  if (pathname === '/' || pathname === '/register' || pathname === '/login' || pathname.startsWith('/api')) {
    return supabaseResponse;
  }

  // 3. Protect specific routes (Dashboard & Projects) just like your old setup
  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/projects');

  if (isProtectedRoute && !user) {
    // Redirect to Register if there is no session
    return NextResponse.redirect(new URL('/register', request.url));
  }

  return supabaseResponse;
}

// Supabase requires matching all routes to keep tokens fresh in the background
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}