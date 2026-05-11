import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import type { QuestionAnalysis } from "@/lib/types";

const client = new Anthropic();

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
  try {
    const body = (await req.json()) as {
      imageBase64?: string;
      mimeType?: string;
      text?: string;
    };

    const userContent: Anthropic.MessageParam["content"] = [];

    if (body.imageBase64) {
      const mime = (body.mimeType ?? "image/jpeg") as
        | "image/jpeg"
        | "image/png"
        | "image/gif"
        | "image/webp";
      userContent.push({
        type: "image",
        source: {
          type: "base64",
          media_type: mime,
          data: body.imageBase64,
        },
      });
      userContent.push({
        type: "text",
        text: "Please analyze this TOEIC question image.",
      });
    } else if (body.text) {
      userContent.push({
        type: "text",
        text: `Please analyze this TOEIC question:\n\n${body.text}`,
      });
    } else {
      return NextResponse.json(
        { error: "Image or text is required" },
        { status: 400 }
      );
    }

    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 2048,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userContent }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }

    const raw = textBlock.text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
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
