import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
console.log("API Key present:", !!apiKey);
console.log("API Key length:", apiKey?.length || 0);

const client = new GoogleGenerativeAI(apiKey || "");
const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });

try {
  const response = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: "Say hello" }],
      },
    ],
  });
  console.log("✅ Gemini API works!");
  console.log("Response:", response.response.text().substring(0, 100));
} catch (err) {
  console.log("❌ Gemini API error:", err.message);
}
