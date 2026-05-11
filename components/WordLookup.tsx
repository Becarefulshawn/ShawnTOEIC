"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Loader2, BookOpen, ArrowLeftRight, Trash2, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { saveWord, getWords, deleteWord } from "@/lib/storage";
import type { WordEntry, WordAnalysis } from "@/lib/types";

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ── Tag chip ─────────────────────────────────────────────────────────────────
function Tag({ label, color = "blue" }: { label: string; color?: "blue" | "green" | "red" | "purple" }) {
  const colors = {
    blue: "bg-blue-100 text-blue-800",
    green: "bg-green-100 text-green-800",
    red: "bg-red-100 text-red-800",
    purple: "bg-purple-100 text-purple-800",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${colors[color]}`}>
      {label}
    </span>
  );
}

// ── Word result card ──────────────────────────────────────────────────────────
function WordCard({ entry, onDelete }: { entry: WordEntry; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const a = entry.result;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-lg text-gray-900">{a.word}</span>
              {a.chineseTranslation && (
                <span className="text-sm text-blue-600 font-medium">{a.chineseTranslation}</span>
              )}
            </div>
            {a.phonetic && (
              <span className="text-sm text-gray-400 font-mono">{a.phonetic}</span>
            )}
          </div>
          <div className="flex gap-1 flex-wrap">
            {a.definitions.map((d) => (
              <Tag key={d.partOfSpeech} label={d.partOfSpeech} color="purple" />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {new Date(entry.date).toLocaleDateString("zh-TW")}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={14} />
          </button>
          {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </div>

      {/* body */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-4 space-y-4">
          {/* definitions */}
          {a.definitions.map((group) => (
            <div key={group.partOfSpeech}>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                {group.partOfSpeech}
              </h4>
              <ul className="space-y-1">
                {group.definitions.map((def, i) => (
                  <li key={i} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-gray-400">{i + 1}.</span>
                    <span>{def}</span>
                  </li>
                ))}
              </ul>
              {group.examples.length > 0 && (
                <ul className="mt-1 space-y-1">
                  {group.examples.map((ex, i) => (
                    <li key={i} className="text-sm text-blue-600 italic pl-4 border-l-2 border-blue-200">
                      {ex}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          {/* synonyms / antonyms */}
          <div className="flex gap-6">
            {a.synonyms.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">同義詞</h4>
                <div className="flex flex-wrap gap-1">
                  {a.synonyms.map((s) => <Tag key={s} label={s} color="green" />)}
                </div>
              </div>
            )}
            {a.antonyms.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">反義詞</h4>
                <div className="flex flex-wrap gap-1">
                  {a.antonyms.map((s) => <Tag key={s} label={s} color="red" />)}
                </div>
              </div>
            )}
          </div>

          {/* TOEIC sentences */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
              TOEIC 例句
            </h4>
            <div className="space-y-2">
              {a.toeicSentences.map((s, i) => (
                <div key={i} className="bg-blue-50 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-gray-800">{s.sentence}</p>
                    <Tag label={s.questionType} color="blue" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{s.translation}</p>
                </div>
              ))}
            </div>
          </div>

          {/* notes */}
          {a.notes && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-yellow-800 mb-1">💡 TOEIC 考試提示</p>
              <p className="text-sm text-yellow-900">{a.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function WordLookup() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");
  const [entries, setEntries] = useState<WordEntry[]>([]);
  const [currentResult, setCurrentResult] = useState<WordAnalysis | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 初始化：只在客戶端執行
  useEffect(() => {
    setEntries(getWords());
  }, []);

  const handleLookup = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const word = query.trim();
    if (!word) return;
    setLoading(true);
    setError("");
    setCurrentResult(null);
    setAiSuggestion(null);

    try {
      const res = await fetch("/api/word-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unknown error");

      const analysis: WordAnalysis = data.analysis;
      setCurrentResult(analysis);
      setQuery("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "查詢失敗，請再試一次");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleAddToMap = () => {
    if (!currentResult) return;
    const entry: WordEntry = {
      id: generateId(),
      word: currentResult.word,
      date: new Date().toISOString(),
      result: currentResult,
    };
    saveWord(entry);
    setEntries(getWords());
    setCurrentResult(null);
    setAiSuggestion(null);
  };

  const handleAiSuggestion = async () => {
    if (!currentResult) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/word-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis: currentResult }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unknown error");
      setAiSuggestion(data.suggestion);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI 建議失敗");
    } finally {
      setAiLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    deleteWord(id);
    setEntries(getWords());
  };

  return (
    <div className="space-y-6">
      {/* search bar */}
      <form onSubmit={handleLookup} className="flex gap-2">
        <div className="relative flex-1">
          <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="輸入 TOEIC 單字（例如：negotiate）"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
          {loading ? "查詢中..." : "查詢"}
        </button>
      </form>

      {/* error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* result display */}
      {currentResult && (
        <div className="space-y-3">
          {/* quick preview */}
          <div className="bg-white rounded-xl border border-blue-200 overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold text-gray-900">{currentResult.word}</span>
                    {currentResult.chineseTranslation && (
                      <span className="text-base text-blue-600 font-medium">{currentResult.chineseTranslation}</span>
                    )}
                  </div>
                  {currentResult.phonetic && (
                    <span className="text-sm text-gray-500 font-mono mt-1">{currentResult.phonetic}</span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentResult.definitions.map((d) => (
                  <Tag key={d.partOfSpeech} label={d.partOfSpeech} color="purple" />
                ))}
              </div>
            </div>

            {/* definitions */}
            <div className="px-6 py-4 space-y-3">
              {currentResult.definitions.map((group, idx) => (
                <div key={group.partOfSpeech}>
                  {idx > 0 && <div className="border-t border-gray-100 pt-3" />}
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                    {group.partOfSpeech}
                  </h4>
                  <ul className="space-y-1.5 text-sm text-gray-700">
                    {group.definitions.map((def, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-gray-400 flex-shrink-0">{i + 1}.</span>
                        <span>{def}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {/* synonyms & antonyms */}
              {(currentResult.synonyms.length > 0 || currentResult.antonyms.length > 0) && (
                <div className="border-t border-gray-100 pt-3 flex gap-6">
                  {currentResult.synonyms.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">同義詞</h4>
                      <div className="flex flex-wrap gap-1">
                        {currentResult.synonyms.map((s) => (
                          <Tag key={s} label={s} color="green" />
                        ))}
                      </div>
                    </div>
                  )}
                  {currentResult.antonyms.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">反義詞</h4>
                      <div className="flex flex-wrap gap-1">
                        {currentResult.antonyms.map((s) => (
                          <Tag key={s} label={s} color="red" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* TOEIC examples */}
          {currentResult.toeicSentences.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
                  TOEIC 例句
                </h3>
                <div className="space-y-2.5">
                  {currentResult.toeicSentences.map((s, i) => (
                    <div key={i} className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <p className="text-sm text-gray-800">{s.sentence}</p>
                        <Tag label={s.questionType} color="blue" />
                      </div>
                      <p className="text-xs text-gray-600">{s.translation}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* notes if exists */}
          {currentResult.notes && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-yellow-800 mb-1">💡 TOEIC 考試提示</p>
              <p className="text-sm text-yellow-900">{currentResult.notes}</p>
            </div>
          )}

          {/* action buttons */}
          <div className="space-y-2">
            {/* AI suggestion result */}
            {aiSuggestion && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900">
                  <span className="font-semibold">✓ AI 分析：</span> {aiSuggestion}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleAddToMap}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
              >
                加入詞彙地圖
              </button>
              <button
                onClick={handleAiSuggestion}
                disabled={aiLoading}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm shadow-sm"
              >
                {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {aiLoading ? "分析中..." : "AI 建議"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
