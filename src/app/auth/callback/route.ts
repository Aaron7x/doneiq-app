import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options })
          },
        },
      }
    )

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error) {
        // --- START PROXY-AWARE REDIRECT ---
        const forwardedHost = request.headers.get('x-forwarded-host')
        const isLocalEnv = process.env.NODE_ENV === 'development'

        if (isLocalEnv) {
          // Local development (Laptop)
          return NextResponse.redirect(`${origin}${next}`)
        } else if (forwardedHost) {
          // Production VPS behind Nginx
          return NextResponse.redirect(`https://${forwardedHost}${next}`)
        } else {
          // Fallback
          return NextResponse.redirect(`${origin}${next}`)
        }
        // --- END PROXY-AWARE REDIRECT ---
      }
      console.error("Exchange Error:", error.message)
    } catch (err) {
      console.error("Critical Exchange Crash:", err)
    }
  }

  // Ensure the fallback error page also respects the proxy!
  const forwardedHost = request.headers.get('x-forwarded-host')
  const errorBaseUrl = forwardedHost ? `https://${forwardedHost}` : origin
  return NextResponse.redirect(`${errorBaseUrl}/login?error=auth-failed`)
}