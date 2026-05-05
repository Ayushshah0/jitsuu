import React, { useState, useEffect } from "react";
import { Link } from 'react-router-dom'
import countries from "./countries";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleArrowDown, faUser, faBell } from '@fortawesome/free-solid-svg-icons'
import UniversalSearchBar from './UniversalSearchBar';
import AccountPanel from './AccountPanel';
import { useAuth } from "../context/AuthContext";




function Header() {
  const { isAuthenticated, logout } = useAuth();
  const [active, setActive] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark-theme' || savedTheme === 'light-theme') {
      return savedTheme;
    }
    return 'light-theme';
  });
  let category = ["business", "entertainment", "general", "health", "science", "sports", "technology","politics"]

  useEffect(() => {
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(theme);
    document.documentElement.classList.remove('light-theme', 'dark-theme');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme])

  function toggleTheme() {
    setTheme((previousTheme) => previousTheme === 'light-theme' ? 'dark-theme' : 'light-theme');
  }

  return (
    <>
      <UniversalSearchBar />
      <header className="">
        <nav className="fixed top-0 left-0 w-full h-auto z-10 flex items-center justify-between px-4 md:px-8">
          <h3 className="relative heading font-bold text-2xl">News_Aggregator</h3>
          <div className="hidden md:flex items-center gap-8">
            <ul className="flex items-center gap-8">
              <li><Link className="no-underline font-semibold" to="/">All News</Link></li>
              <li className="dropdown-li relative">
                <button className="no-underline font-semibold flex items-center gap-2" onClick={() => { setShowCategoryDropdown(!showCategoryDropdown); setShowCountryDropdown(false) }}>
                  Top-Headlines <FontAwesomeIcon className={showCategoryDropdown ? "down-arrow-icon down-arrow-icon-active" : "down-arrow-icon"} icon={faCircleArrowDown} />
                </button>
                <ul className={showCategoryDropdown ? "dropdown p-2 show-dropdown absolute" : "dropdown p-2 absolute hidden"}>
                  {category.map((element, index) => (
                    <li key={index} onClick={() => { setShowCategoryDropdown(false) }}>
                      <Link to={"/top-headlines/" + element} className="flex gap-3 capitalize">
                        {element}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              <li className="dropdown-li relative">
                <button className="no-underline font-semibold flex items-center gap-2" onClick={() => { setShowCountryDropdown(!showCountryDropdown); setShowCategoryDropdown(false) }}>
                  Country <FontAwesomeIcon className={showCountryDropdown ? "down-arrow-icon down-arrow-icon-active" : "down-arrow-icon"} icon={faCircleArrowDown} />
                </button>
                <ul className={showCountryDropdown ? "dropdown p-2 show-dropdown absolute" : "dropdown p-2 absolute hidden"}>
                  {countries.map((element, index) => (
                    <li key={index} onClick={() => { setShowCountryDropdown(false) }}>
                      <Link to={"/country/" + element?.iso_2_alpha} className="flex gap-3">
                        <img
                          src={element?.png}
                          srcSet={`https://flagcdn.com/32x24/${element?.iso_2_alpha}.png 2x`}
                          alt={element?.countryName}
                        />
                        <span>{element?.countryName}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
            <div className="flex items-center gap-4">
              <Link className="no-underline font-semibold" to="/notifications" aria-label="Open notifications page">
                <FontAwesomeIcon icon={faBell} />
              </Link>
              {isAuthenticated ? (
                <button className="no-underline font-semibold" type="button" aria-label="Open account panel" onClick={() => setShowPreferences(true)}>
                  <FontAwesomeIcon icon={faUser} />
                </button>
              ) : (
                <Link className="no-underline font-semibold" to="/login" aria-label="Open login page">
                  <FontAwesomeIcon icon={faUser} />
                </Link>
              )}
              {isAuthenticated && (
                <button className="no-underline font-semibold" type="button" onClick={logout}>Logout</button>
              )}
              <div className="no-underline font-semibold" aria-label="Toggle dark mode">
                <input
                  type="checkbox"
                  className="checkbox"
                  id="checkbox"
                  checked={theme === 'dark-theme'}
                  onChange={toggleTheme}
                />
                <label htmlFor="checkbox" className="checkbox-label">
                  <i className="fas fa-moon"></i>
                  <i className="fas fa-sun"></i>
                  <span className="ball"></span>
                </label>
              </div>
            </div>
          </div>
          <div className="md:hidden flex items-center">
            <button className="ham-burger z-50" onClick={() => setActive(!active)}>
              <span className="lines line-1"></span>
              <span className="lines line-2"></span>
              <span className="lines line-3"></span>
            </button>
          </div>
        </nav>
        <div className={`mobile-nav ${active ? 'active' : ''}`}>
          <ul className="flex flex-col items-center gap-8 mt-20">
          <li><Link className="no-underline font-semibold" to="/" onClick={() => setActive(false)}>All News</Link></li>
          <li className="w-full text-center">
            <button className="no-underline font-semibold flex items-center justify-center gap-2 w-full" onClick={() => { setShowCategoryDropdown(!showCategoryDropdown); setShowCountryDropdown(false) }}>
              Top-Headlines <FontAwesomeIcon className={showCategoryDropdown ? "down-arrow-icon down-arrow-icon-active" : "down-arrow-icon"} icon={faCircleArrowDown} />
            </button>
            <ul className={showCategoryDropdown ? "p-2" : "p-2 hidden"}>
              {category.map((element, index) => (
                <li key={index} onClick={() => { setActive(false); setShowCategoryDropdown(false); }}>
                  <Link to={"/top-headlines/" + element} className="flex gap-3 capitalize justify-center">
                    {element}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
          <li className="w-full text-center">
            <button className="no-underline font-semibold flex items-center justify-center gap-2 w-full" onClick={() => { setShowCountryDropdown(!showCountryDropdown); setShowCategoryDropdown(false) }}>
              Country <FontAwesomeIcon className={showCountryDropdown ? "down-arrow-icon down-arrow-icon-active" : "down-arrow-icon"} icon={faCircleArrowDown} />
            </button>
            <ul className={showCountryDropdown ? "p-2" : "p-2 hidden"}>
              {countries.map((element, index) => (
                <li key={index} onClick={() => { setActive(false); setShowCountryDropdown(false); }}>
                  <Link to={"/country/" + element?.iso_2_alpha} className="flex gap-3 justify-center">
                    <img
                      src={element?.png}
                      srcSet={`https://flagcdn.com/32x24/${element?.iso_2_alpha}.png 2x`}
                      alt={element?.countryName}
                    />
                    <span>{element?.countryName}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </li>
          <li>
              <Link className="no-underline font-semibold" to="/notifications" aria-label="Open notifications page" onClick={() => setActive(false)}>
                <FontAwesomeIcon icon={faBell} />
              </Link>
          </li>
          <li>
              {isAuthenticated ? (
                <button className="no-underline font-semibold" type="button" aria-label="Open account panel" onClick={() => { setActive(false); setShowPreferences(true); }}>
                  <FontAwesomeIcon icon={faUser} />
                </button>
              ) : (
                <Link className="no-underline font-semibold" to="/login" aria-label="Open login page" onClick={() => setActive(false)}>
                  <FontAwesomeIcon icon={faUser} />
                </Link>
              )}
            </li>
            {isAuthenticated && (
              <li>
                <button className="no-underline font-semibold" type="button" onClick={() => { logout(); setActive(false); }}>Logout</button>
              </li>
            )}
            <li>
              <div className="no-underline font-semibold" aria-label="Toggle dark mode">
                <input
                  type="checkbox"
                  className="checkbox"
                  id="mobile-checkbox"
                  checked={theme === 'dark-theme'}
                  onChange={toggleTheme}
                />
                <label htmlFor="mobile-checkbox" className="checkbox-label">
                  <i className="fas fa-moon"></i>
                  <i className="fas fa-sun"></i>
                  <span className="ball"></span>
                </label>
              </div>
            </li>
          </ul>
        </div>

        {/* Account panel modal overlay */}
        {showPreferences && (
          <div className="fixed inset-0 z-50 flex items-start justify-end">
            <div className="w-full max-w-md h-screen overflow-auto bg-[color-mix(in_srgb,var(--primary)_95%,transparent)] border-l border-[var(--border)] shadow-2xl" role="dialog" aria-modal="true">
              <div className="flex justify-end p-4">
                <button 
                  className="text-3xl font-bold text-[var(--accent-cyan)] hover:opacity-70 transition" 
                  onClick={() => setShowPreferences(false)} 
                  aria-label="Close account panel"
                >
                  ✕
                </button>
              </div>
              <AccountPanel onClose={() => setShowPreferences(false)} />
            </div>
            <div className="flex-1 bg-black bg-opacity-40" onClick={() => setShowPreferences(false)} />
          </div>
        )}
      </header>
    </>
  );
}

export default Header;
