import React from "react";

function formatTimestamp(timestamp) {
  if (!timestamp) {
    return "";
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ChatMessage({ sender = "bot", text = "", timestamp }) {
  const isUser = sender === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "max-w-[85%] rounded-lg px-4 py-3 text-sm leading-relaxed shadow-sm border-2",
          isUser
            ? "bg-blue-500 text-white dark:bg-blue-500 border-blue-600 dark:border-blue-600"
            : "bg-gray-200 text-black dark:bg-gray-200 dark:text-black border-gray-300 dark:border-gray-300",
        ].join(" ")}
        style={{ opacity: 1 }}
      >
        <p className="whitespace-pre-wrap break-words font-bold">{text}</p>
        {timestamp ? (
          <p className={`mt-2 text-[11px] ${isUser ? "text-blue-100" : "text-gray-700 dark:text-gray-700"}`}>
            {formatTimestamp(timestamp)}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default ChatMessage;