"use client";

import { useState } from "react";
import { BookOpen, Camera, BarChart2 } from "lucide-react";
import type { TabId } from "@/lib/types";
import WordLookup from "@/components/WordLookup";
import QuestionAnalyzer from "@/components/QuestionAnalyzer";
import LearningRecords from "@/components/LearningRecords";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "lookup", label: "查單字", icon: <BookOpen size={18} /> },
  { id: "analyze", label: "分析錯題", icon: <Camera size={18} /> },
  { id: "records", label: "學習紀錄", icon: <BarChart2 size={18} /> },
];

export default function Home() {
  const [tab, setTab] = useState<TabId>("lookup");

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50">
      {/* header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl">
            <BookOpen size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">TOEIC 學習工具</h1>
            <p className="text-xs text-gray-400">AI 驅動的單字查詢與錯題分析</p>
          </div>
        </div>

        {/* tab bar */}
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex gap-1 pb-0">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {tab === "lookup" && <WordLookup />}
        {tab === "analyze" && <QuestionAnalyzer />}
        {tab === "records" && <LearningRecords />}
      </main>
    </div>
  );
}
