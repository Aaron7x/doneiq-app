import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  // Google sends us this code in the URL
  const code = searchParams.get('code')
  // We can pass a 'next' parameter to tell it where to go after (defaults to dashboard)
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = cookies()
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
              // Handled safely by middleware
            }
          },
        },
      }
    )
    
    // This is the magic line. It trades the Google URL code for secure server cookies.
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Now that the cookies are set, we can safely send them past the middleware!
  return NextResponse.redirect(`${origin}${next}`)
}