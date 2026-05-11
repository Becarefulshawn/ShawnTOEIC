"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getWeeklyStats, getWords, getQuestions } from "@/lib/storage";
import { BookOpen, Camera, TrendingUp, RefreshCw, ChevronDown, ChevronUp, X, AlertCircle } from "lucide-react";
import type { WordEntry, QuestionRecord } from "@/lib/types";

function StatCard({
  label,
  value,
  icon,
  onClick,
  clickable = false
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  onClick?: () => void;
  clickable?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 w-full text-left transition-all ${
        clickable ? "hover:border-blue-400 hover:shadow-sm cursor-pointer" : ""
      }`}
    >
      <div className="p-3 bg-blue-50 rounded-xl text-blue-600">{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </button>
  );
}

export default function LearningRecords() {
  const [stats, setStats] = useState<ReturnType<typeof getWeeklyStats>>([]);
  const [totalWords, setTotalWords] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [words, setWords] = useState<WordEntry[]>([]);
  const [questions, setQuestions] = useState<QuestionRecord[]>([]);
  const [expandChart, setExpandChart] = useState(false);
  const [expandBreakdown, setExpandBreakdown] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showQuestionReviewModal, setShowQuestionReviewModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // 初始化：只在客戶端執行
  useEffect(() => {
    const allWords = getWords();
    const allQuestions = getQuestions();
    setStats(getWeeklyStats(8));
    setTotalWords(allWords.length);
    setTotalQuestions(allQuestions.length);
    setWords(allWords);
    setQuestions(allQuestions);
  }, []);

  const refresh = () => {
    const allWords = getWords();
    const allQuestions = getQuestions();
    setStats(getWeeklyStats(8));
    setTotalWords(allWords.length);
    setTotalQuestions(allQuestions.length);
    setWords(allWords);
    setQuestions(allQuestions);
  };

  // 按照 TOEIC Part 和 Question Type 分組錯題
  const groupedQuestions = questions.reduce(
    (acc, q) => {
      const key = `${q.result.toeicPart} - ${q.result.questionType}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(q);
      return acc;
    },
    {} as Record<string, QuestionRecord[]>
  );

  const categoryList = Object.entries(groupedQuestions).sort(
    ([keyA], [keyB]) => keyA.localeCompare(keyB)
  );

  const chartData = stats.map((s) => ({
    week: s.weekLabel.replace(/^\d{4}-/, ""),
    單字: s.wordsLearned,
    錯題: s.questionsAnalyzed,
  }));

  const thisWeek = stats[stats.length - 1];

  return (
    <>
      <div className="space-y-6">
        {/* header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">學習總覽</h3>
          <button
            onClick={refresh}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors"
          >
            <RefreshCw size={13} /> 重新整理
          </button>
        </div>

        {/* summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="累積單字"
            value={totalWords}
            icon={<BookOpen size={20} />}
            clickable={totalWords > 0}
            onClick={() => totalWords > 0 && setShowReviewModal(true)}
          />
          <StatCard
            label="累積錯題"
            value={totalQuestions}
            icon={<Camera size={20} />}
            clickable={totalQuestions > 0}
            onClick={() => totalQuestions > 0 && setShowQuestionReviewModal(true)}
          />
          <StatCard label="本週單字" value={thisWeek?.wordsLearned ?? 0} icon={<TrendingUp size={20} />} />
          <StatCard label="本週錯題" value={thisWeek?.questionsAnalyzed ?? 0} icon={<TrendingUp size={20} />} />
        </div>

        {/* chart - collapsible */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <button
            onClick={() => setExpandChart(!expandChart)}
            className="w-full px-4 py-3 border-b border-gray-200 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <h4 className="text-sm font-semibold text-gray-700">近 8 週學習紀錄</h4>
            {expandChart ? (
              <ChevronUp size={18} className="text-gray-400" />
            ) : (
              <ChevronDown size={18} className="text-gray-400" />
            )}
          </button>
          {expandChart && (
            <div className="p-4">
              {totalWords === 0 && totalQuestions === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <TrendingUp size={40} className="opacity-30 mb-3" />
                  <p className="text-sm">還沒有學習記錄</p>
                  <p className="text-xs mt-1">查詢單字或分析錯題後會顯示在這裡</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                    <Bar dataKey="單字" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="錯題" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          )}
        </div>

        {/* weekly breakdown - collapsible */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <button
            onClick={() => setExpandBreakdown(!expandBreakdown)}
            className="w-full px-4 py-3 border-b border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <h4 className="text-sm font-semibold text-gray-700">週次明細</h4>
            {expandBreakdown ? (
              <ChevronUp size={18} className="text-gray-400" />
            ) : (
              <ChevronDown size={18} className="text-gray-400" />
            )}
          </button>
          {expandBreakdown && (
            <div className="divide-y divide-gray-50">
              {[...stats].reverse().map((s) => (
                <div key={s.weekLabel} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm text-gray-600">{s.weekLabel}</span>
                  <div className="flex gap-4 text-sm">
                    <span className="text-blue-600">
                      <span className="font-medium">{s.wordsLearned}</span>
                      <span className="text-gray-400 ml-1">單字</span>
                    </span>
                    <span className="text-orange-500">
                      <span className="font-medium">{s.questionsAnalyzed}</span>
                      <span className="text-gray-400 ml-1">錯題</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* question review modal */}
      {showQuestionReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white w-full max-h-[90vh] rounded-t-2xl overflow-hidden flex flex-col">
            {/* header */}
            <div className="sticky top-0 bg-gradient-to-r from-orange-50 to-red-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">累積錯題複習</h3>
                <p className="text-sm text-gray-500 mt-1">共 {questions.length} 道題目</p>
              </div>
              <button
                onClick={() => {
                  setShowQuestionReviewModal(false);
                  setSelectedCategory(null);
                }}
                className="p-2 hover:bg-white rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {/* content */}
            <div className="flex-1 overflow-y-auto">
              {selectedCategory === null ? (
                // Category list view
                <div className="p-6 space-y-3">
                  {categoryList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                      <Camera size={40} className="opacity-30 mb-3" />
                      <p className="text-sm">還沒有錯題記錄</p>
                    </div>
                  ) : (
                    categoryList.map(([category, items]) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className="w-full bg-white rounded-lg border border-gray-200 p-4 hover:border-orange-300 hover:bg-orange-50 transition-all text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{category}</h4>
                            <p className="text-sm text-gray-500 mt-1">
                              {items.length} 道題目
                            </p>
                          </div>
                          <ChevronDown size={20} className="text-gray-400" />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              ) : (
                // Question detail view
                <div className="p-6 space-y-4">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="mb-4 text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                  >
                    ← 返回分類
                  </button>
                  {groupedQuestions[selectedCategory]?.map((q, idx) => (
                    <div
                      key={q.id}
                      className="bg-white rounded-lg border border-gray-200 p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="text-sm font-semibold text-gray-700">
                          題目 {idx + 1}
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(q.date).toLocaleDateString("zh-TW")}
                        </span>
                      </div>

                      {/* question text */}
                      <div className="bg-gray-50 rounded p-3">
                        <p className="text-sm text-gray-800">{q.result.questionText}</p>
                      </div>

                      {/* correct answer */}
                      <div className="bg-green-50 rounded p-3 border border-green-200">
                        <p className="text-xs font-semibold text-green-800 mb-1">✓ 正確答案</p>
                        <p className="text-sm text-green-900">{q.result.correctAnswer}</p>
                      </div>

                      {/* explanation */}
                      <div className="bg-blue-50 rounded p-3">
                        <p className="text-xs font-semibold text-blue-800 mb-1">💡 詳細解析</p>
                        <p className="text-sm text-blue-900">{q.result.explanation}</p>
                      </div>

                      {/* traps */}
                      {q.result.traps.length > 0 && (
                        <div className="bg-yellow-50 rounded p-3">
                          <p className="text-xs font-semibold text-yellow-800 mb-2">⚠️ 陷阱分析</p>
                          <ul className="space-y-1">
                            {q.result.traps.map((trap, i) => (
                              <li key={i} className="text-xs text-yellow-900">
                                • {trap}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* key vocabulary */}
                      {q.result.keyVocabulary.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-2">📚 關鍵詞彙</p>
                          <div className="flex flex-wrap gap-1.5">
                            {q.result.keyVocabulary.map((vocab) => (
                              <span
                                key={vocab}
                                className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded"
                              >
                                {vocab}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* study tip */}
                      <div className="bg-indigo-50 rounded p-3 border border-indigo-200">
                        <p className="text-xs font-semibold text-indigo-800 mb-1">🎯 學習提示</p>
                        <p className="text-sm text-indigo-900">{q.result.studyTip}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* word review modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white w-full max-h-[90vh] rounded-t-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom">
            {/* header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">累積單字複習</h3>
                <p className="text-sm text-gray-500 mt-1">共 {words.length} 個單字</p>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="p-2 hover:bg-white rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {/* content */}
            <div className="flex-1 overflow-y-auto p-6">
              {words.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <BookOpen size={40} className="opacity-30 mb-3" />
                  <p className="text-sm">還沒有單字記錄</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {[...words].reverse().map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-lg font-bold text-gray-900">
                              {entry.result.word}
                            </span>
                            {entry.result.chineseTranslation && (
                              <span className="text-sm text-blue-600">
                                {entry.result.chineseTranslation}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {entry.result.definitions.map((d) => (
                              <span
                                key={d.partOfSpeech}
                                className="inline-block px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full"
                              >
                                {d.partOfSpeech}
                              </span>
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {new Date(entry.date).toLocaleDateString("zh-TW")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
