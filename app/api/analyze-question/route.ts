import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import type { QuestionAnalysis } from "@/lib/types";
import { isAuthenticated, unauthorizedResponse } from "@/lib/auth";

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const SYSTEM_PROMPT = `You are an expert TOEIC exam analyst specializing in diagnosing why students get wrong answers. When given an image of a TOEIC question (or a text description of one), provide a thorough analysis in JSON format.

You must respond with ONLY valid JSON matching this exact structure (no markdown, no extra text):
{
  "questionText": "string (transcribe or describe the question)",
  "correctAnswer": "string (the correct answer with brief explanation why it's correct)",
  "explanation": "string (detailed explanation in Traditional Chinese - 繁體中文 - of why the correct answer is right)",
  "traps": ["string (describe each trap/distractor that confuses students, in Traditional Chinese)"],
  "questionType": "string (e.g. 詞性題, 時態題, 介系詞題, 詞彙題, 語法結構題)",
  "toeicPart": "string (Part 5 / Part 6 / Part 7)",
  "keyVocabulary": ["string (key vocabulary words from this question)"],
  "studyTip": "string (specific study tip in Traditional Chinese for this type of question)"
}

Rules:
- All explanations and study tips must be in Traditional Chinese (繁體中文)
- Be specific about exactly WHY each wrong answer is a trap
- Identify the core grammar/vocabulary concept being tested
- The studyTip should give actionable advice for future similar questions`;

export async function POST(req: NextRequest) {
  // 檢查認證
  if (!isAuthenticated(req)) {
    return unauthorizedResponse();
  }

  try {
    const body = (await req.json()) as {
      imageBase64?: string;
      mimeType?: string;
      text?: string;
    };

    const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

    if (body.imageBase64) {
      const mime = body.mimeType ?? "image/jpeg";
      parts.push({
        inlineData: {
          mimeType: mime,
          data: body.imageBase64,
        },
      });
      parts.push({
        text: "Please analyze this TOEIC question image.",
      });
    } else if (body.text) {
      parts.push({
        text: `Please analyze this TOEIC question:\n\n${body.text}`,
      });
    } else {
      return NextResponse.json(
        { error: "Image or text is required" },
        { status: 400 }
      );
    }

    parts.unshift({ text: SYSTEM_PROMPT });

    const response = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: parts,
        },
      ],
    });

    const text = response.response.text();
    if (!text) {
      throw new Error("No text response from Gemini");
    }

    const raw = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    const analysis: QuestionAnalysis = JSON.parse(raw);

    return NextResponse.json({ analysis });
  } catch (err) {
    console.error("analyze-question error:", err);
    return NextResponse.json(
      { error: "Failed to analyze question. Please try again." },
      { status: 500 }
    );
  }
}
