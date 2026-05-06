import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function POST(req: Request) {
  try {
    const { projectId, tasks } = await req.json();
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

    // 3. Map the tasks using the real SECURE user.id
    const tasksToInsert = tasks.map((taskTitle: string) => ({
      title: taskTitle,
      project_id: projectId,
      user_id: user.id,
      status: 'PRE_PLANNING',
      priority: 'MEDIUM'
    }));

    // 4. Perform the bulk insert
    const { data, error: insertError } = await supabase
      .from("tasks")
      .insert(tasksToInsert)
      .select();

    if (insertError) {
      console.error("SUPABASE BULK INSERT ERROR:", insertError.message);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: data?.length || 0 });
  } catch (error: any) {
    console.error("BULK TASK ROUTE ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}