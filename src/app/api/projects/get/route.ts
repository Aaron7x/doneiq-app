import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = cookies();
    const session = cookieStore.get("getdone-session");

    if (!session || session.value !== "true") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // We fetch and sort. If created_at exists now, it will work.
    // If not, it will default to sorting by name.
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase Error:", error.message);
      // Fallback: Try fetching without the sort if created_at is still being grumpy
      const fallback = await supabase.from("projects").select("*");
      return NextResponse.json(fallback.data || []);
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}