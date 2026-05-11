import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import type { WordAnalysis } from "@/lib/types";
import { isAuthenticated, unauthorizedResponse } from "@/lib/auth";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert TOEIC English tutor. When given a single vocabulary word, provide a comprehensive analysis in JSON format focusing on TOEIC exam relevance.

You must respond with ONLY valid JSON matching this exact structure (no markdown, no extra text):
{
  "word": "string",
  "phonetic": "string (IPA notation)",
  "chineseTranslation": "string (Traditional Chinese translation)",
  "definition": "string (concise definition)",
  "toeicFrequency": "string (high/medium/low)",
  "partOfSpeech": "string (noun/verb/adjective/adverb/etc)",
  "example": "string (TOEIC-style example sentence in English)",
  "exampleTranslation": "string (Traditional Chinese translation of example)",
  "tip": "string (TOEIC study tip specific to this word)",
  "synonyms": ["string", ...],
  "antonyms": ["string", ...]
}

Rules:
- Be concise and focused
- Frequency assessment must be based on TOEIC exam data
- Example must be realistic for business/TOEIC context
- All translations must be in Traditional Chinese (繁體中文)
- Tip should give actionable advice for TOEIC preparation
- Include 3-5 synonyms and 2-3 antonyms where applicable
- Only include words that are relevant to TOEIC exam level`;

export async function POST(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return unauthorizedResponse();
  }

  try {
    const { word } = (await req.json()) as { word: string };
    if (!word?.trim()) {
      return NextResponse.json({ error: "Word is required" }, { status: 400 });
    }

    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: `Analyze this vocabulary word for TOEIC: "${word.trim()}"`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }

    const raw = textBlock.text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    const analysis = JSON.parse(raw);

    return NextResponse.json({ analysis });
  } catch (err) {
    console.error("analyze-vocabulary error:", err);
    return NextResponse.json(
      { error: "Failed to analyze vocabulary. Please try again." },
      { status: 500 }
    );
  }
}
