import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: Request) {
  try {
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

    // 2. Fetch the REAL authenticated user securely
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 3. Fetch projects ONLY for the logged-in user, ordered by newest first
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Project GET Fetch Error:", error.message);
      throw error;
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error("Project Fetch Route Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}