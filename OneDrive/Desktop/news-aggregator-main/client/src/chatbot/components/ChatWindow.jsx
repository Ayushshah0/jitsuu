import React, { useEffect, useRef, useState } from "react";
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
  const widgetRef = useRef(null);
  const localMessagesEndRef = useRef(null);
  const dragStateRef = useRef({ dragging: false, offsetX: 0, offsetY: 0 });
  const [position, setPosition] = useState(() => {
    if (typeof window === "undefined") {
      return { x: 0, y: 0 };
    }

    const widgetWidth = 392;
    const widgetHeight = 612;
    const x = Math.max(12, window.innerWidth - widgetWidth - 12);
    const y = Math.max(12, window.innerHeight - widgetHeight - 12);
    return { x, y };
  });
  const [isDragging, setIsDragging] = useState(false);
  const endRef = messagesEndRef || localMessagesEndRef;

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

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const clampPosition = () => {
      const width = widgetRef.current?.offsetWidth || 392;
      const height = widgetRef.current?.offsetHeight || 612;
      setPosition((current) => ({
        x: Math.min(Math.max(12, current.x), Math.max(12, window.innerWidth - width - 12)),
        y: Math.min(Math.max(12, current.y), Math.max(12, window.innerHeight - height - 12)),
      }));
    };

    window.addEventListener("resize", clampPosition);
    return () => window.removeEventListener("resize", clampPosition);
  }, []);

  useEffect(() => {
    if (!isDragging) {
      return undefined;
    }

    const handleMouseMove = (event) => {
      const width = widgetRef.current?.offsetWidth || 392;
      const height = widgetRef.current?.offsetHeight || 612;
      const nextX = event.clientX - dragStateRef.current.offsetX;
      const nextY = event.clientY - dragStateRef.current.offsetY;

      setPosition({
        x: Math.min(Math.max(12, nextX), Math.max(12, window.innerWidth - width - 12)),
        y: Math.min(Math.max(12, nextY), Math.max(12, window.innerHeight - height - 12)),
      });
    };

    const handleMouseUp = () => {
      dragStateRef.current.dragging = false;
      setIsDragging(false);
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    if (!isDragging) {
      return undefined;
    }

    const handleTouchMove = (event) => {
      const touch = event.touches[0];
      if (!touch) {
        return;
      }

      event.preventDefault();
      const width = widgetRef.current?.offsetWidth || 392;
      const height = widgetRef.current?.offsetHeight || 612;
      const nextX = touch.clientX - dragStateRef.current.offsetX;
      const nextY = touch.clientY - dragStateRef.current.offsetY;

      setPosition({
        x: Math.min(Math.max(12, nextX), Math.max(12, window.innerWidth - width - 12)),
        y: Math.min(Math.max(12, nextY), Math.max(12, window.innerHeight - height - 12)),
      });
    };

    const handleTouchEnd = () => {
      dragStateRef.current.dragging = false;
      setIsDragging(false);
      document.body.style.userSelect = "";
    };

    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [isDragging]);

  const beginDrag = (clientX, clientY) => {
    const width = widgetRef.current?.offsetWidth || 392;
    const height = widgetRef.current?.offsetHeight || 612;

    dragStateRef.current = {
      dragging: true,
      offsetX: clientX - position.x,
      offsetY: clientY - position.y,
    };

    setPosition((current) => ({
      x: Math.min(Math.max(12, current.x), Math.max(12, window.innerWidth - width - 12)),
      y: Math.min(Math.max(12, current.y), Math.max(12, window.innerHeight - height - 12)),
    }));
    setIsDragging(true);
    document.body.style.userSelect = "none";
  };

  const handleMouseDown = (event) => {
    if (event.button !== 0) {
      return;
    }

    const interactive = event.target.closest("button, input, textarea, select, a");
    if (interactive) {
      return;
    }

    beginDrag(event.clientX, event.clientY);
  };

  const handleTouchStart = (event) => {
    const touch = event.touches[0];
    if (!touch) {
      return;
    }

    const interactive = event.target.closest("button, input, textarea, select, a");
    if (interactive) {
      return;
    }

    event.preventDefault();
    beginDrag(touch.clientX, touch.clientY);
  };

  const handleSend = () => {
    if (typeof onSend === "function") {
      onSend();
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={widgetRef}
      className="fixed z-50 flex flex-col overflow-hidden rounded-xl bg-white dark:bg-white text-black dark:text-black shadow-lg border-2 border-gray-300 dark:border-gray-300"
      style={{
        backgroundColor: "#ffffff",
        color: "#000000",
        opacity: 1,
        backdropFilter: "none",
        left: position.x,
        top: position.y,
        width: "min(24rem, calc(100vw - 1rem))",
        height: "min(36rem, calc(100vh - 1rem))",
      }}
    >
      <div
        className="bg-blue-500 dark:bg-blue-600 text-white px-4 py-3 flex items-center justify-between cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div className="pr-3">
          <h2 className="text-sm font-bold">News Assistant</h2>
          <p className="text-xs font-bold">Drag me anywhere. Ask for headlines or a topic.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onMinimize}
            aria-label={isMinimized ? "Expand chat window" : "Minimize chat window"}
            className="rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white transition hover:bg-white/20"
          >
            {isMinimized ? "▢" : "—"}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat window"
            className="rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white transition hover:bg-white/20"
          >
            ✕
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div
          className="flex min-h-0 flex-1 flex-col bg-white dark:bg-white"
          style={{ backgroundColor: "#ffffff", opacity: 1 }}
        >
          <div
            className="overflow-y-auto bg-white dark:bg-white min-h-0 flex-1 space-y-3 px-4 py-4"
            style={{ backgroundColor: "#ffffff", opacity: 1 }}
          >
            {messages.length === 0 && (
              <div
                className="rounded-lg border-2 border-gray-300 dark:border-gray-300 bg-gray-100 dark:bg-gray-100 p-4 text-sm text-gray-800 dark:text-gray-800 font-bold"
                style={{ backgroundColor: "#f3f4f6", opacity: 1 }}
              >
                Start with a question like “show me the latest news” or “technology headlines”.
              </div>
            )}

            {messages.map((message, index) => (
              <ChatMessage
                key={message.id || `${message.sender || message.role}-${index}`}
                sender={message.sender || message.role}
                text={message.text}
                timestamp={message.timestamp}
              />
            ))}

            {isSending && (
              <div className="flex justify-start">
                <div
                  className="rounded-lg border-2 border-gray-300 dark:border-gray-300 bg-gray-100 dark:bg-gray-100 px-4 py-3 text-sm text-gray-800 dark:text-gray-800 font-bold"
                  style={{ backgroundColor: "#f3f4f6", opacity: 1 }}
                >
                  Thinking...
                </div>
              </div>
            )}

            <div ref={endRef} />
          </div>

          {errorMessage && (
            <div className="border-t border-rose-200/30 bg-rose-50/60 px-4 py-2 text-xs text-rose-700">
              {errorMessage}
            </div>
          )}

          <div
            className="bg-white dark:bg-white border-t-2 border-gray-300 dark:border-gray-300 p-4"
            style={{ backgroundColor: "#ffffff", opacity: 1 }}
          >
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(event) => onInputChange(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask the news assistant..."
                aria-label="Chat input"
                rows={2}
                className="min-h-[56px] flex-1 resize-none rounded-lg border-2 border-gray-300 dark:border-gray-300 bg-white dark:bg-white text-black dark:text-black px-4 py-3 text-sm placeholder:text-gray-500 dark:placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 font-bold"
                style={{ backgroundColor: "#ffffff", color: "#000000", opacity: 1 }}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={isSending || !inputValue.trim()}
                className="self-end rounded-lg bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatWindow;