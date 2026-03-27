import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const SUPPORTED = new Set(['es', 'en']);

const normalizeLanguage = (value) => {
  if (!value || typeof value !== 'string') return 'es';
  const normalized = value.toLowerCase();
  return SUPPORTED.has(normalized) ? normalized : 'es';
};

const getInitialLanguage = () => {
  if (typeof window === 'undefined') return 'es';

  const urlLang = new URLSearchParams(window.location.search).get('lang');
  if (urlLang) return normalizeLanguage(urlLang);

  const stored = window.localStorage.getItem('krumm-lang');
  if (stored) return normalizeLanguage(stored);

  return 'es';
};

const resolveLocalized = (value, language) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    return value[language] || value.es || value.en || '';
  }
  return String(value);
};

const LanguageContext = createContext({
  language: 'es',
  setLanguage: () => {},
  resolveLocalized,
});

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(getInitialLanguage);

  const setLanguage = (value) => {
    setLanguageState(normalizeLanguage(value));
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('krumm-lang', language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, resolveLocalized }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = () => useContext(LanguageContext);

// eslint-disable-next-line react-refresh/only-export-components
export { resolveLocalized };
