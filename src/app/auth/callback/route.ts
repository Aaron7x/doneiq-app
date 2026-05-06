import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // If a 'next' parameter exists (like ?next=/dashboard), use it. Otherwise go to dashboard.
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = cookies()
    
    // 1. Initialize the secure Server Client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch (error) {
              // Handled safely by Next.js Server Components
            }
          },
        },
      }
    )

    // 2. Exchange the Google code for a secure Supabase session
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // 3. Success! Redirect to the dashboard
      return NextResponse.redirect(`${origin}${next}`)
    } else {
      console.error("Auth Callback Error:", error.message)
    }
  }

  // If there's an error or no code was provided, send them back to login
  return NextResponse.redirect(`${origin}/login?error=auth-failed`)
}