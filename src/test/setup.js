import '@testing-library/jest-dom'

// Global mock setup for tests
// eslint-disable-next-line no-undef
global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
// eslint-disable-next-line no-undef
global.cancelAnimationFrame = (id) => clearTimeout(id);

