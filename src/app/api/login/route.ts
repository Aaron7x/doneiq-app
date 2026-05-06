import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Normalize the identifier to lowercase and remove accidental spaces
    const identifier = body.identifier?.toLowerCase().trim();
    const password = body.password;

    const cookieStore = cookies();

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
    );

    // 2. Authenticate directly with Supabase Auth
    // Note: Supabase Native Auth requires an email address.
    const { data, error } = await supabase.auth.signInWithPassword({
      email: identifier,
      password: password,
    });

    // 3. Security Check: If credentials fail
    if (error) {
      console.log(`Login attempt failed: ${error.message}`);
      return NextResponse.json(
        { error: "Invalid credentials. Please check your email and try again." },
        { status: 401 }
      );
    }

    // 4. Authentication Successful!
    // The @supabase/ssr client automatically sets the highly secure JWT cookies for us in Step 1.
    return NextResponse.json(
      { message: "Login successful" },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("Login System Error:", error.message);
    return NextResponse.json(
      { error: "Connection Failed. Please try again." },
      { status: 500 }
    );
  }
}