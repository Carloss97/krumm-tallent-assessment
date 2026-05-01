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
    } catch (error) {
      void error;
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
    } catch (error) {
      void error;
    }
  }, [variant]);

  // Decorate panels with collapse toggles when Variant B is active.
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const addCollapses = () => {
      const panels = Array.from(document.querySelectorAll('.lv3-panel'));
      panels.forEach((panel) => {
        if (panel.dataset.vbToggle === '1') return;
        panel.dataset.vbToggle = '1';
        panel.style.position = panel.style.position || 'relative';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'variant-collapse-toggle';
        btn.setAttribute('aria-expanded', 'true');
        btn.innerHTML = '<span class="vc-icon">▾</span>';

        btn.addEventListener('click', () => {
          const isCollapsed = panel.classList.toggle('variant-collapsed');
          btn.setAttribute('aria-expanded', String(!isCollapsed));
          const icon = btn.querySelector('.vc-icon');
          if (icon) icon.textContent = isCollapsed ? '▸' : '▾';
        });

        panel.prepend(btn);
      });
    };

    const removeCollapses = () => {
      const panels = Array.from(document.querySelectorAll('.lv3-panel'));
      panels.forEach((panel) => {
        if (panel.dataset.vbToggle !== '1') return;
        const btn = panel.querySelector('.variant-collapse-toggle');
        if (btn) btn.remove();
        panel.classList.remove('variant-collapsed');
        delete panel.dataset.vbToggle;
      });
    };

    if (variant === 'b') {
      // small delay to allow lazy-loaded content to mount
      const t = setTimeout(addCollapses, 120);
      return () => {
        clearTimeout(t);
        removeCollapses();
      };
    }

    // ensure cleanup when leaving variant B
    removeCollapses();
    return undefined;
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

export const useVariant = () => useContext(VariantContext); // eslint-disable-line react-refresh/only-export-components
