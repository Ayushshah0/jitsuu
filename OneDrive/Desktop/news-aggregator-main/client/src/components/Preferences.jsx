import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../services/http";
import { useAuth } from "../context/AuthContext";

const THEME_OPTIONS = ["light", "dark", "auto"];
const FREQUENCY_OPTIONS = ["instant", "daily", "weekly"];

const EMPTY_AVAILABLE = {
  categories: [],
  countries: [],
  languages: [],
  keywords: [],
  themes: THEME_OPTIONS,
  frequencies: FREQUENCY_OPTIONS,
};

function normalizePreferences(data, available) {
  return {
    categories: Array.isArray(data?.categories) ? data.categories : [available.categories[0] || "general"],
    country: data?.country || available.countries[0] || "us",
    language: data?.language || available.languages[0] || "en",
    theme: data?.theme || "auto",
    keywords: Array.isArray(data?.keywords) ? data.keywords : [],
    notifications: {
      inApp: data?.notifications?.inApp || { enabled: true, frequency: "instant" },
      email: data?.notifications?.email || { enabled: false },
      push: data?.notifications?.push || { enabled: false },
      browser: data?.notifications?.browser || { enabled: false },
    },
  };
}

function Preferences() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [available, setAvailable] = useState(EMPTY_AVAILABLE);
  const [preferences, setPreferences] = useState(null);
  const [newKeyword, setNewKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const channels = useMemo(() => ["inApp", "email", "push", "browser"], []);

  function setChannelEnabled(channel, enabled) {
    setPreferences((prev) => {
      const nextChannel = enabled
        ? { enabled: true, frequency: prev.notifications[channel].frequency || "daily" }
        : { enabled: false };

      return {
        ...prev,
        notifications: {
          ...prev.notifications,
          [channel]: nextChannel,
        },
      };
    });
  }

  function setChannelFrequency(channel, frequency) {
    setPreferences((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [channel]: {
          ...prev.notifications[channel],
          enabled: true,
          frequency,
        },
      },
    }));
  }

  function handleCategoryToggle(category) {
    setPreferences((prev) => {
      const exists = prev.categories.includes(category);
      const nextCategories = exists
        ? prev.categories.filter((item) => item !== category)
        : [...prev.categories, category];

      return {
        ...prev,
        categories: nextCategories,
      };
    });
  }

  function addKeyword() {
    const keyword = newKeyword.trim().toLowerCase();
    if (!keyword) {
      return;
    }

    if (keyword.length < 2 || keyword.length > 30) {
      setStatus({ type: "error", message: "Keyword must be between 2 and 30 characters." });
      return;
    }

    let nextKeywords = [];
    setPreferences((prev) => {
      if (prev.keywords.includes(keyword) || prev.keywords.length >= 20) {
        nextKeywords = prev.keywords;
        return prev;
      }

      nextKeywords = [...prev.keywords, keyword];

      return {
        ...prev,
        keywords: nextKeywords,
      };
    });
    saveKeywords(nextKeywords);
    setNewKeyword("");
  }

  function removeKeyword(keyword) {
    setPreferences((prev) => {
      const nextKeywords = prev.keywords.filter((item) => item !== keyword);
      saveKeywords(nextKeywords);
      return {
        ...prev,
        keywords: nextKeywords,
      };
    });
  }

  function validateForm() {
    if (!preferences.categories.length) {
      return "Select at least one category.";
    }

    if (preferences.categories.length > 5) {
      return "Select up to 5 categories only.";
    }

    if (preferences.keywords.some((item) => item.length < 2 || item.length > 30)) {
      return "Each keyword must be between 2 and 30 characters.";
    }

    for (const channel of channels) {
      const config = preferences.notifications[channel];
      if (config.enabled && !config.frequency) {
        return `Choose a frequency for ${channel} notifications.`;
      }
    }

    return "";
  }

  async function loadData() {
    try {
      setIsLoading(true);
      const [availableResponse, preferencesResponse] = await Promise.all([
        apiFetch("/preferences/available", { method: "GET" }),
        apiFetch("/preferences", { method: "GET" }),
      ]);

      setAvailable(availableResponse.data || EMPTY_AVAILABLE);
      setPreferences(normalizePreferences(preferencesResponse.data, availableResponse.data || EMPTY_AVAILABLE));
      setStatus({ type: "", message: "" });
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        setStatus({ type: "error", message: "Session expired. Please login again." });
        logout();
        navigate("/login");
      } else {
        setStatus({ type: "error", message: error?.payload?.error || "Failed to load preferences." });
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function saveAllPreferences() {
    const validationMessage = validateForm();
    if (validationMessage) {
      setStatus({ type: "error", message: validationMessage });
      return;
    }

    try {
      setIsSaving(true);
      const response = await apiFetch("/preferences", {
        method: "PUT",
        body: JSON.stringify(preferences),
      });
      setPreferences(response.data);
      setStatus({ type: "success", message: "Preferences saved successfully." });
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        setStatus({ type: "error", message: "Session expired. Please login again." });
        logout();
        navigate("/login");
      } else {
        setStatus({ type: "error", message: error?.payload?.error || "Failed to save preferences." });
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function patchTheme(theme) {
    setPreferences((prev) => ({ ...prev, theme }));
    try {
      await apiFetch("/preferences/theme", {
        method: "PATCH",
        body: JSON.stringify({ theme }),
      });
    } catch (error) {
      setStatus({ type: "error", message: error?.payload?.error || "Theme update failed." });
    }
  }

  async function saveNotifications(notifications) {
    try {
      await apiFetch("/preferences/notifications", {
        method: "PATCH",
        body: JSON.stringify({ notifications }),
      });
    } catch (error) {
      setStatus({ type: "error", message: error?.payload?.error || "Notification update failed." });
    }
  }

  async function saveKeywords(keywords) {
    try {
      await apiFetch("/preferences/keywords", {
        method: "PATCH",
        body: JSON.stringify({ keywords }),
      });
    } catch (error) {
      setStatus({ type: "error", message: error?.payload?.error || "Keyword update failed." });
    }
  }

  async function handleReset() {
    const confirmed = window.confirm("Reset all preferences to defaults?");
    if (!confirmed) {
      return;
    }

    try {
      setIsSaving(true);
      const response = await apiFetch("/preferences", { method: "DELETE" });
      setPreferences(response.data);
      setStatus({ type: "success", message: "Preferences reset to defaults." });
    } catch (error) {
      setStatus({ type: "error", message: error?.payload?.error || "Failed to reset preferences." });
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return <section className="mt-24 px-4 md:px-10 lg:px-16">Loading preferences...</section>;
  }

  if (!preferences) {
    return <section className="mt-24 px-4 md:px-10 lg:px-16">Unable to load preferences.</section>;
  }

  return (
    <section className="mt-24 px-4 md:px-10 lg:px-16 pb-12">
      <div className="max-w-5xl mx-auto rounded-2xl border border-sky-300/30 bg-slate-900/40 p-6 md:p-8 backdrop-blur-sm">
        <h2 className="text-3xl font-semibold mb-2">User Preferences</h2>
        <p className="opacity-80 mb-6">Customize your news feed, theme, and notifications.</p>

        {status.message && (
          <div className={`mb-4 rounded-lg p-3 text-sm ${status.type === "error" ? "bg-red-500/20 text-red-200" : "bg-emerald-500/20 text-emerald-200"}`}>
            {status.message}
          </div>
        )}

        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-semibold mb-3">News categories</h3>
            <div className="flex flex-wrap gap-2">
              {available.categories.map((category) => {
                const selected = preferences.categories.includes(category);
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => handleCategoryToggle(category)}
                    className={`px-4 py-2 rounded-full border capitalize ${selected ? "bg-sky-400 text-slate-900 border-sky-300" : "border-sky-300/50"}`}
                    aria-pressed={selected}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="country" className="block mb-2 font-medium">Country</label>
              <select
                id="country"
                className="preferences-control w-full rounded-lg p-2"
                value={preferences.country}
                onChange={(e) => setPreferences((prev) => ({ ...prev, country: e.target.value }))}
              >
                {available.countries.map((country) => (
                  <option key={country} value={country}>{country.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="language" className="block mb-2 font-medium">Language</label>
              <select
                id="language"
                className="preferences-control w-full rounded-lg p-2"
                value={preferences.language}
                onChange={(e) => setPreferences((prev) => ({ ...prev, language: e.target.value }))}
              >
                {available.languages.map((language) => (
                  <option key={language} value={language}>{language.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">Theme selector</h3>
            <div className="flex flex-wrap gap-2">
              {THEME_OPTIONS.map((theme) => (
                <button
                  key={theme}
                  type="button"
                  className={`px-4 py-2 rounded-lg border capitalize ${preferences.theme === theme ? "bg-sky-400 text-slate-900 border-sky-300" : "border-sky-300/50"}`}
                  onClick={() => patchTheme(theme)}
                  aria-pressed={preferences.theme === theme}
                >
                  {theme}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">Keywords</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="Add keyword"
                className="preferences-control w-full rounded-lg p-2"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addKeyword();
                  }
                }}
              />
              <button type="button" className="btn" onClick={addKeyword}>Add</button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {preferences.keywords.map((keyword) => (
                <span key={keyword} className="preferences-keyword px-3 py-1 rounded-full text-sm">
                  {keyword}
                  <button
                    type="button"
                    className="ml-2"
                    aria-label={`Remove ${keyword}`}
                    onClick={() => removeKeyword(keyword)}
                  >
                    x
                  </button>
                </span>
              ))}
            </div>
            {available.keywords.length > 0 && (
              <p className="text-xs mt-2 opacity-80">Suggestions: {available.keywords.join(", ")}</p>
            )}
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3">Notifications</h3>
            <div className="space-y-3">
              {channels.map((channel) => (
                <div key={channel} className="preferences-row grid md:grid-cols-3 gap-3 items-center rounded-xl p-3">
                  <label className="capitalize font-medium" htmlFor={`${channel}-enabled`}>{channel}</label>
                  <div>
                    <input
                      id={`${channel}-enabled`}
                      type="checkbox"
                      className="notification-checkbox"
                      checked={preferences.notifications[channel].enabled}
                      onChange={(e) => {
                        const enabled = e.target.checked;
                        const nextNotifications = {
                          ...preferences.notifications,
                          [channel]: enabled
                            ? { enabled: true, frequency: preferences.notifications[channel].frequency || "daily" }
                            : { enabled: false },
                        };
                        setChannelEnabled(channel, enabled);
                        saveNotifications(nextNotifications);
                      }}
                    />
                    <span className="ml-2 notification-enabled-text">Enabled</span>
                  </div>
                  <select
                    className="preferences-control notification-frequency rounded-lg p-2"
                    disabled={!preferences.notifications[channel].enabled}
                    value={preferences.notifications[channel].frequency || ""}
                    onChange={(e) => {
                      const frequency = e.target.value;
                      const nextNotifications = {
                        ...preferences.notifications,
                        [channel]: {
                          ...preferences.notifications[channel],
                          enabled: true,
                          frequency,
                        },
                      };
                      setChannelFrequency(channel, frequency);
                      saveNotifications(nextNotifications);
                    }}
                  >
                    <option value="" disabled>Select frequency</option>
                    {FREQUENCY_OPTIONS.map((freq) => (
                      <option key={freq} value={freq}>{freq}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button type="button" className="btn" disabled={isSaving} onClick={saveAllPreferences}>
              {isSaving ? "Saving..." : "Save all preferences"}
            </button>
            <button type="button" className="btn" disabled={isSaving} onClick={handleReset}>
              Reset to default
            </button>
            <button type="button" className="btn" onClick={() => { logout(); navigate("/login"); }}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Preferences;
