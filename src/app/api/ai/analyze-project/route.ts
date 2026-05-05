import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERIC_AI_KEY || "");

export async function POST(req: Request) {
  try {
    const { name, objective, archetype } = await req.json();

    // 1. Prepare the Mock (The Safety Net)
    const mockResponse = {
      strategy: `The ${name} project will focus on ${archetype} best practices to achieve the goal of: ${objective}.`,
      suggested_tasks: [
        `Initialize ${name} core structure`,
        `Define requirements for ${archetype}`,
        `Create initial roadmap`,
        `Setup tracking for ${objective}`,
        `Review first milestone`
      ],
      is_mock: true // We'll know it's a mock in the console
    };

    // 2. Try the Real AI
    try {
      if (!process.env.GOOGLE_GENERIC_AI_KEY) throw new Error("Key missing");

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `Return JSON only: { "strategy": "2 sentences", "suggested_tasks": ["task1", "task2", "task3", "task4", "task5"] } 
                      Analyze project: Name: ${name}, Objective: ${objective}, Type: ${archetype}`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const cleanJson = responseText.replace(/```json|```/g, "").trim();
      
      return NextResponse.json({ ...JSON.parse(cleanJson), is_mock: false });

    } catch (aiError: any) {
      // If AI fails (404, key error, etc.), we silently log it and return the Mock
      console.warn("AI Route using Mock fallback due to:", aiError.message);
      return NextResponse.json(mockResponse);
    }

  } catch (error: any) {
    console.error("CRITICAL AI ROUTE ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}