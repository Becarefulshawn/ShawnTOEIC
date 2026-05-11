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
import { BookOpen, Camera, TrendingUp, RefreshCw, ChevronDown, ChevronUp, X } from "lucide-react";
import type { WordEntry } from "@/lib/types";

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
  const [expandChart, setExpandChart] = useState(false);
  const [expandBreakdown, setExpandBreakdown] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // 初始化：只在客戶端執行
  useEffect(() => {
    const allWords = getWords();
    setStats(getWeeklyStats(8));
    setTotalWords(allWords.length);
    setTotalQuestions(getQuestions().length);
    setWords(allWords);
  }, []);

  const refresh = () => {
    const allWords = getWords();
    setStats(getWeeklyStats(8));
    setTotalWords(allWords.length);
    setTotalQuestions(getQuestions().length);
    setWords(allWords);
  };

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
          <StatCard label="累積錯題" value={totalQuestions} icon={<Camera size={20} />} />
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

      {/* review modal */}
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
