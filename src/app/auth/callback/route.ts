import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// THIS IS THE MAGIC LINE: It prevents Next.js from caching this route and causing a 502 crash.
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') ?? '/dashboard'

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
                console.error("Cookie setting error:", error)
              }
            },
          },
        }
      )

      console.log("Exchanging Google Code for Session...")
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error) {
        console.log("Exchange successful! Redirecting to dashboard.")
        return NextResponse.redirect(`${requestUrl.origin}${next}`)
      } else {
        console.error("Supabase Exchange Error:", error.message)
        return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent(error.message)}`)
      }
    }

    console.warn("No code found in URL. Redirecting to login.")
    return NextResponse.redirect(`${requestUrl.origin}/login`)
    
  } catch (err: any) {
    console.error("CRITICAL CALLBACK ERROR:", err.message)
    // If it fails, redirect to login instead of throwing a 502
    const origin = new URL(request.url).origin
    return NextResponse.redirect(`${origin}/login?error=server-error`)
  }
}