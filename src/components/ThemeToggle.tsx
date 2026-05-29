import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark";

type StoredThemeOverride = {
  preference: ThemeMode;
  systemThemeAtSet: ThemeMode;
};

const storageKey = "market-rent-check-theme";
const darkQuery = "(prefers-color-scheme: dark)";

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>(() => resolveInitialTheme());

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;

    const mediaQuery = window.matchMedia(darkQuery);

    function handleSystemThemeChange(event: MediaQueryListEvent) {
      getStorage()?.removeItem(storageKey);
      setTheme(event.matches ? "dark" : "light");
    }

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    const systemTheme = getSystemTheme();
    const override: StoredThemeOverride = {
      preference: nextTheme,
      systemThemeAtSet: systemTheme
    };

    getStorage()?.setItem(storageKey, JSON.stringify(override));
    setTheme(nextTheme);
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      onClick={toggleTheme}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function resolveInitialTheme(): ThemeMode {
  const systemTheme = getSystemTheme();
  const storedTheme = readStoredTheme(systemTheme);
  return storedTheme ?? systemTheme;
}

function getSystemTheme(): ThemeMode {
  if (typeof window.matchMedia !== "function") return "light";
  return window.matchMedia(darkQuery).matches ? "dark" : "light";
}

function readStoredTheme(systemTheme: ThemeMode): ThemeMode | null {
  const storage = getStorage();
  if (!storage) return null;

  const storedValue = storage.getItem(storageKey);
  if (!storedValue) return null;

  try {
    const parsed = JSON.parse(storedValue) as Partial<StoredThemeOverride>;
    if (
      (parsed.preference === "light" || parsed.preference === "dark") &&
      (parsed.systemThemeAtSet === "light" || parsed.systemThemeAtSet === "dark")
    ) {
      if (parsed.systemThemeAtSet === systemTheme) {
        return parsed.preference;
      }
    }
  } catch {
    // Ignore invalid persisted values and fall back to the system setting.
  }

  storage.removeItem(storageKey);
  return null;
}

function getStorage(): Storage | null {
  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M20.1 14.7A7.8 7.8 0 0 1 9.3 3.9 8.6 8.6 0 1 0 20.1 14.7Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle
        cx="12"
        cy="12"
        r="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 2v2.2M12 19.8V22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2 12h2.2M19.8 12H22M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}
