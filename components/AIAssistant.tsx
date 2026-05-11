"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, X, ChevronDown, ChevronUp, MessageSquare } from "lucide-react";

interface AssistantProps {
  context?: {
    questionText?: string;
    correctAnswer?: string;
    options?: string[];
    explanation?: string;
    questionType?: string;
    toeicPart?: string;
  };
  onConversationSave?: (conversation: Array<{ role: string; content: string }>) => void;
}

export default function AIAssistant({ context, onConversationSave }: AssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch("/api/toeic-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, context }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
        onConversationSave?.(
          messages.concat([
            { role: "user", content: userMessage },
            { role: "assistant", content: data.answer },
          ])
        );
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "抱歉，無法獲取回應。請稍後再試。" },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "發生錯誤，請稍後再試。" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed left-6 bottom-6 z-40">
      {isOpen ? (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 w-80 h-96 flex flex-col overflow-hidden">
          {/* header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} className="text-white" />
              <h3 className="text-white font-semibold text-sm">TOEIC 助手</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-blue-800 rounded-lg transition-colors"
            >
              <ChevronDown size={18} className="text-white" />
            </button>
          </div>

          {/* messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 text-xs mt-4">
                <p>有任何 TOEIC 問題嗎？</p>
                <p className="mt-1">直接提問，我來幫助你！</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-gray-200 text-gray-900 rounded-bl-none"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 text-gray-900 px-3 py-2 rounded-lg text-sm">
                  <Loader2 size={16} className="animate-spin inline" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* input */}
          <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-3 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="輸入 TOEIC 問題..."
                disabled={loading}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all hover:scale-110 flex items-center justify-center"
        >
          <MessageSquare size={24} />
        </button>
      )}
    </div>
  );
}
