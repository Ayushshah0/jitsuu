import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { postChatMessage } from "../api";

const CHAT_HISTORY_KEY = "news-chatbot-history";
const CHAT_SESSION_ID_KEY = "news-chatbot-session-id";
const MAX_MESSAGES = 200;

function readSessionId() {
  const existing = sessionStorage.getItem(CHAT_SESSION_ID_KEY);
  if (existing) {
    return existing;
  }

  const newId = uuidv4();
  sessionStorage.setItem(CHAT_SESSION_ID_KEY, newId);
  return newId;
}

function readHistory() {
  try {
    const raw = sessionStorage.getItem(CHAT_HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Unable to restore chat history", error);
    return [];
  }
}

function persistHistory(messages) {
  sessionStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages.slice(-MAX_MESSAGES)));
}

function normalizeReply(payload) {
  if (!payload) {
    return "Sorry, I could not parse the response from the news assistant.";
  }

  return payload.reply || payload.fulfillmentText || payload.message || payload?.data?.reply || "Sorry, I did not get a useful response.";
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

  const unreadCount = useMemo(() => {
    if (isOpen) {
      return 0;
    }

    return messages.filter((message) => message.role === "assistant").length;
  }, [isOpen, messages]);

  const appendMessage = useCallback((role, text) => {
    setMessages((current) => [...current, { role, text }]);
  }, []);

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

  const sendMessage = useCallback(async () => {
    const trimmedMessage = inputValue.trim();
    if (!trimmedMessage || isSending) {
      return;
    }

    const userMessage = { role: "user", text: trimmedMessage };
    const loadingMessage = { role: "assistant", text: "Typing..." };
    setInputValue("");
    setErrorMessage("");
    setMessages((current) => [...current, userMessage, loadingMessage]);
    setIsSending(true);

    try {
      const data = await postChatMessage(trimmedMessage, sessionId.current);
      const reply = normalizeReply(data);

      setMessages((current) => {
        const withoutLoading = current.filter((message) => message.text !== "Typing...");
        return [...withoutLoading, userMessage, { role: "assistant", text: reply }];
      });
    } catch (error) {
      console.error("Chatbot request failed:", error);
      setErrorMessage("The news assistant is temporarily unavailable. Please try again.");
      setMessages((current) => {
        const withoutLoading = current.filter((message) => message.text !== "Typing...");
        return [
          ...withoutLoading,
          userMessage,
          { role: "assistant", text: "Sorry, I could not reach the news assistant right now. Please try again." },
        ];
      });
    } finally {
      setIsSending(false);
    }
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