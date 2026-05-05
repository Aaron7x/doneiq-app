import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { title, description, priority, due_date } = await request.json();
    
    // 1. Check for your custom session cookie
    const cookieStore = cookies();
    const session = cookieStore.get("getdone-session");

    if (!session || session.value !== "true") {
      return NextResponse.json({ error: "Unauthorized - No Session" }, { status: 401 });
    }

    // 2. Since we aren't using Supabase Auth yet, we'll grab the first user
    // In the next step, we'll make this dynamic based on who is logged in
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .limit(1)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 3. Insert the task using the user ID we found
    const { data, error } = await supabase
      .from("tasks")
      .insert([
        { 
          user_id: userData.id, 
          title, 
          description: description || "",
          priority: priority || 'medium',
          due_date: due_date || null
        }
      ])
      .select();

    if (error) throw error;

    return NextResponse.json(data[0], { status: 201 });
  } catch (error: any) {
    console.error("Task API Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}