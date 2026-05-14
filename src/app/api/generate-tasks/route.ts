import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
  try {
    const { projectName, projectArchetype, projectDescription } = await request.json();

    // Initialize Gemini (Defaults to process.env.GEMINI_API_KEY)
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are an expert Project Manager. I am creating a project called "${projectName}".
      The archetype/category is: "${projectArchetype}".
      The main objective is: "${projectDescription || 'No description provided.'}".
      
      Generate exactly 5 highly structured, actionable tasks to kickstart this project backlog.
      Return ONLY a valid JSON array of objects. Do not use markdown formatting blocks like \`\`\`json.
      The output format MUST be exactly: 
      [
        {"title": "Actionable Task Name", "description": "Detailed acceptance criteria and instructions"},
        {"title": "Actionable Task Name", "description": "Detailed acceptance criteria and instructions"}
      ]
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    
    // Clean up any rogue markdown formatting the AI might try to add
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const tasks = JSON.parse(text);

    return NextResponse.json({ tasks });
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return NextResponse.json({ error: "Failed to generate tasks" }, { status: 500 });
  }
}