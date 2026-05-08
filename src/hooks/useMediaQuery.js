import { useState, useEffect } from 'react';

/**
 * Hook para detectar cambios en media queries
 * @param {string} query - Media query string (e.g., '(max-width: 768px)')
 * @returns {boolean} - True si la media query coincide
 */
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    
    // Set initial value
    setMatches(mediaQuery.matches);

    // Handler para cambios
    const handleChange = (e) => {
      setMatches(e.matches);
    };

    // Agregar listener
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
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
