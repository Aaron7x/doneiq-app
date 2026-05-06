import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, color, description, end_date, budget, archetype, ai_mode } = body;
    
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
              // Handled safely by Next.js
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

    // 3. Insert with explicit lowercase column names and the SECURE user_id
    const { data, error } = await supabase
      .from("projects")
      .insert([
        { 
          name, 
          color, 
          description,
          end_date: end_date || null,
          budget: budget ? parseFloat(budget) : null,
          archetype: archetype || 'general',
          ai_mode: ai_mode || 'passive',
          user_id: user.id 
        }
      ])
      .select();

    if (error) {
      console.error("SUPABASE INSERT ERROR:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data[0], { status: 201 });
  } catch (error: any) {
    console.error("CRITICAL ROUTE ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}