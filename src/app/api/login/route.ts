import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Normalize the identifier to lowercase and remove accidental spaces
    const identifier = body.identifier?.toLowerCase().trim();
    const password = body.password;

    // 1. Find the user by either Username OR Email (Case-Insensitive)
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .or(`username.eq."${identifier}",email.eq."${identifier}"`)
      .single();

    // 2. Security Check: If user doesn't exist or DB errors out
    if (error || !user) {
      console.log(`Login attempt failed for identifier: ${identifier}`);
      return NextResponse.json(
        { error: "Invalid credentials. Please check your username/email and try again." },
        { status: 401 }
      );
    }

    // 3. Verify the Password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid credentials. Please check your password and try again." },
        { status: 401 }
      );
    }

    // 4. Authentication Successful - Issue the Security Cookie
    const response = NextResponse.json(
      { message: "Login successful", user: { username: user.username, name: user.name } },
      { status: 200 }
    );

    response.cookies.set("getdone-session", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, 
      path: "/",
    });

    return response;

  } catch (error: any) {
    console.error("Login System Error:", error.message);
    return NextResponse.json(
      { error: "Connection Failed. Please try again." },
      { status: 500 }
    );
  }
}