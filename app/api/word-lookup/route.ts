import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import type { WordAnalysis } from "@/lib/types";
import { isAuthenticated, unauthorizedResponse } from "@/lib/auth";

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Stable system prompt — cached across all word lookups
const SYSTEM_PROMPT = `You are an expert TOEIC English tutor with deep knowledge of TOEIC exam vocabulary and question patterns. When given a word, provide a comprehensive analysis in JSON format.

You must respond with ONLY valid JSON matching this exact structure (no markdown, no extra text):
{
  "word": "string",
  "phonetic": "string (IPA notation)",
  "chineseTranslation": "string (Traditional Chinese translation of the word)",
  "definitions": [
    {
      "partOfSpeech": "string (noun/verb/adjective/adverb/etc)",
      "definitions": ["string", ...],
      "examples": ["string", ...]
    }
  ],
  "synonyms": ["string", ...],
  "antonyms": ["string", ...],
  "toeicSentences": [
    {
      "sentence": "string (realistic TOEIC-style English sentence)",
      "translation": "string (Traditional Chinese translation)",
      "questionType": "string (e.g. Part 5 Grammar, Part 6 Vocabulary, Part 7 Reading)"
    }
  ],
  "notes": "string (optional TOEIC exam tips about this word)"
}

Rules:
- Include 2-4 parts of speech if applicable
- Provide 3-5 synonyms and 2-3 antonyms where applicable
- Include exactly 3 TOEIC example sentences covering different exam contexts (business email, meeting, report, etc.)
- Translations must be in Traditional Chinese (繁體中文)
- TOEIC sentences should reflect actual TOEIC vocabulary level and business context`;

export async function POST(req: NextRequest) {
  // 檢查認證
  if (!isAuthenticated(req)) {
    return unauthorizedResponse();
  }

  try {
    const { word } = (await req.json()) as { word: string };
    if (!word?.trim()) {
      return NextResponse.json({ error: "Word is required" }, { status: 400 });
    }

    const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });
    const response = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${SYSTEM_PROMPT}\n\nAnalyze the TOEIC word: "${word.trim()}"`,
            },
          ],
        },
      ],
    });

    const text = response.response.text();
    if (!text) {
      throw new Error("No text response from Gemini");
    }

    // Strip potential markdown fences
    const raw = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    const analysis: WordAnalysis = JSON.parse(raw);

    return NextResponse.json({ analysis });
  } catch (err) {
    console.error("word-lookup error:", err);
    return NextResponse.json(
      { error: "Failed to analyze word. Please try again." },
      { status: 500 }
    );
  }
}
