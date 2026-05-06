import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, username, email, password, faxNumber } = body;
    
    // HONEYPOT CHECK: If faxNumber is filled out, a bot did it.
    // We return a "201 Created" success so the bot stops trying, 
    // but we return BEFORE touching the database.
    if (faxNumber && faxNumber.length > 0) {
      console.log("Bot detected via Honeypot. Ignoring registration.");
      return NextResponse.json({ message: "User created" }, { status: 201 });
    }

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

    // 2. Register directly with Supabase Auth
    // We pass the extra fields (firstName, lastName, username) into user_metadata
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password: password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          username: username,
        }
      }
    });

    if (error) {
      if (error.message.includes("already registered") || error.status === 400) {
        return NextResponse.json(
          { error: "Email Address is already in use. Please try again or Login." }, 
          { status: 400 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // 3. Registration Successful! 
    // The @supabase/ssr client automatically drops the secure session cookies.
    return NextResponse.json({ message: "User created successfully" }, { status: 201 });

  } catch (error: any) {
    console.error("Registration Error:", error.message);
    return NextResponse.json({ error: "Connection Failed. Please try again." }, { status: 500 });
  }
}