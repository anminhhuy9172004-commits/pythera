
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./App.css";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

type StyleMode = "Gemini" | "NotebookLM";

export default function App() {
  const [mode, setMode] = useState<StyleMode>("Gemini");
  const [dark, setDark] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const [chats, setChats] = useState<string[]>([]);
  const [activeChat, setActiveChat] = useState("Cuộc trò chuyện mới");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  function newChat() {
    setMessages([]);
    setInput("");
    setTyping(false);
    setActiveChat("Cuộc trò chuyện mới");
  }

  async function sendMessage(text = input) {
    const value = text.trim();
    if (!value || typing) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: value,
    };

    const conversation = [...messages, userMessage];
    setMessages(conversation);
    setInput("");
    setTyping(true);

    if (activeChat === "Cuộc trò chuyện mới") {
      const title = value.slice(0, 32);
      setActiveChat(title);
      setChats((old) => [title, ...old]);
    }

    try {
      const response = await fetch("http://localhost:3001/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: conversation.map(({ role, content }) => ({
            role,
            content,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const detail =
          typeof data.error === "string"
            ? data.error
            : data.error?.message ||
              JSON.stringify(data.error || `Lỗi HTTP ${response.status}`);

        throw new Error(detail);
      }

      if (typeof data.answer !== "string" || !data.answer.trim()) {
        throw new Error("AI chưa trả về câu trả lời.");
      }

      setMessages((old) => [
        ...old,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: data.answer,
        },
      ]);
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : "Lỗi không xác định.";

      setMessages((old) => [
        ...old,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: `Xin lỗi, mình chưa thể trả lời lúc này. Chi tiết: ${detail}`,
        },
      ]);
    } finally {
      setTyping(false);
    }
  }

  const quick = (prompt: string) => {
    void sendMessage(prompt);
  };

  return (
    <main
      className={`app ${dark ? "dark" : ""} ${
        mode === "NotebookLM" ? "notebook-mode" : ""
      }`}
    >
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">✦</div>
          <div className="brand-copy">
            <strong>Pythera</strong>
            <small>Your AI Workspace</small>
          </div>
          <span className="brand-collapse">«</span>
        </div>

        <button className="new-chat" onClick={newChat}>
          <span>＋</span> Cuộc trò chuyện mới
        </button>

        <nav className="primary-nav">
          <button className="side-item active" onClick={newChat}>
            <span>▢</span> Trò chuyện
          </button>
          <button
            className="side-item"
            onClick={() => setMode("NotebookLM")}
          >
            <span>▤</span> Tài liệu của tôi
          </button>
          <button
            className="side-item"
            onClick={() =>
              quick("Gợi ý những chủ đề thú vị để khám phá")
            }
          >
            <span>◉</span> Khám phá
          </button>
          <button
            className="side-item"
            onClick={() =>
              quick(
                "Gợi ý các công cụ AI hữu ích cho học tập và công việc"
              )
            }
          >
            <span>▦</span> Công cụ AI
          </button>
        </nav>

        <div className="side-section">
          <div className="section-heading">
            <span>KHÔNG GIAN LÀM VIỆC</span>
            <button
              onClick={() =>
                setMode(mode === "Gemini" ? "NotebookLM" : "Gemini")
              }
            >
              ＋
            </button>
          </div>

          <button
            className={`workspace-choice ${
              mode === "Gemini" ? "selected" : ""
            }`}
            onClick={() => setMode("Gemini")}
          >
            <span className="choice-icon gemini-icon">✦</span>
            <span>
              <strong>Gemini</strong>
              <small>Trợ lý AI đa năng</small>
            </span>
          </button>

          <button
            className={`workspace-choice ${
              mode === "NotebookLM" ? "selected" : ""
            }`}
            onClick={() => setMode("NotebookLM")}
          >
            <span className="choice-icon notebook-icon">▤</span>
            <span>
              <strong>NotebookLM</strong>
              <small>Học tập và nghiên cứu</small>
            </span>
          </button>
        </div>

        <div className="history-section">
          <div className="section-heading">
            <span>LỊCH SỬ TRÒ CHUYỆN</span>
            <span>⌕</span>
          </div>

          <p className="history-day">Hôm nay</p>

          <div className="chat-history">
            {chats.map((chat, i) => (
              <button
                key={`${chat}-${i}`}
                className={`history-item ${
                  activeChat === chat ? "history-active" : ""
                }`}
                onClick={() => setActiveChat(chat)}
                title={chat}
              >
                <span>▢</span>
                <span className="history-title">{chat}</span>
              </button>
            ))}

            {chats.length === 0 && (
              <p className="empty-history">
                Các cuộc trò chuyện của bạn sẽ xuất hiện ở đây.
              </p>
            )}
          </div>
        </div>

        <div className="sidebar-bottom">
          <button
            className="side-item theme-toggle"
            onClick={() => setDark(!dark)}
          >
            <span>{dark ? "☀" : "☾"}</span>
            {dark ? "Chế độ sáng" : "Chế độ tối"}
          </button>

          <div className="profile">
            <div className="avatar">H</div>
            <div>
              <strong>Người dùng</strong>
              <small>Không gian cá nhân</small>
            </div>
            <span className="profile-more">•••</span>
          </div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="mode-tabs">
            <button
              className={`mode-tab ${
                mode === "Gemini" ? "mode-tab-active" : ""
              }`}
              onClick={() => setMode("Gemini")}
            >
              <span className="tab-icon gemini-icon">✦</span>
              <span>
                <strong>Gemini</strong>
                <small>Trợ lý AI đa năng của Google</small>
              </span>
            </button>

            <button
              className={`mode-tab ${
                mode === "NotebookLM"
                  ? "mode-tab-active notebook-tab-active"
                  : ""
              }`}
              onClick={() => setMode("NotebookLM")}
            >
              <span className="tab-icon notebook-icon">▤</span>
              <span>
                <strong>NotebookLM</strong>
                <small>Học tập và nghiên cứu</small>
              </span>
            </button>
          </div>

          <div className="top-actions">
            <button
              className="top-icon"
              title="Tìm kiếm"
              onClick={() =>
                document
                  .querySelector<HTMLTextAreaElement>(".composer textarea")
                  ?.focus()
              }
            >
              ⌕
            </button>

            <button
              className="top-icon"
              title="Đổi sáng/tối"
              onClick={() => setDark(!dark)}
            >
              {dark ? "☀" : "☼"}
            </button>

            <button className="top-icon notification" title="Thông báo">
              ♧<i />
            </button>

            <div className="top-avatar">H</div>
          </div>
        </header>

        <div className="page-layout">
          <section className="main-column">
            {messages.length === 0 ? (
              <>
                <div className="welcome-panel">
                  <div className="welcome-copy">
                    <p className="eyebrow">
                      PYTHERA · YOUR AI WORKSPACE
                    </p>

                    <h1>
                      <span>Xin chào!</span> Hôm nay
                      <br />
                      bạn muốn khám phá điều gì?
                    </h1>

                    <p className="welcome-description">
                      {mode === "Gemini"
                        ? "Tôi có thể giúp bạn tìm hiểu, phân tích, sáng tạo và giải quyết nhiều vấn đề khác nhau."
                        : "Tổ chức ý tưởng, khám phá thông tin và trao đổi trong một không gian tri thức tập trung."}
                    </p>
                  </div>

                  <div className="hero-art" aria-hidden="true">
                    <div className="hero-orb orb-one" />
                    <div className="hero-orb orb-two" />
                    <div className="hero-sparkle sparkle-one">✦</div>
                    <div className="hero-sparkle sparkle-two">✧</div>

                    <div className="robot">
                      <div className="robot-antenna" />
                      <div className="robot-ear left" />
                      <div className="robot-ear right" />
                      <div className="robot-face">
                        <span>⌒</span>
                        <span>⌒</span>
                        <b>ᴗ</b>
                      </div>
                      <div className="robot-body">✦</div>
                    </div>

                    <div className="floating-tile tile-chart">▥</div>
                    <div className="floating-tile tile-bulb">♧</div>
                    <div className="floating-tile tile-doc">▤</div>
                  </div>
                </div>

                <div className="suggestions">
                  <button
                    className="suggestion-blue"
                    onClick={() =>
                      quick(
                        "Giải thích một khái niệm khó hiểu bằng ví dụ đơn giản"
                      )
                    }
                  >
                    <span className="suggestion-icon">♧</span>
                    <span className="suggestion-arrow">↗</span>
                    <strong>Học tập</strong>
                    <small>
                      Giải thích khái niệm,
                      <br />
                      làm bài tập, tóm tắt tài liệu
                    </small>
                  </button>

                  <button
                    className="suggestion-pink"
                    onClick={() =>
                      quick(
                        "Giúp tôi phân tích dữ liệu và đưa ra nhận định"
                      )
                    }
                  >
                    <span className="suggestion-icon">▥</span>
                    <span className="suggestion-arrow">↗</span>
                    <strong>Phân tích dữ liệu</strong>
                    <small>
                      Phân tích, trực quan hóa,
                      <br />
                      đưa ra nhận định
                    </small>
                  </button>

                  <button
                    className="suggestion-yellow"
                    onClick={() =>
                      quick(
                        "Gợi ý ý tưởng sáng tạo nội dung cho tôi"
                      )
                    }
                  >
                    <span className="suggestion-icon">✎</span>
                    <span className="suggestion-arrow">↗</span>
                    <strong>Sáng tạo nội dung</strong>
                    <small>
                      Viết, chỉnh sửa, lên ý tưởng
                      <br />
                      marketing
                    </small>
                  </button>

                  <button
                    className="suggestion-green"
                    onClick={() =>
                      quick(
                        "Giúp tôi lập kế hoạch học tập và công việc"
                      )
                    }
                  >
                    <span className="suggestion-icon">✈</span>
                    <span className="suggestion-arrow">↗</span>
                    <strong>Lập kế hoạch</strong>
                    <small>
                      Học tập, công việc,
                      <br />
                      du lịch, tài chính
                    </small>
                  </button>
                </div>

                <div className="prompt-chips">
                  {[
                    "Phân biệt Excel và SQL",
                    "Lên kế hoạch học tập",
                    "Tóm tắt tài liệu",
                    "Ý tưởng nội dung",
                    "Phân tích dữ liệu",
                  ].map((prompt) => (
                    <button key={prompt} onClick={() => quick(prompt)}>
                      {prompt}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="message-list">
                {messages.map((message) => (
                  <article
                    key={message.id}
                    className={`message ${message.role}`}
                  >
                    {message.role === "assistant" && (
                      <div className="assistant-avatar">✦</div>
                    )}

                    <div className="message-content">
                      {message.role === "assistant" && (
                        <div className="message-author">Trợ lý AI</div>
                      )}

                      <div className="markdown-content">
  <ReactMarkdown remarkPlugins={[remarkGfm]}>
    {message.content}
  </ReactMarkdown>
</div>

                      {message.role === "assistant" && (
                        <div className="answer-meta">
                          <button
                            title="Sao chép"
                            onClick={() =>
                              navigator.clipboard?.writeText(message.content)
                            }
                          >
                            ▢
                          </button>
                          <button title="Hữu ích">♡</button>
                          <span>Pythera AI</span>
                        </div>
                      )}
                    </div>
                  </article>
                ))}

                {typing && (
                  <div className="message assistant">
                    <div className="assistant-avatar">✦</div>
                    <div className="message-content">
                      <div className="message-author">Trợ lý AI</div>
                      <div className="typing-indicator">
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>
            )}

            <footer className="composer-area">
              <form
                className="composer"
                onSubmit={(e) => {
                  e.preventDefault();
                  void sendMessage();
                }}
              >
                <div className="composer-input-row">
                  <button
                    type="button"
                    className="attach-button"
                    title="Đính kèm (bản demo)"
                    onClick={() =>
                      alert("Chức năng đính kèm sẽ được phát triển sau.")
                    }
                  >
                    ♧
                  </button>

                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void sendMessage();
                      }
                    }}
                    placeholder={
                      mode === "Gemini"
                        ? "Nhập câu hỏi của bạn..."
                        : "Hỏi về ý tưởng hoặc tài liệu của bạn..."
                    }
                    rows={1}
                    aria-label="Tin nhắn"
                  />

                  <button
                    type="button"
                    className="mic-button"
                    title="Nhập bằng giọng nói (chưa bật)"
                  >
                    ♩
                  </button>

                  <button
                    className="send-button"
                    type="submit"
                    disabled={!input.trim() || typing}
                    aria-label="Gửi tin nhắn"
                  >
                    ➤
                  </button>
                </div>

                <div className="composer-toolbar">
                  <button
                    type="button"
                    className="composer-tool"
                    onClick={() =>
                      alert("Chức năng thêm tệp sẽ được phát triển sau.")
                    }
                  >
                    ＋
                  </button>

                  <button
                    type="button"
                    className="composer-tool"
                    onClick={() =>
                      quick(
                        `Hãy tìm hiểu và giải thích chủ đề: ${
                          input || "một chủ đề hữu ích"
                        }`
                      )
                    }
                  >
                    ◎ <span>Tìm kiếm web</span>
                  </button>

                  <button
                    type="button"
                    className="composer-tool"
                    onClick={() =>
                      quick(
                        `Hãy phân tích dữ liệu cho yêu cầu sau: ${
                          input ||
                          "hướng dẫn phân tích dữ liệu cho người mới"
                        }`
                      )
                    }
                  >
                    ▥ <span>Phân tích dữ liệu</span>
                  </button>

                  <button
                    type="button"
                    className="composer-tool"
                    onClick={() =>
                      alert("Chức năng tạo ảnh chưa được kết nối.")
                    }
                  >
                    ▧ <span>Hình ảnh</span>
                  </button>

                  <button
                    type="button"
                    className="composer-tool more-tool"
                    title="Thêm công cụ"
                  >
                    •••
                  </button>
                </div>
              </form>

              <p className="footer-note">
                Pythera · Không gian làm việc AI của bạn
              </p>
            </footer>
          </section>

          <aside className="right-rail">
            <section className="rail-card quick-card">
              <h2>
                <span className="rail-heading-icon purple">ϟ</span>
                Công cụ nhanh
                <span className="rail-chevron">⌄</span>
              </h2>

              <button
                onClick={() =>
                  quick(
                    "Hãy tóm tắt nội dung sau: " +
                      (input ||
                        "Hướng dẫn tôi cách tóm tắt tài liệu hiệu quả.")
                  )
                }
              >
                <span className="quick-icon blue">▤</span>
                Tóm tắt nội dung
              </button>

              <button
                onClick={() =>
                  quick(
                    "Hãy dịch nội dung sau sang tiếng Anh: " +
                      (input || "Xin chào, rất vui được gặp bạn.")
                  )
                }
              >
                <span className="quick-icon cyan">文</span>
                Dịch ngôn ngữ
              </button>

              <button
                onClick={() =>
                  quick(
                    "Giải thích một khái niệm phức tạp bằng ngôn ngữ đơn giản."
                  )
                }
              >
                <span className="quick-icon violet">♙</span>
                Giải thích khái niệm
              </button>

              <button
                onClick={() =>
                  quick("Hướng dẫn tôi phân tích dữ liệu theo từng bước.")
                }
              >
                <span className="quick-icon pink">▥</span>
                Phân tích dữ liệu
              </button>

              <button
                onClick={() =>
                  quick("Đề xuất 10 ý tưởng mới lạ cho một dự án.")
                }
              >
                <span className="quick-icon yellow">♧</span>
                Lên ý tưởng
              </button>
            </section>

            <section className="rail-card files-card">
              <h2>
                <span className="rail-heading-icon blue">▱</span>
                Tài liệu gần đây
                <span className="rail-chevron">⌄</span>
              </h2>

              <div className="file-row">
                <span className="file-icon pdf">PDF</span>
                <span>
                  <strong>Báo cáo dự án UAV.pdf</strong>
                  <small>PDF · Tài liệu mẫu</small>
                </span>
              </div>

              <div className="file-row">
                <span className="file-icon doc">W</span>
                <span>
                  <strong>Kế hoạch học tập 2026.docx</strong>
                  <small>DOCX · Tài liệu mẫu</small>
                </span>
              </div>

              <div className="file-row">
                <span className="file-icon xls">▦</span>
                <span>
                  <strong>Dữ liệu phân tích.xlsx</strong>
                  <small>XLSX · Tài liệu mẫu</small>
                </span>
              </div>

              <p className="demo-note">
                Ví dụ minh họa · Chưa kết nối kho tệp
              </p>
            </section>

            <section className="rail-card tips-card">
              <h2>
                <span className="rail-heading-icon yellow">♧</span>
                Mẹo sử dụng
                <span className="rail-chevron">⌄</span>
              </h2>

              <p>
                <span>✓</span>Đặt câu hỏi cụ thể và rõ ràng
              </p>
              <p>
                <span>✓</span>Cung cấp ngữ cảnh nếu cần
              </p>
              <p>
                <span>✓</span>Nêu định dạng kết quả mong muốn
              </p>
              <p>
                <span>✓</span>Tải tài liệu lên khi tính năng hỗ trợ
              </p>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
