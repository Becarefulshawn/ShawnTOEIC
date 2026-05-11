import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import type { WordAnalysis } from "@/lib/types";
import { isAuthenticated, unauthorizedResponse } from "@/lib/auth";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a TOEIC vocabulary expert. When given a word analysis, provide a brief recommendation in Traditional Chinese about whether the student should add this word to their learning map.

Consider:
1. Is this word commonly tested in TOEIC?
2. Is it at an appropriate difficulty level for TOEIC preparation?
3. Does it appear in business/professional contexts?
4. Has the student likely already mastered this word?

Respond with ONLY a single line of recommendation in Traditional Chinese. Examples:
- "這是 TOEIC Part 5 高頻字彙，強烈建議加入學習地圖"
- "實用的商務英文詞彙，建議加入"
- "這個字相對基礎，可選擇加入或跳過"
- "根據詞彙難度，不太適合作為 TOEIC 重點學習"

Be concise and actionable. Do NOT include any JSON, markdown, or extra formatting.`;

export async function POST(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return unauthorizedResponse();
  }

  try {
    const { analysis } = (await req.json()) as { analysis: WordAnalysis };
    if (!analysis?.word?.trim()) {
      return NextResponse.json({ error: "Analysis is required" }, { status: 400 });
    }

    const analysisText = `
Word: ${analysis.word}
Chinese Translation: ${analysis.chineseTranslation || "N/A"}
Definitions: ${analysis.definitions.map((d) => `${d.partOfSpeech}: ${d.definitions.join("; ")}`).join(" | ")}
Synonyms: ${analysis.synonyms.join(", ") || "None"}
Antonyms: ${analysis.antonyms.join(", ") || "None"}
TOEIC Sentences: ${analysis.toeicSentences.map((s) => s.sentence).join(" | ")}
Notes: ${analysis.notes || "None"}
`;

    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 256,
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
          content: `Provide a learning recommendation for this word:${analysisText}`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }

    const suggestion = textBlock.text.trim();

    return NextResponse.json({ suggestion });
  } catch (err) {
    console.error("word-suggestion error:", err);
    return NextResponse.json(
      { error: "Failed to generate suggestion. Please try again." },
      { status: 500 }
    );
  }
}
