"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, Loader2, Camera, Trash2, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, BookMarked, Type, X, Sparkles } from "lucide-react";
import { saveQuestion, getQuestions, deleteQuestion, saveWord } from "@/lib/storage";
import type { QuestionRecord, QuestionAnalysis, WordEntry } from "@/lib/types";
import AIAssistant from "./AIAssistant";

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function Tag({ label, color = "blue" }: { label: string; color?: "blue" | "green" | "red" | "purple" | "yellow" }) {
  const colors = {
    blue: "bg-blue-100 text-blue-800",
    green: "bg-green-100 text-green-800",
    red: "bg-red-100 text-red-800",
    purple: "bg-purple-100 text-purple-800",
    yellow: "bg-yellow-100 text-yellow-800",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${colors[color]}`}>
      {label}
    </span>
  );
}

function AnalysisCard({ record, onDelete }: { record: QuestionRecord; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [selectedVocab, setSelectedVocab] = useState<string | null>(null);
  const [vocabDetail, setVocabDetail] = useState<any>(null);
  const [vocabLoading, setVocabLoading] = useState(false);
  const a = record.result;

  const handleAssistantConversationSave = (conversation: Array<{ role: string; content: string }>) => {
    // 可以在這裡保存對話記錄到學習紀錄，例如添加到筆記或統計中
    console.log("Assistant conversation saved:", conversation);
  };

  const handleVocabClick = async (vocab: string) => {
    setSelectedVocab(vocab);
    setVocabLoading(true);
    try {
      const res = await fetch("/api/analyze-vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: vocab }),
      });
      const data = await res.json();
      if (res.ok) {
        setVocabDetail(data.analysis);
      }
    } catch (err) {
      console.error("Failed to fetch vocabulary detail:", err);
    } finally {
      setVocabLoading(false);
    }
  };

  const handleAddToMap = () => {
    if (!selectedVocab || !vocabDetail) return;

    const entry: WordEntry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      word: vocabDetail.word,
      date: new Date().toISOString(),
      result: {
        word: vocabDetail.word,
        phonetic: vocabDetail.phonetic,
        chineseTranslation: vocabDetail.chineseTranslation,
        definitions: [
          {
            partOfSpeech: vocabDetail.partOfSpeech,
            definitions: [vocabDetail.definition],
            examples: [vocabDetail.example],
          },
        ],
        synonyms: [],
        antonyms: [],
        toeicSentences: [
          {
            sentence: vocabDetail.example,
            translation: vocabDetail.exampleTranslation,
            questionType: `${vocabDetail.toeicFrequency} frequency`,
          },
        ],
        notes: vocabDetail.tip,
      },
    };
    saveWord(entry);
    setSelectedVocab(null);
    setVocabDetail(null);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{a.questionText}</p>
            <div className="flex gap-1 mt-1 flex-wrap">
              <Tag label={a.toeicPart} color="blue" />
              <Tag label={a.questionType} color="purple" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-3 shrink-0">
          <span className="text-xs text-gray-400">
            {new Date(record.date).toLocaleDateString("zh-TW")}
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

      {expanded && (
        <div className="border-t border-gray-100 px-4 py-4 space-y-4">
          {/* image thumbnail */}
          {record.imageBase64 && (
            <img
              src={`data:image/jpeg;base64,${record.imageBase64}`}
              alt="TOEIC question"
              className="w-full max-h-48 object-contain rounded-lg border border-gray-200 bg-gray-50"
            />
          )}

          {/* correct answer */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-green-700 flex items-center gap-1 mb-1">
              <CheckCircle2 size={13} /> 正確答案
            </p>
            <p className="text-sm text-green-900 font-medium">{a.correctAnswer}</p>
          </div>

          {/* explanation */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">詳細解析</h4>
            <p className="text-sm text-gray-700 leading-relaxed">{a.explanation}</p>
          </div>

          {/* traps */}
          {a.traps.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2 flex items-center gap-1">
                <AlertCircle size={12} /> 陷阱分析
              </h4>
              <ul className="space-y-2">
                {a.traps.map((trap, i) => (
                  <li key={i} className="bg-red-50 border border-red-100 rounded-lg p-2.5 text-sm text-red-800 flex gap-2">
                    <span className="font-bold shrink-0">{i + 1}.</span>
                    <span>{trap}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* key vocabulary */}
          {a.keyVocabulary.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">關鍵字彙</h4>
              <div className="flex flex-wrap gap-1">
                {a.keyVocabulary.map((v) => (
                  <button
                    key={v}
                    onClick={() => handleVocabClick(v)}
                    className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 hover:text-blue-900 transition-colors cursor-pointer"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* study tip */}
          {a.studyTip && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-yellow-800 flex items-center gap-1 mb-1">
                <BookMarked size={13} /> 備考技巧
              </p>
              <p className="text-sm text-yellow-900">{a.studyTip}</p>
            </div>
          )}
        </div>
      )}

      {/* vocabulary detail modal */}
      {selectedVocab && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">{selectedVocab}</h3>
              <button
                onClick={() => {
                  setSelectedVocab(null);
                  setVocabDetail(null);
                }}
                className="p-2 hover:bg-white rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {vocabLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-blue-600" />
              </div>
            ) : vocabDetail ? (
              <div className="p-6 space-y-4">
                {/* pronunciation and translation */}
                <div>
                  {vocabDetail.phonetic && (
                    <p className="text-sm text-gray-500 font-mono mb-1">{vocabDetail.phonetic}</p>
                  )}
                  <p className="text-lg font-semibold text-blue-600">{vocabDetail.chineseTranslation}</p>
                  <span className="inline-block mt-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                    {vocabDetail.partOfSpeech}
                  </span>
                  <span className="inline-block ml-2 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                    {vocabDetail.toeicFrequency === "high" ? "高頻" : vocabDetail.toeicFrequency === "medium" ? "中頻" : "低頻"}
                  </span>
                </div>

                {/* definition */}
                <div>
                  <h4 className="text-xs font-semibold uppercase text-gray-500 mb-1">定義</h4>
                  <p className="text-sm text-gray-700">{vocabDetail.definition}</p>
                </div>

                {/* example */}
                <div>
                  <h4 className="text-xs font-semibold uppercase text-gray-500 mb-1">例句</h4>
                  <p className="text-sm text-gray-700 mb-1">{vocabDetail.example}</p>
                  <p className="text-xs text-gray-500 italic">{vocabDetail.exampleTranslation}</p>
                </div>

                {/* synonyms & antonyms */}
                {(vocabDetail.synonyms?.length > 0 || vocabDetail.antonyms?.length > 0) && (
                  <div className="border-t border-gray-200 pt-4 space-y-3">
                    {vocabDetail.synonyms?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">同義詞</h4>
                        <div className="flex flex-wrap gap-1">
                          {vocabDetail.synonyms.map((s: string) => (
                            <button
                              key={s}
                              onClick={() => handleVocabClick(s)}
                              className="inline-block px-2 py-1 bg-green-100 text-green-800 hover:bg-green-200 text-xs rounded-full font-medium transition-colors cursor-pointer"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {vocabDetail.antonyms?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">反義詞</h4>
                        <div className="flex flex-wrap gap-1">
                          {vocabDetail.antonyms.map((s: string) => (
                            <button
                              key={s}
                              onClick={() => handleVocabClick(s)}
                              className="inline-block px-2 py-1 bg-red-100 text-red-800 hover:bg-red-200 text-xs rounded-full font-medium transition-colors cursor-pointer"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* study tip */}
                <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                  <p className="text-xs font-semibold text-yellow-800 mb-1">🎯 學習提示</p>
                  <p className="text-sm text-yellow-900">{vocabDetail.tip}</p>
                </div>

                {/* add to map button */}
                <button
                  onClick={handleAddToMap}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                  加入詞彙地圖
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

export default function QuestionAnalyzer() {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  const [textInput, setTextInput] = useState("");
  const [useText, setUseText] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [records, setRecords] = useState<QuestionRecord[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // 初始化：只在客戶端執行
  useEffect(() => {
    setRecords(getQuestions());
  }, []);

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("請上傳圖片檔案（JPG、PNG、GIF、WebP）");
      return;
    }
    setMimeType(file.type);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
      const base64 = dataUrl.split(",")[1];
      setImageBase64(base64);
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, []);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleAnalyze = async () => {
    if (!imageBase64 && !textInput.trim()) return;
    setLoading(true);
    setError("");

    try {
      const body = useText || !imageBase64
        ? { text: textInput.trim() }
        : { imageBase64, mimeType };

      const res = await fetch("/api/analyze-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unknown error");

      const analysis: QuestionAnalysis = data.analysis;
      const record: QuestionRecord = {
        id: generateId(),
        date: new Date().toISOString(),
        imageBase64: useText ? undefined : (imageBase64 ?? undefined),
        result: analysis,
      };
      saveQuestion(record);
      setRecords(getQuestions());
      setPreview(null);
      setImageBase64(null);
      setTextInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "分析失敗，請再試一次");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    deleteQuestion(id);
    setRecords(getQuestions());
  };

  const canSubmit = !loading && (useText ? textInput.trim().length > 0 : imageBase64 !== null);

  return (
    <div className="space-y-6 relative">
      {/* AI Assistant */}
      {expanded && (
        <AIAssistant
          context={{
            questionText: a.questionText,
            correctAnswer: a.correctAnswer,
            explanation: a.explanation,
            questionType: a.questionType,
            toeicPart: a.toeicPart,
          }}
          onConversationSave={handleAssistantConversationSave}
        />
      )}
      {/* mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setUseText(false)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            !useText ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Camera size={15} /> 上傳圖片
        </button>
        <button
          onClick={() => setUseText(true)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            useText ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Type size={15} /> 文字輸入
        </button>
      </div>

      {/* upload / text area */}
      {!useText ? (
        <div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt="preview"
                className="w-full max-h-64 object-contain rounded-xl border border-gray-200 bg-gray-50"
              />
              <button
                onClick={() => { setPreview(null); setImageBase64(null); if (fileRef.current) fileRef.current.value = ""; }}
                className="absolute top-2 right-2 p-1.5 bg-white border border-gray-200 rounded-lg shadow-sm text-gray-500 hover:text-red-500 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileRef.current?.click()}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={() => setDragging(false)}
              className={`flex flex-col items-center justify-center gap-3 p-10 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                dragging ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
              }`}
            >
              <Upload size={36} className="text-gray-300" />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">點擊或拖曳上傳錯題圖片</p>
                <p className="text-xs text-gray-400 mt-1">支援 JPG、PNG、GIF、WebP</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <textarea
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="貼上 TOEIC 題目文字，例如：&#10;The report _____ by the manager before the deadline.&#10;(A) submit (B) submitted (C) was submitted (D) submitting"
          rows={5}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 placeholder-gray-400 resize-none"
          disabled={loading}
        />
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleAnalyze}
        disabled={!canSubmit}
        className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
        {loading ? "分析中..." : "分析錯題"}
      </button>

      {/* history */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          錯題記錄 ({records.length})
        </h3>
        {records.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Camera size={48} className="mx-auto mb-3 opacity-30" />
            <p>還沒有錯題記錄</p>
            <p className="text-sm mt-1">上傳錯題開始分析！</p>
          </div>
        ) : (
          <div className="space-y-2">
            {records.map((record) => (
              <AnalysisCard
                key={record.id}
                record={record}
                onDelete={() => handleDelete(record.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
