import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function PATCH(request: Request) {
  try {
    // We extract the 'id', and bundle everything else into an 'updates' object
    const body = await request.json();
    const { id, ...updates } = body; 
    
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

    // We pass the dynamic 'updates' object directly to Supabase
    const { error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id); 

    if (error) throw error;
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Task Update Error:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}