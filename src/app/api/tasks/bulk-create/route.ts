import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { projectId, tasks } = await req.json();
    const cookieStore = cookies();
    const session = cookieStore.get("getdone-session");

    if (!session || session.value !== "true") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch the user ID first
    const { data: userResponse, error: userError } = await supabase
      .from("users")
      .select("id")
      .limit(1)
      .single();

    if (userError || !userResponse) {
      console.error("USER FETCH ERROR:", userError?.message);
      return NextResponse.json({ error: "Could not find user" }, { status: 500 });
    }

    // 2. Map the tasks using the ID we just fetched
    const tasksToInsert = tasks.map((taskTitle: string) => ({
      title: taskTitle,
      project_id: projectId,
      user_id: userResponse.id, // Fixed the variable name here
      status: 'PRE_PLANNING',
      priority: 'MEDIUM'
    }));

    // 3. Perform the bulk insert
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