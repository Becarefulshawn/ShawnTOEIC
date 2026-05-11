import type { WordEntry, QuestionRecord, LearningStats } from "./types";

const KEYS = {
  words: "toeic_words",
  questions: "toeic_questions",
} as const;

// ── Generic helpers ──────────────────────────────────────────────────────────

function load<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(key) ?? "[]") as T[];
  } catch {
    return [];
  }
}

function save<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

// ── Words ────────────────────────────────────────────────────────────────────

export function getWords(): WordEntry[] {
  return load<WordEntry>(KEYS.words);
}

export function saveWord(entry: WordEntry): void {
  const all = getWords();
  // replace if same word exists (re-lookup)
  const idx = all.findIndex(
    (w) => w.word.toLowerCase() === entry.word.toLowerCase()
  );
  if (idx >= 0) all[idx] = entry;
  else all.unshift(entry);
  save(KEYS.words, all);
}

export function deleteWord(id: string): void {
  save(KEYS.words, getWords().filter((w) => w.id !== id));
}

// ── Questions ────────────────────────────────────────────────────────────────

export function getQuestions(): QuestionRecord[] {
  return load<QuestionRecord>(KEYS.questions);
}

export function saveQuestion(record: QuestionRecord): void {
  const all = getQuestions();
  all.unshift(record);
  save(KEYS.questions, all);
}

export function deleteQuestion(id: string): void {
  save(KEYS.questions, getQuestions().filter((q) => q.id !== id));
}

// ── Weekly stats ─────────────────────────────────────────────────────────────

function isoWeek(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function getWeeklyStats(weeksBack = 8): LearningStats[] {
  const words = getWords();
  const questions = getQuestions();

  // generate last N week labels
  const weekLabels: string[] = [];
  for (let i = weeksBack - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    weekLabels.push(isoWeek(d));
  }

  return weekLabels.map((label) => ({
    weekLabel: label,
    wordsLearned: words.filter((w) => isoWeek(new Date(w.date)) === label)
      .length,
    questionsAnalyzed: questions.filter(
      (q) => isoWeek(new Date(q.date)) === label
    ).length,
  }));
}
