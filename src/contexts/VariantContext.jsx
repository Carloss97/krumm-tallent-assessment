import React, { createContext, useContext, useState, useEffect } from 'react';
import '../variants.css';

const VARIANT_KEY = 'ui_variant';
const DEFAULT_VARIANT = import.meta.env.VITE_DEFAULT_UI_VARIANT || 'a';

const VariantContext = createContext({
  variant: DEFAULT_VARIANT,
  setVariant: () => {}
});

export const VariantProvider = ({ children }) => {
  const [variant, setVariantState] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(VARIANT_KEY);
        if (saved) return saved;
      }
    } catch (e) {
      // ignore
    }
    return DEFAULT_VARIANT;
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('ui-variant-a', 'ui-variant-b', 'ui-variant-c');
      document.documentElement.classList.add(`ui-variant-${variant}`);
    }
    try {
      if (typeof window !== 'undefined') localStorage.setItem(VARIANT_KEY, variant);
    } catch (e) {
      // ignore
    }
  }, [variant]);

  const setVariant = (v) => {
    if (!v) return;
    setVariantState(v);
  };

  return (
    <VariantContext.Provider value={{ variant, setVariant }}>
      {children}
    </VariantContext.Provider>
  );
};

export const useVariant = () => useContext(VariantContext);

export default VariantContext;
