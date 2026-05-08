import { useState, useEffect } from 'react';

/**
 * Hook para detectar cambios en media queries
 * @param {string} query - Media query string (e.g., '(max-width: 768px)')
 * @returns {boolean} - True si la media query coincide
 */
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQuery = window.matchMedia(query);
    
    // Set initial value
    setMatches(mediaQuery.matches);

    // Handler para cambios
    const handleChange = (e) => {
      setMatches(e.matches);
    };

    // Agregar listener
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    // Cleanup
    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [query]);

  return matches;
};

/**
 * Detectar si es m�vil (<768px)
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
 * Detectar orientaci�n landscape
 */
export const useIsLandscape = () => useMediaQuery('(orientation: landscape)');

export default useMediaQuery;
