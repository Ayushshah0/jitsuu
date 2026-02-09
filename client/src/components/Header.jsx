import { useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import './Header.css';

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const isHome = location.pathname === '/';

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
        {isHome && (
          <div className="search-bar">
            <input
              type="text"
              className="search-input"
              placeholder="Search news..."
              value={searchQuery}
              onChange={handleSearchChange}
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
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
