import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { clearAuthToken } from '../services/api.js';

// Node 22+ ships an experimental `localStorage` global that returns undefined
// without `--localstorage-file`, shadowing jsdom's. Install a deterministic
// in-memory Storage so the app code (which reads `globalThis.localStorage`) and
// tests share one working implementation.
function createMemoryStorage() {
  const store = new Map();
  return {
    get length() {
      return store.size;
    },
    key(index) {
      const keys = Array.from(store.keys());
      return index < keys.length ? keys[index] : null;
    },
    getItem(key) {
      const k = String(key);
      return store.has(k) ? store.get(k) : null;
    },
    setItem(key, value) {
      store.set(String(key), String(value));
    },
    removeItem(key) {
      store.delete(String(key));
    },
    clear() {
      store.clear();
    },
  };
}

function installStorage() {
  const local = createMemoryStorage();
  const session = createMemoryStorage();
  for (const [name, impl] of [['localStorage', local], ['sessionStorage', session]]) {
    try {
      Object.defineProperty(globalThis, name, { configurable: true, writable: true, value: impl });
    } catch {
      globalThis[name] = impl;
    }
  }
}

installStorage();

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  clearAuthToken();
  vi.unstubAllGlobals();
});