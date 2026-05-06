import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: Request) {
  try {
    const { title, description, priority, due_date } = await request.json();
    
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

    // 3. Insert the task using the SECURE user_id
    const { data, error } = await supabase
      .from("tasks")
      .insert([
        { 
          user_id: user.id, 
          title, 
          description: description || "",
          priority: priority || 'medium',
          due_date: due_date || null
        }
      ])
      .select();

    if (error) {
      console.error("Task API Insert Error:", error.message);
      throw error;
    }

    return NextResponse.json(data[0], { status: 201 });
  } catch (error: any) {
    console.error("Task API Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}