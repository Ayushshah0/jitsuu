import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AccountPanel({ onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('app-font-size');
    return saved ? Number(saved) : 16;
  });
  const [searchTopic, setSearchTopic] = useState('');
  const [topics, setTopics] = useState(() => {
    const saved = localStorage.getItem('tracked-topics');
    return saved ? JSON.parse(saved) : [];
  });
  const [topicFrequency, setTopicFrequency] = useState({});
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [bookmarkCount] = useState(0); // Will be fetched from API

  const displayName = user?.name || user?.username || 'User';

  // Persist font size to localStorage and apply to document
  useEffect(() => {
    localStorage.setItem('app-font-size', fontSize.toString());
    document.documentElement.style.fontSize = `${fontSize}px`;
  }, [fontSize]);

  // Persist topics to localStorage
  useEffect(() => {
    localStorage.setItem('tracked-topics', JSON.stringify(topics));
  }, [topics]);

  function handleAddTopic() {
    if (searchTopic.trim() && !topics.includes(searchTopic.trim())) {
      const newTopic = searchTopic.trim();
      setTopics([...topics, newTopic]);
      setTopicFrequency({ ...topicFrequency, [newTopic]: 'instant' });
      setSearchTopic('');
    }
  }

  function handleRemoveTopic(topic) {
    setTopics(topics.filter(t => t !== topic));
    const newFrequency = { ...topicFrequency };
    delete newFrequency[topic];
    setTopicFrequency(newFrequency);
  }

  function handleSetFrequency(topic, frequency) {
    setTopicFrequency({ ...topicFrequency, [topic]: frequency });
  }

  function handleLogoutConfirm() {
    logout();
    setShowLogoutConfirm(false);
    if (onClose) onClose();
    navigate('/login');
  }

  function navigateTo(path) {
    if (onClose) onClose();
    navigate(path);
  }

  return (
    <div className="p-6 max-w-md">
      {/* Welcome Header */}
      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest opacity-70">Welcome back</p>
        <h2 className="text-3xl font-bold mt-2">{displayName}</h2>
      </div>

      {/* Library Section */}
      <div className="bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] rounded-2xl p-4 mb-4 border border-[color-mix(in_srgb,var(--border)_50%,transparent)] hover:border-[var(--accent-cyan)] transition">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <span className="text-lg">📚</span> Library
        </h3>
        <div className="space-y-2">
          <button
            onClick={() => navigateTo('/bookmarks')}
            className="w-full text-left rounded-lg p-3 bg-[color-mix(in_srgb,var(--surface)_64%,transparent)] hover:bg-[var(--accent-cyan)] hover:text-[var(--primary)] transition"
          >
            <div className="flex justify-between items-center">
              <span>My Bookmarks</span>
              <span className="text-xs bg-[var(--accent-purple)] rounded-full px-2 py-1">{bookmarkCount}</span>
            </div>
          </button>
          <button
            onClick={() => navigateTo('/preferences')}
            className="w-full text-left rounded-lg p-3 bg-[color-mix(in_srgb,var(--surface)_64%,transparent)] hover:bg-[var(--accent-cyan)] hover:text-[var(--primary)] transition"
          >
            My Preferences
          </button>
        </div>
      </div>

      {/* Smart Alerts Section */}
      <div className="bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] rounded-2xl p-4 mb-4 border border-[color-mix(in_srgb,var(--border)_50%,transparent)] hover:border-[var(--accent-cyan)] transition">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <span className="text-lg">🔔</span> Smart Alerts
        </h3>
        {topics.length === 0 ? (
          <p className="text-sm opacity-70 mb-3">No smart alerts yet. Search topics to begin tracking.</p>
        ) : (
          <p className="text-sm opacity-70 mb-3">{topics.length} topic{topics.length > 1 ? 's' : ''} tracked</p>
        )}
        {/* Search Topics Input */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={searchTopic}
            onChange={(e) => setSearchTopic(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTopic()}
            placeholder="Search topics..."
            className="flex-1 px-3 py-2 rounded-lg bg-[color-mix(in_srgb,var(--input-text)_10%,transparent)] border border-[color-mix(in_srgb,var(--border)_50%,transparent)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)] transition"
          />
          <button
            onClick={handleAddTopic}
            className="px-4 py-2 rounded-lg bg-[var(--accent-purple)] text-white font-medium text-sm hover:opacity-90 transition disabled:opacity-50"
            disabled={!searchTopic.trim()}
          >
            Add
          </button>
        </div>

        {/* Active Topics */}
        {topics.length > 0 && (
          <div className="space-y-2 mt-3">
            {topics.map((topic) => (
              <div
                key={topic}
                className="bg-[color-mix(in_srgb,var(--surface)_40%,transparent)] rounded-lg p-3 border border-[var(--border)] flex items-center justify-between gap-2"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">{topic}</p>
                  <select
                    value={topicFrequency[topic] || 'instant'}
                    onChange={(e) => handleSetFrequency(topic, e.target.value)}
                    className="text-xs mt-1 px-2 py-1 rounded bg-[color-mix(in_srgb,var(--surface)_64%,transparent)] border border-[var(--border)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-cyan)]"
                  >
                    <option value="instant">Instant</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                <button
                  onClick={() => handleRemoveTopic(topic)}
                  className="text-lg font-bold text-[var(--accent-pink)] hover:opacity-70 transition"
                  aria-label={`Remove ${topic} alert`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Display Section */}
      <div className="bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] rounded-2xl p-4 mb-4 border border-[color-mix(in_srgb,var(--border)_50%,transparent)] hover:border-[var(--accent-cyan)] transition">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <span className="text-lg">⚙️</span> Display
        </h3>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-sm opacity-70 font-semibold">A</span>
          <input
            type="range"
            min="10"
            max="22"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="flex-1 h-2 bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-purple)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-cyan)]"
          />
          <span className="text-sm opacity-70 font-semibold">A</span>
        </div>
        <p className="text-center text-xs opacity-70 font-medium">{fontSize}px</p>
        <p className="text-center text-xs opacity-50 mt-1">Changes apply instantly</p>
      </div>

      {/* Logout Section */}
      <div className="mt-6 space-y-2">
        {showLogoutConfirm ? (
          <div className="bg-[var(--accent-pink)] bg-opacity-20 border border-[var(--accent-pink)] rounded-lg p-3">
            <p className="text-sm font-medium mb-3">Are you sure you want to logout?</p>
            <div className="flex gap-2">
              <button
                onClick={handleLogoutConfirm}
                className="flex-1 py-2 rounded-lg bg-[var(--accent-pink)] text-white font-medium text-sm hover:opacity-90 transition"
              >
                Yes, Logout
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2 rounded-lg bg-[color-mix(in_srgb,var(--surface)_64%,transparent)] border border-[var(--border)] font-medium text-sm hover:bg-[color-mix(in_srgb,var(--surface)_80%,transparent)] transition"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[var(--accent-pink)] to-[#ff8fa3] text-white font-bold text-lg hover:opacity-90 transition shadow-lg"
          >
            ← Logout
          </button>
        )}
      </div>
    </div>
  );
}

export default AccountPanel;
