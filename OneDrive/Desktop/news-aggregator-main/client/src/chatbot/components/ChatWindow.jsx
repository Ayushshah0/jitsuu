import React, { useEffect } from "react";
import ChatMessage from "./ChatMessage";

function ChatWindow({
  isOpen,
  isMinimized,
  messages,
  inputValue,
  isSending,
  errorMessage,
  onClose,
  onMinimize,
  onInputChange,
  onSend,
  inputRef,
  messagesEndRef,
}) {
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized, inputRef]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed bottom-24 right-5 z-50 flex w-[calc(100vw-2rem)] max-w-md flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--primary)] shadow-[0_24px_60px_rgba(0,0,0,0.32)] backdrop-blur-sm sm:right-5 sm:w-[420px] sm:max-w-[420px]">
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_92%,transparent)] px-4 py-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--heading)]">News Assistant 🤖</h2>
          <p className="text-xs text-[var(--text-muted)]">Ask for summaries, explanations, or recommendations.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onMinimize}
            aria-label={isMinimized ? "Expand chat window" : "Minimize chat window"}
            className="rounded-full border border-[var(--border)] px-3 py-1 text-sm hover:bg-[var(--surface-strong)]"
          >
            {isMinimized ? "▢" : "—"}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat window"
            className="rounded-full border border-[var(--border)] px-3 py-1 text-sm hover:bg-[var(--surface-strong)]"
          >
            ✕
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="chatbot-scrollbar flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_80%,transparent)] p-4 text-sm text-[var(--text-secondary)]">
                Start with a question like “summarize the latest AI news” or “explain the election story.”
              </div>
            )}

            {messages.map((message, index) => (
              <ChatMessage key={`${message.role}-${index}-${message.text.slice(0, 12)}`} role={message.role} text={message.text} />
            ))}

            {isSending && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                  <span className="inline-flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--accent-cyan)] [animation-delay:-0.2s]"></span>
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--accent-cyan)] [animation-delay:-0.1s]"></span>
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--accent-cyan)]"></span>
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {errorMessage && (
            <div className="border-t border-[var(--border)] bg-[color-mix(in_srgb,var(--accent-pink)_12%,transparent)] px-4 py-2 text-xs text-[var(--text-secondary)]">
              {errorMessage}
            </div>
          )}

          <div className="border-t border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_96%,transparent)] p-4">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(event) => onInputChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    onSend();
                  }
                }}
                placeholder="Ask the news assistant..."
                aria-label="Chat input"
                className="flex-1 rounded-2xl border border-[var(--border)] bg-[var(--primary)] px-4 py-3 text-sm text-[var(--txt)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-cyan)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-glow)]"
              />
              <button
                type="button"
                onClick={onSend}
                disabled={isSending || !inputValue.trim()}
                className="rounded-2xl bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-pink)] px-4 py-3 text-sm font-semibold text-white transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </>
      )}

      {/* Optional enhancement: typing indicator can replace the simple loading dots above. */}
      {/* Optional enhancement: voice input can be added here with Web Speech API or native mobile bridge. */}
      {/* Optional enhancement: include Authorization header support via setChatAuthToken in api.js. */}
    </div>
  );
}

export default ChatWindow;