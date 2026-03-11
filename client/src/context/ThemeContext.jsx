import { createContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

const THEME_KEY = 'newsmania_theme';
const FONT_SIZE_KEY = 'newsmania_font_size';

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'system');
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem(FONT_SIZE_KEY);
    if (saved) {
      const num = Number(saved);
      if (!isNaN(num) && num >= 12 && num <= 22) return num;
    }
    return 16;
  });

  useEffect(() => {
    const apply = (resolved) => {
      document.documentElement.setAttribute('data-theme', resolved);
    };

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      apply(mq.matches ? 'dark' : 'light');
      const handler = (e) => apply(e.matches ? 'dark' : 'light');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }

    apply(theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.fontSize = fontSize + 'px';
    localStorage.setItem(FONT_SIZE_KEY, String(fontSize));
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, fontSize, setFontSize }}>
      {children}
    </ThemeContext.Provider>
  );
}

export default ThemeContext;
