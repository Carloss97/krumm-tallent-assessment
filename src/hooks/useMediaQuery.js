import { useSyncExternalStore } from 'react';

/**
 * Hook para detectar cambios en media queries
 * @param {string} query - Media query string (e.g., '(max-width: 768px)')
 * @returns {boolean} - True si la media query coincide
 */
export const useMediaQuery = (query) => {
  const subscribe = (onStoreChange) => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return () => {};
    }

    const mediaQuery = window.matchMedia(query);
    const handleChange = () => onStoreChange();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  };

  const getSnapshot = () => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }

    return window.matchMedia(query).matches;
  };

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
};

/**
 * Detectar si es móvil (<768px)
 */
export const useIsMobile = () => useMediaQuery('(max-width: 767px)');

/**
 * Detectar si es tablet (768px - 1023px)
 */
export const useIsTablet = () => useMediaQuery('(min-width: 768px) and (max-width: 1023px)');

/**
 * Detectar si es desktop (>=1024px)
 */
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');

/**
 * Detectar orientación landscape
 */
export const useIsLandscape = () => useMediaQuery('(orientation: landscape)');

export default useMediaQuery;
