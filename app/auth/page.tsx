"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, AlertCircle, Loader2 } from "lucide-react";

export default function AuthPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        setError("密碼錯誤，請重試");
        setPassword("");
        setLoading(false);
        return;
      }

      // 成功 → 重導向到首頁
      router.push("/");
    } catch (err) {
      setError("驗證失敗，請再試一次");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#f7f4ee" }}>
      <div className="w-full max-w-sm">
        {/* Logo Icon */}
        <div className="flex justify-center mb-8">
          <div className="p-4 rounded-full" style={{ backgroundColor: "#e8dcc8" }}>
            <Lock size={32} style={{ color: "#8b7355" }} />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-center mb-2" style={{ color: "#3d3d3d" }}>
          TOEIC 學習工具
        </h1>
        <p className="text-center text-sm mb-8" style={{ color: "#8b7355" }}>
          請輸入密碼
        </p>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3 rounded-lg flex gap-2" style={{ backgroundColor: "#fde8e8", border: "1px solid #f5c6c6" }}>
            <AlertCircle size={16} className="shrink-0 mt-0.5" style={{ color: "#d63232" }} />
            <p className="text-sm" style={{ color: "#d63232" }}>
              {error}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="輸入密碼"
              className="w-full px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: "#ffffff",
                borderColor: "#d4c9b9",
                border: "1px solid #d4c9b9",
                color: "#3d3d3d",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#8b7355";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 115, 85, 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#d4c9b9";
                e.currentTarget.style.boxShadow = "none";
              }}
              disabled={loading}
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full py-3 font-medium rounded-lg transition-all flex items-center justify-center gap-2"
            style={{
              backgroundColor: loading || !password.trim() ? "#d4c9b9" : "#8b7355",
              color: "#ffffff",
              cursor: loading || !password.trim() ? "not-allowed" : "pointer",
              opacity: loading || !password.trim() ? 0.6 : 1,
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                驗證中...
              </>
            ) : (
              "進入"
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs mt-8" style={{ color: "#a89d8f" }}>
          AI 驅動的 TOEIC 學習助手
        </p>
      </div>
    </div>
  );
}
