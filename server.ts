
import "dotenv/config";
import express from "express";
import { GoogleGenAI } from "@google/genai";

const app = express();
const port = 3001;

app.use(express.json({ limit: "1mb" }));

// Cho phép giao diện Vite gọi API ở cổng 5173
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
});

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, hasApiKey: Boolean(apiKey) });
});

app.post("/api/chat", async (req, res) => {
  if (!ai) {
    res.status(500).json({
      error: "Chưa tìm thấy GEMINI_API_KEY trong file .env."
    });
    return;
  }

  const messages = req.body?.messages;

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "Vui lòng nhập câu hỏi." });
    return;
  }

  const contents = messages
    .filter(
      (message: { role?: string; content?: string }) =>
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim().length > 0
    )
    .slice(-20)
    .map((message: { role: string; content: string }) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content.slice(0, 12000) }]
    }));

  if (contents.length === 0) {
    res.status(400).json({ error: "Không tìm thấy nội dung hợp lệ." });
    return;
  }

  try {
    const history = messages
  .slice(-20)
  .map(
    (message) =>
      `${message.role === "assistant" ? "Trợ lý" : "Người dùng"}: ${message.content}`
  )
  .join("\n");

const response = await ai.interactions.create({
  model: "gemini-3.1-flash-lite",
  input:
    "Bạn là trợ lý AI hữu ích. Hãy trả lời rõ ràng, chính xác bằng tiếng Việt khi người dùng hỏi bằng tiếng Việt. Nếu không chắc chắn, hãy nói rõ.\n\n" +
    history,
});

      

   const answer = response.output_text?.trim();

    if (!answer) {
      res.status(502).json({ error: "AI chưa trả về nội dung. Vui lòng thử lại." });
      return;
    }

    res.json({ answer });
  }  catch (error: unknown) {
  console.error("Gemini API error:", error);

  if (error instanceof Error) {
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
  }

  res.status(502).json({
    error:
      error instanceof Error
        ? error.message
        : "Lỗi không xác định khi gọi Gemini API.",
  });
}
});

app.listen(port, () => {
  console.log(`Pythera API đang chạy tại http://localhost:${port}`);
});
