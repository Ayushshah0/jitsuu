import React from "react";

function ChatbotButton({ isOpen, onClick, unreadCount = 0 }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isOpen ? "Close news assistant" : "Open news assistant"}
      aria-pressed={isOpen}
      className="fixed bottom-5 right-5 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-pink)] text-white shadow-[0_18px_40px_rgba(76,50,160,0.35)] transition-transform duration-200 hover:scale-105 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-[var(--focus-glow)]"
    >
      <span className="sr-only">News assistant</span>
      <span className="text-2xl">💬</span>
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--accent-cyan)] px-1 text-xs font-bold text-[var(--primary)] shadow-lg">
          {unreadCount}
        </span>
      )}
    </button>
  );
}

export default ChatbotButton;