import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const CHAT_HISTORY_KEY = "news-chatbot-history";
const CHAT_SESSION_ID_KEY = "news-chatbot-session-id";
const MAX_MESSAGES = 200;
const BOT_REPLY_DELAY_MS = 900;

function createTimestamp() {
  return new Date().toISOString();
}

function readSessionId() {
  if (typeof sessionStorage === "undefined") {
    return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}`;
  }

  const existing = sessionStorage.getItem(CHAT_SESSION_ID_KEY);
  if (existing) {
    return existing;
  }

  const newId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}`;
  sessionStorage.setItem(CHAT_SESSION_ID_KEY, newId);
  return newId;
}

function normalizeMessage(message, fallbackId = "") {
  if (!message || typeof message !== "object") {
    return null;
  }

  const sender = message.sender || (message.role === "user" ? "user" : "bot");

  return {
    id: message.id || `${fallbackId || sender}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    text: String(message.text || message.message || "").trim(),
    sender: sender === "user" ? "user" : "bot",
    timestamp: message.timestamp || createTimestamp(),
  };
}

function readHistory() {
  try {
    const raw = sessionStorage.getItem(CHAT_HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.map((message, index) => normalizeMessage(message, `history-${index}`)).filter(Boolean)
      : [];
  } catch (error) {
    console.warn("Unable to restore chat history", error);
    return [];
  }
}

function persistHistory(messages) {
  if (typeof sessionStorage === "undefined") {
    return;
  }

  sessionStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages.slice(-MAX_MESSAGES)));
}

function buildMockReply(message) {
  const lowerMessage = message.toLowerCase();

  if (/(news|headline|headlines|latest)/i.test(lowerMessage)) {
    return "Here are the latest headlines I can help with. Try asking about a country, a topic like technology, or a category like business.";
  }

  if (/(technology|tech|ai|artificial intelligence)/i.test(lowerMessage)) {
    return "Technology news is moving quickly right now. I can summarize the latest headlines if you want a short digest.";
  }

  if (/(sports|football|cricket|basketball|tennis)/i.test(lowerMessage)) {
    return "Sports updates are available. Ask for the latest headlines and I’ll surface the most recent stories.";
  }

  return "I can help with headlines, a topic search, or a short news summary. Try asking for 'news' or a topic like 'Nepal' or 'technology'.";
}

export function useChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState(() => readHistory());
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const sessionId = useRef(readSessionId());
  const replyTimerRef = useRef(null);

  useEffect(() => {
    persistHistory(messages);
  }, [messages]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (inputRef.current && !isMinimized) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  useEffect(() => {
    if (!messagesEndRef.current) {
      return;
    }

    messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isOpen, isMinimized]);

  useEffect(() => {
    return () => {
      if (replyTimerRef.current) {
        clearTimeout(replyTimerRef.current);
      }
    };
  }, []);

  const unreadCount = useMemo(() => {
    if (isOpen) {
      return 0;
    }

    return messages.filter((message) => message.sender === "bot").length;
  }, [isOpen, messages]);

  const openChat = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
    setErrorMessage("");
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
  }, []);

  const toggleOpen = useCallback(() => {
    setIsOpen((current) => !current);
    setIsMinimized(false);
    setErrorMessage("");
  }, []);

  const toggleMinimize = useCallback(() => {
    setIsMinimized((current) => !current);
  }, []);

  const sendMessage = useCallback((text = inputValue) => {
    const trimmedMessage = String(text || "").trim();
    if (!trimmedMessage || isSending) {
      return;
    }

    if (replyTimerRef.current) {
      clearTimeout(replyTimerRef.current);
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      text: trimmedMessage,
      sender: "user",
      timestamp: createTimestamp(),
    };

    const loadingMessage = {
      id: `bot-loading-${Date.now()}`,
      text: "Typing...",
      sender: "bot",
      timestamp: createTimestamp(),
    };

    setInputValue("");
    setErrorMessage("");
    setMessages((current) => [...current, userMessage, loadingMessage]);
    setIsSending(true);

    (async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      replyTimerRef.current = timeoutId;

      try {
        const resp = await fetch("http://localhost:5000/chatbot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmedMessage, session_id: sessionId.current }),
          signal: controller.signal,
        });

        if (!resp.ok) {
          throw new Error(`Request failed: ${resp.status}`);
        }

        const payload = await resp.json();
        const reply = String(payload?.reply || buildMockReply(trimmedMessage)).trim();

        setMessages((current) =>
          current.map((message) =>
            message.id === loadingMessage.id
              ? {
                  id: `bot-${Date.now()}`,
                  text: reply,
                  sender: "bot",
                  timestamp: createTimestamp(),
                }
              : message
          )
        );
      } catch (err) {
        const errMsg = err?.name === "AbortError" ? "Request timed out" : String(err?.message || "Request failed");
        setMessages((current) =>
          current.map((message) =>
            message.id === loadingMessage.id
              ? {
                  id: `bot-${Date.now()}`,
                  text: `Error: ${errMsg}`,
                  sender: "bot",
                  timestamp: createTimestamp(),
                }
              : message
          )
        );
        setErrorMessage(errMsg);
      } finally {
        clearTimeout(timeoutId);
        replyTimerRef.current = null;
        setIsSending(false);
      }
    })();
  }, [inputValue, isSending]);

  return {
    isOpen,
    isMinimized,
    messages,
    inputValue,
    isSending,
    errorMessage,
    sessionId: sessionId.current,
    unreadCount,
    inputRef,
    messagesEndRef,
    openChat,
    closeChat,
    toggleOpen,
    toggleMinimize,
    setInputValue,
    sendMessage,
  };
}