import { vi } from 'vitest'
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

// Mock localStorage for tests
const localStorageMock = {
  getItem: vi.fn((key) => {
    const store = localStorageMock.store;
    return store[key] ?? null;
  }),
  setItem: vi.fn((key, value) => {
    localStorageMock.store[key] = String(value);
  }),
  removeItem: vi.fn((key) => {
    delete localStorageMock.store[key];
  }),
  clear: vi.fn(() => {
    localStorageMock.store = {};
  }),
  store: {},
};

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock matchMedia for tests
Object.defineProperty(global, 'matchMedia', {
  value: vi.fn((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
  writable: true,
});