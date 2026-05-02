import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { username, email, password, faxNumber } = await request.json();
    
    // HONEYPOT CHECK: If faxNumber is filled out, a bot did it.
    // We return a "201 Created" success so the bot stops trying, 
    // but we return BEFORE touching the database.
    if (faxNumber && faxNumber.length > 0) {
      console.log("Bot detected via Honeypot. Ignoring registration.");
      return NextResponse.json({ message: "User created" }, { status: 201 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('users')
      .insert([
        { 
          username, 
          email, 
          password: hashedPassword,
          name: username,
          role: 'USER' 
        }
      ])
      .select();

    if (error) {
      if (error.code === '23505' || error.message.includes("already exists")) {
        return NextResponse.json(
          { error: "Username and/or Email Address is already in use. Please try again or Login." }, 
          { status: 400 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const response = NextResponse.json({ message: "User created" }, { status: 201 });
    
    response.cookies.set('getdone-session', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, 
      path: '/',
    });

    return response;

  } catch (error: any) {
    return NextResponse.json({ error: "Connection Failed. Please try again." }, { status: 500 });
  }
}