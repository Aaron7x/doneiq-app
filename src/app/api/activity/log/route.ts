import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function POST(req: Request) {
  try {
    const { description, type } = await req.json();
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

    // 2. Security check: Fetch the real authenticated user securely
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 3. Log the activity using the actual authenticated user ID
    const { error } = await supabase.from("activity").insert({
      description,
      type,
      user_id: user.id,
    });

    if (error) {
      console.error("Activity DB Insert Error:", error.message);
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Activity Route Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}