import '@testing-library/jest-dom'

// Global mock setup for tests
global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);

