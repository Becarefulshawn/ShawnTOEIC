import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import type { WordAnalysis } from "@/lib/types";
import { isAuthenticated, unauthorizedResponse } from "@/lib/auth";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Check if input is a word family pattern (e.g., "decide(v.) → decision(n.) → decisive(adj.) → decided(adj./v.)")
function parseWordFamily(input: string): { words: string[]; family: Array<{ word: string; pos: string }> } | null {
  const pattern = /(\w+)\s*\([^)]+\)/g;
  const matches = Array.from(input.matchAll(pattern));

  if (matches.length >= 2) {
    const family = matches.map((match) => {
      const word = match[1];
      const fullMatch = match[0];
      const pos = fullMatch.match(/\(([^)]+)\)/)?.[1] || "unknown";
      return { word, pos };
    });

    const uniqueWords = [...new Set(family.map(f => f.word.toLowerCase()))];
    return { words: uniqueWords, family };
  }

  return null;
}

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

// System prompt for word family analysis
const WORD_FAMILY_SYSTEM_PROMPT = `You are an expert TOEIC English tutor analyzing word families (related words with different parts of speech derived from the same root). When given a word family, analyze it in JSON format focusing on TOEIC exam relevance.

You must respond with ONLY valid JSON matching this exact structure (no markdown, no extra text):
{
  "word": "string (root word, e.g., 'decide')",
  "wordFamily": [
    {
      "word": "string (the word form)",
      "partOfSpeech": "string (noun/verb/adjective/adverb/etc)",
      "chineseTranslation": "string (Traditional Chinese)",
      "definition": "string (brief definition)",
      "toeicFrequency": "string (TOEIC exam frequency: '高頻' / '中頻' / '低頻')",
      "isToeicFocus": "boolean (true if this form is commonly tested in TOEIC)",
      "example": "string (TOEIC-relevant example sentence)"
    }
  ],
  "notes": "string (analysis of which forms are most important for TOEIC, how they differ in usage and frequency)",
  "studyTip": "string (specific advice on studying this word family for TOEIC)"
}

Rules:
- Analyze each word form's frequency and importance in TOEIC exams
- Identify which forms are most commonly tested
- Explain key usage differences between forms
- All translations and examples must be in Traditional Chinese (繁體中文)
- Provide practical TOEIC study advice for this word family`;

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

    const trimmedWord = word.trim();
    const wordFamilyMatch = parseWordFamily(trimmedWord);

    let response;
    let userPrompt: string;

    if (wordFamilyMatch && wordFamilyMatch.family.length >= 2) {
      // Word family format detected
      const familyDisplay = wordFamilyMatch.family
        .map((f) => `${f.word}(${f.pos})`)
        .join(" → ");

      response = await client.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 2048,
        system: [
          {
            type: "text",
            text: WORD_FAMILY_SYSTEM_PROMPT,
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [
          {
            role: "user",
            content: `Analyze this word family for TOEIC: ${familyDisplay}. Focus on which forms are most important for the exam and how they're commonly used in TOEIC questions.`,
          },
        ],
      });
    } else {
      // Single word lookup
      response = await client.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 2048,
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
            content: `Analyze the TOEIC word: "${trimmedWord}"`,
          },
        ],
      });
    }

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }

    // Strip potential markdown fences
    const raw = textBlock.text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();

    // For word family, we need to handle the different response structure
    if (wordFamilyMatch && wordFamilyMatch.family.length >= 2) {
      const familyAnalysis = JSON.parse(raw);
      // Transform word family analysis to match WordAnalysis structure
      const analysis: WordAnalysis = {
        word: familyAnalysis.word,
        chineseTranslation: `${familyAnalysis.word} 單詞族群`,
        definitions: familyAnalysis.wordFamily.map((wf: any) => ({
          partOfSpeech: wf.partOfSpeech,
          definitions: [wf.definition],
          examples: [wf.example],
        })),
        synonyms: [],
        antonyms: [],
        toeicSentences: familyAnalysis.wordFamily
          .filter((wf: any) => wf.isToeicFocus)
          .map((wf: any) => ({
            sentence: wf.example,
            translation: `${wf.word}(${wf.partOfSpeech}) - ${wf.chineseTranslation}`,
            questionType: `${wf.toeicFrequency} - ${wf.partOfSpeech}`,
          })),
        notes: `${familyAnalysis.notes}\n\n🎯 ${familyAnalysis.studyTip}`,
      };
      return NextResponse.json({ analysis });
    } else {
      const analysis: WordAnalysis = JSON.parse(raw);
      return NextResponse.json({ analysis });
    }
  } catch (err) {
    console.error("word-lookup error:", err);
    return NextResponse.json(
      { error: "Failed to analyze word. Please try again." },
      { status: 500 }
    );
  }
}
