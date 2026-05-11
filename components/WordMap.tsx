"use client";

import { useState, useEffect } from "react";
import { getWords } from "@/lib/storage";
import type { WordEntry } from "@/lib/types";
import { BookOpen, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { deleteWord } from "@/lib/storage";

function WordNode({ entry, onDelete }: { entry: WordEntry; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const a = entry.result;

  return (
    <div className="ml-4 mb-4">
      <div
        className="flex items-center gap-2 p-3 bg-white border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="font-bold text-lg text-blue-600">{a.word}</span>
          {a.chineseTranslation && (
            <span className="text-sm text-gray-600">({a.chineseTranslation})</span>
          )}
          <span className="text-xs text-gray-400 ml-auto">
            {new Date(entry.date).toLocaleString("zh-TW")}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors flex-shrink-0"
        >
          <Trash2 size={14} />
        </button>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>

      {expanded && (
        <div className="ml-6 mt-3 space-y-3 border-l-2 border-blue-100 pl-4">
          {/* 词性 */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">词性</p>
            <div className="flex flex-wrap gap-1">
              {a.definitions.map((d) => (
                <span
                  key={d.partOfSpeech}
                  className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                >
                  {d.partOfSpeech}
                </span>
              ))}
            </div>
          </div>

          {/* 同义词 */}
          {a.synonyms.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">同义词</p>
              <div className="flex flex-wrap gap-1">
                {a.synonyms.map((s) => (
                  <span
                    key={s}
                    className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 反义词 */}
          {a.antonyms.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">反义词</p>
              <div className="flex flex-wrap gap-1">
                {a.antonyms.map((s) => (
                  <span
                    key={s}
                    className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* TOEIC 例句 */}
          {a.toeicSentences.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">TOEIC 例句</p>
              <div className="space-y-2">
                {a.toeicSentences.map((s, i) => (
                  <div key={i} className="bg-blue-50 rounded p-2 text-xs">
                    <p className="text-gray-800 mb-1">{s.sentence}</p>
                    <p className="text-gray-500 italic">{s.translation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function WordMap() {
  const [entries, setEntries] = useState<WordEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setEntries(getWords());
  }, []);

  const filteredEntries = entries.filter((e) =>
    e.result.word.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (id: string) => {
    deleteWord(id);
    setEntries(getWords());
  };

  return (
    <div className="space-y-6">
      {/* header */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          查詢歷史
        </h3>
        <input
          type="text"
          placeholder="搜尋單字..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      {/* content */}
      {filteredEntries.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BookOpen size={48} className="mx-auto mb-3 opacity-30" />
          <p>還沒有查詢記錄</p>
          <p className="text-sm mt-1">在「查單字」中搜尋單字會自動記錄在此</p>
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-600 mb-4">
            共 {filteredEntries.length} 次查詢
          </p>
          <div className="space-y-2">
            {filteredEntries.map((entry) => (
              <WordNode
                key={entry.id}
                entry={entry}
                onDelete={() => handleDelete(entry.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
