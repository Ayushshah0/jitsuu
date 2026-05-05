import "./App.css";
import { useEffect, useState } from "react";
import Header from "./components/Header";
import AllNews from "./components/AllNews";
import TopHeadlines from "./components/TopHeadlines";
import UniversalSearchResults from "./components/UniversalSearchResults";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import CountryNews from "./components/CountryNews";
import Login from "./components/Login";
import Preferences from "./components/Preferences";
import Bookmarks from "./components/Bookmarks";
import Register from "./components/Register";
import ForgotPassword from "./components/ForgotPassword";
import OAuthCallback from "./components/OAuthCallback";
import ProtectedRoute from "./components/ProtectedRoute";
import ChatbotButton from "./chatbot/components/ChatbotButton";
import ChatWindow from "./chatbot/components/ChatWindow";
import { useChat } from "./chatbot/hooks/useChat";

function App() {
  const chat = useChat();
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("darkMode") === "true" || false;
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", isDark);
  }, [isDark]);

  const toggleDarkMode = () => setIsDark(!isDark);

  return (
    <div className="w-full min-h-screen overflow-x-hidden bg-white dark:bg-gray-900 text-black dark:text-white">
      <div className="fixed top-4 right-4 z-40">
        <button
          onClick={toggleDarkMode}
          className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-lg font-medium transition hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          {isDark ? "☀️ Light" : "🌙 Dark"}
        </button>
      </div>
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<AllNews />} />
          <Route path="/top-headlines/:category" element={<TopHeadlines />} />
          <Route path="/country/:iso" element={<CountryNews />} />
          <Route path="/search" element={<UniversalSearchResults />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/callback" element={<OAuthCallback />} />
          <Route path="/bookmarks" element={<ProtectedRoute><Bookmarks /></ProtectedRoute>} />
          <Route path="/preferences" element={<ProtectedRoute><Preferences /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
      <ChatbotButton
        isOpen={chat.isOpen}
        onClick={chat.toggleOpen}
        unreadCount={chat.unreadCount}
      />
      <ChatWindow
        isOpen={chat.isOpen}
        isMinimized={chat.isMinimized}
        messages={chat.messages}
        inputValue={chat.inputValue}
        isSending={chat.isSending}
        errorMessage={chat.errorMessage}
        onClose={chat.closeChat}
        onMinimize={chat.toggleMinimize}
        onInputChange={chat.setInputValue}
        onSend={chat.sendMessage}
        inputRef={chat.inputRef}
        messagesEndRef={chat.messagesEndRef}
      />
    </div>
  );
}

export default App;
