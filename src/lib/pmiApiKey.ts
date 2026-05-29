const storageKey = "market-rent-check-pmi-api-key";

export type StoredPmiApiKey = {
  key: string;
  remember: boolean;
};

export function readStoredPmiApiKey(): StoredPmiApiKey {
  const localValue = readFromStorage(getLocalStorage());
  if (localValue) {
    return { key: localValue, remember: true };
  }

  return { key: readFromStorage(getSessionStorage()) ?? "", remember: false };
}

export function writeStoredPmiApiKey(key: string, remember: boolean): void {
  const normalisedKey = key.trim();
  const localStorage = getLocalStorage();
  const sessionStorage = getSessionStorage();

  try {
    if (normalisedKey) {
      sessionStorage?.setItem(storageKey, normalisedKey);
    } else {
      sessionStorage?.removeItem(storageKey);
    }

    if (remember && normalisedKey) {
      localStorage?.setItem(storageKey, normalisedKey);
    } else {
      localStorage?.removeItem(storageKey);
    }
  } catch {
    // Storage can fail in private contexts; the in-memory React state remains usable.
  }
}

export function clearStoredPmiApiKey(): void {
  try {
    getSessionStorage()?.removeItem(storageKey);
    getLocalStorage()?.removeItem(storageKey);
  } catch {
    // Clearing a best-effort local preference must not block the check flow.
  }
}

function readFromStorage(storage: Storage | null): string | null {
  if (!storage) return null;

  try {
    const value = storage.getItem(storageKey);
    return value && value.trim() ? value.trim() : null;
  } catch {
    return null;
  }
}

function getLocalStorage(): Storage | null {
  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

function getSessionStorage(): Storage | null {
  try {
    return window.sessionStorage ?? null;
  } catch {
    return null;
  }
}

