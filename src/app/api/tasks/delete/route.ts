import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    const cookieStore = cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } 
            catch (error) {}
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 1. Proactively delete any comments tied to this task to prevent Foreign Key errors
    await supabase.from("comments").delete().eq("task_id", id);

    // 2. Proactively delete any subtasks tied to this task
    await supabase.from("tasks").delete().eq("parent_id", id);

    // 3. Finally, delete the main task itself (Ensuring it belongs to the user)
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id); 

    if (error) throw error;
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Task Delete Error:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}