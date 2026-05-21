import '@testing-library/jest-dom'

// Global mock setup for tests
// eslint-disable-next-line no-undef
global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
// eslint-disable-next-line no-undef
global.cancelAnimationFrame = (id) => clearTimeout(id);

// eslint-disable-next-line no-undef
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// eslint-disable-next-line no-undef
global.IntersectionObserver = class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};