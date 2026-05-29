import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";

const localStorageValues = new Map<string, string>();
const sessionStorageValues = new Map<string, string>();

Object.defineProperty(window, "localStorage", {
  configurable: true,
  value: {
    getItem: (key: string) => localStorageValues.get(key) ?? null,
    setItem: (key: string, value: string) => localStorageValues.set(key, value),
    removeItem: (key: string) => localStorageValues.delete(key),
    clear: () => localStorageValues.clear(),
    key: (index: number) => Array.from(localStorageValues.keys())[index] ?? null,
    get length() {
      return localStorageValues.size;
    }
  }
});

Object.defineProperty(window, "sessionStorage", {
  configurable: true,
  value: {
    getItem: (key: string) => sessionStorageValues.get(key) ?? null,
    setItem: (key: string, value: string) => sessionStorageValues.set(key, value),
    removeItem: (key: string) => sessionStorageValues.delete(key),
    clear: () => sessionStorageValues.clear(),
    key: (index: number) => Array.from(sessionStorageValues.keys())[index] ?? null,
    get length() {
      return sessionStorageValues.size;
    }
  }
});

afterEach(() => {
  localStorageValues.clear();
  sessionStorageValues.clear();
});
