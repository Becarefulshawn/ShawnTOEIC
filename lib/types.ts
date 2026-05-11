// ── Word Lookup ──────────────────────────────────────────────────────────────

export interface WordEntry {
  id: string;
  word: string;
  date: string; // ISO string
  result: WordAnalysis;
}

export interface WordAnalysis {
  word: string;
  phonetic?: string;
  definitions: PartOfSpeechGroup[];
  synonyms: string[];
  antonyms: string[];
  toeicSentences: ToeicSentence[];
  notes?: string;
}

export interface PartOfSpeechGroup {
  partOfSpeech: string; // noun / verb / adjective / adverb ...
  definitions: string[];
  examples: string[];
}

export interface ToeicSentence {
  sentence: string;
  translation: string;
  questionType: string; // Part 5, Part 6, etc.
}

// ── Question Analysis ────────────────────────────────────────────────────────

export interface QuestionRecord {
  id: string;
  date: string;
  imageBase64?: string;
  result: QuestionAnalysis;
}

export interface QuestionAnalysis {
  questionText: string;
  correctAnswer: string;
  explanation: string;
  traps: string[];
  questionType: string;
  toeicPart: string;
  keyVocabulary: string[];
  studyTip: string;
}

// ── Records ──────────────────────────────────────────────────────────────────

export interface LearningStats {
  wordsLearned: number;
  questionsAnalyzed: number;
  weekLabel: string; // "2024-W22"
}

export type TabId = "lookup" | "analyze" | "records";
