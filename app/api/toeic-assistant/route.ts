import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated, unauthorizedResponse } from "@/lib/auth";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a professional TOEIC English exam expert and tutor. Your role is to:
1. Answer only TOEIC-related questions (grammar, vocabulary, reading comprehension, listening, etc.)
2. Provide clear, concise explanations focused on TOEIC exam preparation
3. Help resolve discrepancies between different answers to the same question
4. Explain why one answer is correct and others are wrong
5. Give practical study tips and strategies specific to TOEIC
6. Use Traditional Chinese (繁體中文) for all explanations

If the question is not related to TOEIC, politely redirect the user back to TOEIC topics.

When analyzing a question, consider:
- Grammar tense and voice (active vs passive)
- Word choices and their suitability in context
- Common TOEIC question patterns
- The overall context of the sentence or passage`;

export async function POST(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return unauthorizedResponse();
  }

  try {
    const { message, context } = (await req.json()) as {
      message: string;
      context?: {
        questionText?: string;
        correctAnswer?: string;
        options?: string[];
        explanation?: string;
        questionType?: string;
        toeicPart?: string;
      };
    };

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    let contextText = "";
    if (context) {
      contextText = `\n\n[Current Question Context]\n`;
      if (context.questionText) contextText += `Question: ${context.questionText}\n`;
      if (context.options?.length) contextText += `Options: ${context.options.join(" | ")}\n`;
      if (context.correctAnswer) contextText += `Correct Answer: ${context.correctAnswer}\n`;
      if (context.questionType) contextText += `Type: ${context.questionType}\n`;
      if (context.toeicPart) contextText += `Part: ${context.toeicPart}\n`;
      if (context.explanation) contextText += `Analysis: ${context.explanation}\n`;
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
          content: `${message}${contextText}`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }

    return NextResponse.json({ answer: textBlock.text });
  } catch (err) {
    console.error("toeic-assistant error:", err);
    return NextResponse.json(
      { error: "Failed to get assistant response. Please try again." },
      { status: 500 }
    );
  }
}
