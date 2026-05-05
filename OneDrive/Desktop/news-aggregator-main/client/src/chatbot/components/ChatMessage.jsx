import React from "react";

function ChatMessage({ role, text }) {
  const isUser = role === "user";
  const isSystem = role === "system";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
          isUser
            ? "bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-pink)] text-white"
            : isSystem
            ? "border border-dashed border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_78%,transparent)] text-[var(--text-secondary)]"
            : "bg-[color-mix(in_srgb,var(--surface)_92%,transparent)] border border-[var(--border)] text-[var(--txt)]",
        ].join(" ")}
      >
        <p className="whitespace-pre-wrap">{text}</p>
      </div>
    </div>
  );
}

export default ChatMessage;