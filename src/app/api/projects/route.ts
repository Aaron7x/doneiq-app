import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, color, description, end_date, budget, archetype, ai_mode } = body;
    
    const cookieStore = cookies();
    const session = cookieStore.get("getdone-session");

    if (!session || session.value !== "true") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch the user safely
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .limit(1)
      .single();

    if (userError || !userData) {
      console.error("USER FETCH ERROR:", userError);
      return NextResponse.json({ error: "No user found in database" }, { status: 500 });
    }

    // 2. Insert with explicit lowercase column names
    const { data, error } = await supabase
      .from("projects")
      .insert([
        { 
          name: name, 
          color: color, 
          description: description,
          end_date: end_date || null,
          budget: budget ? parseFloat(budget) : null,
          archetype: archetype || 'general',
          ai_mode: ai_mode || 'passive',
          user_id: userData.id 
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