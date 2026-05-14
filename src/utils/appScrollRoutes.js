const SCROLLABLE_EXACT_ROUTES = new Set([
  '/',
  '/intro',
  '/complementary/intro',
  '/report',
]);

export const shouldEnableAppScroll = (pathname = '') => {
  if (typeof pathname !== 'string') return false;
  return SCROLLABLE_EXACT_ROUTES.has(pathname) || pathname.startsWith('/dev/');
};
