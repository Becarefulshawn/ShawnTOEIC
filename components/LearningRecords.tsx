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
import { BookOpen, Camera, TrendingUp, RefreshCw } from "lucide-react";

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
      <div className="p-3 bg-blue-50 rounded-xl text-blue-600">{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export default function LearningRecords() {
  const [stats, setStats] = useState<ReturnType<typeof getWeeklyStats>>([]);
  const [totalWords, setTotalWords] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);

  // 初始化：只在客戶端執行
  useEffect(() => {
    setStats(getWeeklyStats(8));
    setTotalWords(getWords().length);
    setTotalQuestions(getQuestions().length);
  }, []);

  const refresh = () => {
    setStats(getWeeklyStats(8));
    setTotalWords(getWords().length);
    setTotalQuestions(getQuestions().length);
  };

  const chartData = stats.map((s) => ({
    week: s.weekLabel.replace(/^\d{4}-/, ""),
    單字: s.wordsLearned,
    錯題: s.questionsAnalyzed,
  }));

  const thisWeek = stats[stats.length - 1];

  return (
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
        <StatCard label="累積單字" value={totalWords} icon={<BookOpen size={20} />} />
        <StatCard label="累積錯題" value={totalQuestions} icon={<Camera size={20} />} />
        <StatCard label="本週單字" value={thisWeek?.wordsLearned ?? 0} icon={<TrendingUp size={20} />} />
        <StatCard label="本週錯題" value={thisWeek?.questionsAnalyzed ?? 0} icon={<TrendingUp size={20} />} />
      </div>

      {/* chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-4">近 8 週學習紀錄</h4>
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

      {/* weekly breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h4 className="text-sm font-semibold text-gray-700">週次明細</h4>
        </div>
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
      </div>
    </div>
  );
}
