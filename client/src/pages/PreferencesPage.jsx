import React, { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import NotificationContext from '../context/NotificationContext';
import { newsService } from '../services/newsService';
import '../styles/Preferences.css';

// Mock data - in a real app, this would come from a config or API
const allCountries = [
  { code: 'us', name: 'United States' },
  { code: 'gb', name: 'United Kingdom' },
  { code: 'ca', name: 'Canada' },
  { code: 'au', name: 'Australia' },
  { code: 'in', name: 'India' },
  { code: 'de', name: 'Germany' },
  { code: 'fr', name: 'France' },
  { code: 'jp', name: 'Japan' },
  { code: 'np', name: 'Nepal' },
];

const allCategories = [
  'business', 'entertainment', 'general', 'health', 'science', 'sports', 'technology'
];

function PreferencesPage() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const { requestBrowserPermission } = useContext(NotificationContext);
  const [selectedCountry, setSelectedCountry] = useState('us');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [trackedKeywords, setTrackedKeywords] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [browserEnabled, setBrowserEnabled] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return; // Wait for user to be loaded
    if (!user) {
      setLoading(false);
      return;
    }

    newsService.getPreferences()
      .then(response => {
        const prefs = response.data.data;
        if (prefs) {
          setSelectedCountry(prefs.country || 'us');
          setSelectedCategories(prefs.categories || []);
          setSelectedKeywords(prefs.keywords || []);
          setKeywordInput((prefs.keywords || []).join(', '));
          setTrackedKeywords(prefs.trackedKeywords || []);
          setRecentSearches(prefs.recentSearches || []);
          setInAppEnabled(prefs.notifications?.inApp?.enabled !== false);
          setBrowserEnabled(Boolean(prefs.notifications?.browser?.enabled));
        }
      })
      .catch(() => {
        setError('Could not load your preferences.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user, authLoading]);

  const handleCountryChange = (countryCode) => {
    setSelectedCountry(countryCode);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage('');
    setError('');

    const parsedKeywords = keywordInput
      .split(',')
      .map((keyword) => keyword.trim())
      .filter(Boolean);

    if (browserEnabled) {
      const permission = await requestBrowserPermission();
      if (permission === 'denied') {
        setError('Browser notifications are blocked in your browser settings.');
        return;
      }
    }

    try {
      await newsService.updatePreferences({
        country: selectedCountry,
        categories: selectedCategories,
        keywords: parsedKeywords,
        notifications: {
          inApp: { enabled: inAppEnabled },
          browser: { enabled: browserEnabled }
        }
      });
      setSelectedKeywords(parsedKeywords);
      setStatusMessage('Preferences saved successfully!');
    } catch (err) {
      setError('Failed to save preferences. Please try again.');
    } finally {
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  if (authLoading || loading) {
    return <div className="preferences-page"><h2>Loading...</h2></div>;
  }

  if (!user) {
    return <div className="preferences-page"><h2>Please log in to set your preferences.</h2></div>;
  }

  return (
    <div className="preferences-page">
      <h2>My Preferences</h2>
      <p>Customize your news feed by selecting your preferred country and favorite categories.</p>
      
      <form onSubmit={handleSubmit} className="preferences-form">
        {error && <p className="error-message">{error}</p>}
        <fieldset>
          <legend>Preferred Country</legend>
          <div className="checkbox-grid">
            {allCountries.map(country => (
              <div key={country.code} className="checkbox-item">
                <input
                  type="radio"
                  id={`country-${country.code}`}
                  value={country.code}
                  name="preferred-country"
                  checked={selectedCountry === country.code}
                  onChange={() => handleCountryChange(country.code)}
                />
                <label htmlFor={`country-${country.code}`}>{country.name}</label>
              </div>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Favorite Categories</legend>
          <div className="checkbox-grid">
            {allCategories.map(category => (
              <div key={category} className="checkbox-item">
                <input
                  type="checkbox"
                  id={`category-${category}`}
                  value={category}
                  checked={selectedCategories.includes(category)}
                  onChange={() => handleCategoryChange(category)}
                />
                <label htmlFor={`category-${category}`}>{category.charAt(0).toUpperCase() + category.slice(1)}</label>
              </div>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Tracked Keywords</legend>
          <p className="fieldset-copy">Add comma-separated keywords you want the smart alert system to watch for.</p>
          <textarea
            className="preferences-textarea"
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
            placeholder="e.g. AI, election, bitcoin, world cup"
          />
          {selectedKeywords.length > 0 && (
            <div className="keyword-chip-list">
              {selectedKeywords.map((keyword) => (
                <span key={keyword} className="keyword-chip">{keyword}</span>
              ))}
            </div>
          )}
        </fieldset>

        <fieldset>
          <legend>Notification Settings</legend>
          <div className="toggle-list">
            <label className="toggle-item">
              <span>
                <strong>In-app notifications</strong>
                <small>Show smart alerts in the notification panel.</small>
              </span>
              <input
                type="checkbox"
                checked={inAppEnabled}
                onChange={(event) => setInAppEnabled(event.target.checked)}
              />
            </label>
            <label className="toggle-item">
              <span>
                <strong>Browser notifications</strong>
                <small>Allow desktop alerts when new related stories are detected.</small>
              </span>
              <input
                type="checkbox"
                checked={browserEnabled}
                onChange={(event) => setBrowserEnabled(event.target.checked)}
              />
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend>Recent Searches Used For Alerts</legend>
          {recentSearches.length > 0 ? (
            <div className="keyword-chip-list">
              {recentSearches.map((entry) => (
                <span key={`${entry.term}-${entry.searchedAt || entry.term}`} className="keyword-chip secondary">{entry.term}</span>
              ))}
            </div>
          ) : (
            <p className="fieldset-copy">Searches you perform in the app will appear here and feed the smart alert system.</p>
          )}
        </fieldset>

        <fieldset>
          <legend>Auto-Tracked Topics</legend>
          {trackedKeywords.length > 0 ? (
            <div className="keyword-chip-list">
              {trackedKeywords.map((keyword) => (
                <span key={keyword} className="keyword-chip accent">{keyword}</span>
              ))}
            </div>
          ) : (
            <p className="fieldset-copy">Tracked keywords will build automatically from your searches and saved preferences.</p>
          )}
        </fieldset>

        <button type="submit" className="save-prefs-button">Save Preferences</button>
        {statusMessage && <p className="status-message">{statusMessage}</p>}
      </form>
    </div>
  );
}

export default PreferencesPage;
