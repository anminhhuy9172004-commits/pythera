
import "dotenv/config";
import express from "express";
import { GoogleGenAI } from "@google/genai";

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(express.json({ limit: "1mb" }));

// Cho phép frontend local và website đã triển khai gọi API.
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigin =
    origin === "http://localhost:5173" ||
    (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL);

  if (allowedOrigin && origin) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header("Vary", "Origin");
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
      error: "Chưa tìm thấy GEMINI_API_KEY trong biến môi trường."
    });
    return;
  }

  const messages = req.body?.messages;

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "Vui lòng nhập câu hỏi." });
    return;
  }

  const history = messages
    .filter(
      (message: { role?: string; content?: string }) =>
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim().length > 0
    )
    .slice(-20)
    .map(
      (message: { role: string; content: string }) =>
        `${message.role === "assistant" ? "Trợ lý" : "Người dùng"}: ${message.content.slice(0, 12000)}`
    )
    .join("\n");

  if (!history.trim()) {
    res.status(400).json({ error: "Không tìm thấy nội dung hợp lệ." });
    return;
  }

  try {
    const response = await ai.interactions.create({
      model: "gemini-3.1-flash-lite",
      input:
        "Bạn là trợ lý AI hữu ích. Hãy trả lời rõ ràng, chính xác bằng tiếng Việt khi người dùng hỏi bằng tiếng Việt. Nếu không chắc chắn, hãy nói rõ.\n\n" +
        history
    });

    const answer = response.output_text?.trim();

    if (!answer) {
      res.status(502).json({
        error: "AI chưa trả về nội dung. Vui lòng thử lại."
      });
      return;
    }

    res.json({ answer });
  } catch (error: unknown) {
    console.error("Gemini API error:", error);

    res.status(502).json({
      error:
        error instanceof Error
          ? error.message
          : "Lỗi không xác định khi gọi Gemini API."
    });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Pythera API đang chạy tại cổng ${port}`);
});
