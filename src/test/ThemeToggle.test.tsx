import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ThemeToggle } from "../components/ThemeToggle";

type ThemeListener = (event: MediaQueryListEvent) => void;

function installMatchMedia(matches: boolean) {
  const listeners = new Set<ThemeListener>();
  const mediaQuery = {
    matches,
    media: "(prefers-color-scheme: dark)",
    onchange: null,
    addEventListener: vi.fn((_event: string, listener: ThemeListener) => {
      listeners.add(listener);
    }),
    removeEventListener: vi.fn((_event: string, listener: ThemeListener) => {
      listeners.delete(listener);
    }),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn()
  } as unknown as MediaQueryList;

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockReturnValue(mediaQuery)
  });

  return {
    mediaQuery,
    changeTo(nextMatches: boolean) {
      Object.defineProperty(mediaQuery, "matches", {
        configurable: true,
        value: nextMatches
      });
      listeners.forEach((listener) =>
        listener({ matches: nextMatches } as MediaQueryListEvent)
      );
    }
  };
}

function installLocalStorage() {
  const values = new Map<string, string>();
  const storage = {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => values.set(key, value)),
    removeItem: vi.fn((key: string) => values.delete(key)),
    clear: vi.fn(() => values.clear()),
    key: vi.fn((index: number) => Array.from(values.keys())[index] ?? null),
    get length() {
      return values.size;
    }
  } as Storage;

  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: storage
  });
}

describe("ThemeToggle", () => {
  afterEach(() => {
    window.localStorage?.clear();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.style.colorScheme = "";
    vi.restoreAllMocks();
  });

  it("uses the system theme by default and stores an icon-only user override", async () => {
    const user = userEvent.setup();
    installLocalStorage();
    installMatchMedia(true);

    render(<ThemeToggle />);

    const toggle = screen.getByRole("button", { name: /switch to light mode/i });
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(toggle).not.toHaveTextContent(/\S/);
    expect(document.documentElement.dataset.theme).toBe("dark");

    await user.click(toggle);

    expect(document.documentElement.dataset.theme).toBe("light");
    expect(
      JSON.parse(window.localStorage.getItem("market-rent-check-theme") ?? "{}")
    ).toMatchObject({
      preference: "light",
      systemThemeAtSet: "dark"
    });
  });

  it("drops the user override when the system theme changes", async () => {
    const user = userEvent.setup();
    installLocalStorage();
    const systemTheme = installMatchMedia(false);

    render(<ThemeToggle />);

    await user.click(screen.getByRole("button", { name: /switch to dark mode/i }));
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(window.localStorage.getItem("market-rent-check-theme")).toBeTruthy();

    act(() => {
      systemTheme.changeTo(true);
    });

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(window.localStorage.getItem("market-rent-check-theme")).toBeNull();
  });
});
