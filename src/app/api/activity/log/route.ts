import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { description, type } = await req.json();
    const cookieStore = cookies();
    const session = cookieStore.get("getdone-session");

    // Security check
    if (!session || session.value !== "true") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user ID to associate with this activity
    const { data: user } = await supabase.from("users").select("id").limit(1).single();

    const { error } = await supabase.from("activity").insert({
      description,
      type,
      user_id: user?.id,
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