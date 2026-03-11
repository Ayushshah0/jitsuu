import { useEffect, useMemo, useState, useContext } from 'react';
import { Link, useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import NotificationContext from '../context/NotificationContext';
import ThemeContext from '../context/ThemeContext';
import './Header.css';

const SEARCH_HISTORY_KEY = 'newsmania_search_history';
const MAX_HISTORY_ITEMS = 10;

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showSearchPopup, setShowSearchPopup] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [toastMessage, setToastMessage] = useState('');
  const { user, logout } = useContext(AuthContext);
  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    markAsRead,
    markAllAsRead,
    trackSearchTerm,
  } = useContext(NotificationContext);
  const { theme, setTheme, fontSize, setFontSize } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const isHome = location.pathname === '/';
  const selectedTheme = theme === 'dark' ? 'dark' : 'light';

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;

      const normalized = parsed
        .map((item) => {
          if (typeof item === 'string') {
            return { term: item, ts: Date.now() };
          }
          if (item && typeof item.term === 'string') {
            return { term: item.term, ts: Number(item.ts) || Date.now() };
          }
          return null;
        })
        .filter(Boolean)
        .slice(0, MAX_HISTORY_ITEMS);

      setSearchHistory(normalized);
    } catch {
      setSearchHistory([]);
    }
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timeoutId = setTimeout(() => setToastMessage(''), 2200);
    return () => clearTimeout(timeoutId);
  }, [toastMessage]);

  const hasHistory = searchHistory.length > 0;

  const sortedHistory = useMemo(
    () => [...searchHistory].sort((first, second) => second.ts - first.ts),
    [searchHistory]
  );

  const persistHistory = (nextHistory) => {
    setSearchHistory(nextHistory);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(nextHistory));
  };

  const saveSearchToHistory = (term) => {
    const trimmed = term.trim();
    if (!trimmed) return;

    const normalizedTerm = trimmed.toLowerCase();
    const exists = searchHistory.some(
      (entry) => entry.term.toLowerCase() === normalizedTerm
    );

    const withoutDuplicate = searchHistory.filter(
      (entry) => entry.term.toLowerCase() !== normalizedTerm
    );

    const nextHistory = [{ term: trimmed, ts: Date.now() }, ...withoutDuplicate].slice(
      0,
      MAX_HISTORY_ITEMS
    );

    persistHistory(nextHistory);
    trackSearchTerm(trimmed);
    setToastMessage(exists ? `You searched "${trimmed}" before` : `Saved "${trimmed}" to history`);
  };

  const applyHistorySearch = (term) => {
    setSearchParams({ q: term });
    saveSearchToHistory(term);
    setShowSearchPopup(false);
    setHistoryOpen(false);
  };

  const handleSearchChange = (event) => {
    const value = event.target.value;
    if (value.trim()) {
      setSearchParams({ q: value });
    } else {
      setSearchParams({});
    }
  };

  const handleClearSearch = () => {
    setSearchParams({});
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === 'Enter') {
      saveSearchToHistory(searchQuery);
      setShowSearchPopup(false);
    }
  };

  const handleClearHistory = () => {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
    setSearchHistory([]);
  };

  const toggleHistory = () => {
    setAccountOpen(false);
    setSettingsOpen(false);
    setHistoryOpen((open) => !open);
  };

  const toggleAccount = () => {
    setHistoryOpen(false);
    setSettingsOpen(false);
    if (!user) {
      navigate('/login');
      return;
    }
    setAccountOpen((open) => !open);
  };

  const toggleSettings = () => {
    setHistoryOpen(false);
    setAccountOpen(false);
    setSettingsOpen((open) => !open);
  };

  const handleLogout = () => {
    logout();
    setAccountOpen(false);
    navigate('/');
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    if (notification.articleUrl) {
      window.open(notification.articleUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <header className="header">
      <div className="header-content">
        <h1 className="logo">📰 NEWS-MANIA</h1>
        <button
          className="menu-toggle"
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          ☰
        </button>
        <nav className={`nav ${menuOpen ? 'open' : ''}`}>
          <Link to="/" className="nav-link">All News</Link>
          <Link to="/top-headlines" className="nav-link">Top Headlines</Link>
          <div className="dropdown">
            <button className="nav-link dropdown-btn">Countries ▾</button>
            <div className="dropdown-content">
              <Link to="/country/us">United States</Link>
              <Link to="/country/gb">United Kingdom</Link>
              <Link to="/country/ca">Canada</Link>
              <Link to="/country/au">Australia</Link>
              <Link to="/country/in">India</Link>
              <Link to="/country/de">Germany</Link>
              <Link to="/country/fr">France</Link>
              <Link to="/country/jp">Japan</Link>
              <Link to="/country/np">Nepal</Link>
            </div>
          </div>
        </nav>
        <div className="search-actions">
          {isHome && (
            <div className="search-bar">
              <input
                type="text"
                className="search-input"
                placeholder="Search news..."
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => setShowSearchPopup(true)}
                onBlur={() => setTimeout(() => setShowSearchPopup(false), 120)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="clear-search"
                  onClick={handleClearSearch}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}

              {showSearchPopup && hasHistory && (
                <div className="search-popup" role="dialog" aria-label="Recent searches">
                  <div className="search-popup-title">Recent searches</div>
                  {sortedHistory.slice(0, 5).map((entry) => (
                    <button
                      key={`${entry.term}-${entry.ts}`}
                      type="button"
                      className="search-popup-item"
                      onMouseDown={() => applyHistorySearch(entry.term)}
                    >
                      {entry.term}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="notification-wrap">
            <button
              type="button"
              className="notification-btn"
              onClick={toggleHistory}
              aria-label={`Smart notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
            >
              🔔
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </button>
            {historyOpen && (
              <div className="notification-panel" role="dialog">
                <div className="panel-header">
                  <h3>Smart Alerts</h3>
                  {user && unreadCount > 0 && (
                    <button
                      type="button"
                      className="clear-history-btn"
                      onClick={markAllAsRead}
                    >
                      Mark All Read
                    </button>
                  )}
                </div>
                <div className="panel-content">
                  {!user ? (
                    <div className="notification-empty-state">
                      <p className="empty-history">Log in to receive smart news alerts.</p>
                      <Link to="/login" className="panel-link" onClick={() => setHistoryOpen(false)}>
                        Login
                      </Link>
                    </div>
                  ) : notificationsLoading ? (
                    <p className="empty-history">Checking for new stories...</p>
                  ) : notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <button
                        key={notification._id}
                        type="button"
                        className={`notification-item ${notification.isRead ? '' : 'unread'}`.trim()}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="notification-copy">
                          <strong>{notification.title}</strong>
                          <small>
                            {(notification.matchedKeywords || []).slice(0, 3).join(', ') || notification.sourceName}
                          </small>
                        </div>
                        {!notification.isRead && <span className="notification-dot" aria-hidden="true" />}
                      </button>
                    ))
                  ) : (
                    <p className="empty-history">No smart alerts yet. Search topics and enable notifications in preferences.</p>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="settings-wrap">
            <button
              type="button"
              className="settings-btn"
              onClick={toggleSettings}
              aria-label="Theme & display settings"
            >
              ⚙️
            </button>
            {settingsOpen && (
              <div className="settings-panel" role="dialog" aria-label="Display settings">
                <div className="settings-panel-header">
                  <h3>Display Settings</h3>
                </div>
                <div className="settings-panel-body">
                  <div className="settings-group">
                    <label className="settings-label">Theme</label>
                    <div className="theme-switcher">
                      <button
                        type="button"
                        className={`theme-option${selectedTheme === 'dark' ? ' active' : ''}`}
                        onClick={() => setTheme('dark')}
                      >
                        <span className="theme-option-icon">🌙</span>
                        <span className="theme-option-copy">Dark Mode</span>
                      </button>
                      <button
                        type="button"
                        className={`theme-option${selectedTheme === 'light' ? ' active' : ''}`}
                        onClick={() => setTheme('light')}
                      >
                        <span className="theme-option-icon">☀️</span>
                        <span className="theme-option-copy">Day Mode</span>
                      </button>
                    </div>
                  </div>
                  <div className="settings-group">
                    <label className="settings-label">Font Size</label>
                    <div className="font-size-control">
                      <div className="font-size-slider">
                        <span className="font-size-label-sm">A</span>
                        <input
                          type="range"
                          min={12}
                          max={22}
                          step={1}
                          value={fontSize}
                          onChange={(e) => setFontSize(Number(e.target.value))}
                          className="font-range"
                        />
                        <span className="font-size-label-lg">A</span>
                      </div>
                      <span className="font-size-value">{fontSize}px</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="account-wrap">
            <button
              type="button"
              className="account-btn"
              onClick={toggleAccount}
              aria-label="Account"
            >
              👤
            </button>
            {accountOpen && (
              <div className="account-panel" role="dialog">
                {user ? (
                  <>
                    <div className="panel-header">
                      <h3>Welcome, {user.name}!</h3>
                    </div>
                    <div className="panel-content">
                      <Link to="/bookmarks" className="panel-link" onClick={() => setAccountOpen(false)}>
                        My Bookmarks
                      </Link>
                      <Link to="/preferences" className="panel-link" onClick={() => setAccountOpen(false)}>
                        My Preferences
                      </Link>
                      <button
                        type="button"
                        className="logout-btn"
                        onClick={handleLogout}
                      >
                        Logout
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="panel-content">
                     <p>Please log in to see your account details.</p>
                     <Link to="/login" className="nav-link" onClick={() => setAccountOpen(false)}>Login</Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {toastMessage && <div className="search-toast">{toastMessage}</div>}
    </header>
  );
}

export default Header;
