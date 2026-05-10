import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ThemeContext = createContext();

const STORAGE_KEY = 'pizza-peninsula-theme';

export function ThemeProvider({ children }) {
  const [dark, setDarkState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) return stored === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem(STORAGE_KEY, String(dark));
  }, [dark]);

  const toggle = useCallback(() => setDarkState((prev) => !prev), []);

  return (
    <ThemeContext.Provider value={{ dark, toggle, setDark: setDarkState }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
