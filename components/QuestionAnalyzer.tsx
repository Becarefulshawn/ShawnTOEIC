"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Loader2, Camera, Trash2, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, BookMarked, Type } from "lucide-react";
import { saveQuestion, getQuestions, deleteQuestion } from "@/lib/storage";
import type { QuestionRecord, QuestionAnalysis } from "@/lib/types";

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
  const a = record.result;

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
                {a.keyVocabulary.map((v) => <Tag key={v} label={v} color="blue" />)}
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
  const [records, setRecords] = useState<QuestionRecord[]>(() => getQuestions());
  const fileRef = useRef<HTMLInputElement>(null);

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
    <div className="space-y-6">
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
