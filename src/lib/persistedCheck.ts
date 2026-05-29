import type { AssessmentResult } from "./assessment";
import type { RentSearchInput } from "../types/rent";

const storageKey = "market-rent-check-last-check";
const storageVersion = 1;

type StoredCheck = {
  version: typeof storageVersion;
  input: RentSearchInput;
  result: AssessmentResult;
  savedAt: string;
};

export function readStoredCheck(): StoredCheck | null {
  const storage = getLocalStorage();
  if (!storage) return null;

  const storedValue = storage.getItem(storageKey);
  if (!storedValue) return null;

  try {
    const parsed = JSON.parse(storedValue) as Partial<StoredCheck>;
    if (!isStoredCheck(parsed)) {
      storage.removeItem(storageKey);
      return null;
    }
    return parsed;
  } catch {
    storage.removeItem(storageKey);
    return null;
  }
}

export function writeStoredCheck(input: RentSearchInput, result: AssessmentResult) {
  const storage = getLocalStorage();
  if (!storage) return;

  const storedCheck: StoredCheck = {
    version: storageVersion,
    input,
    result,
    savedAt: new Date().toISOString()
  };

  try {
    storage.setItem(storageKey, JSON.stringify(storedCheck));
  } catch {
    // Private browsing or storage quotas can block persistence; the check still works.
  }
}

function isStoredCheck(value: Partial<StoredCheck>): value is StoredCheck {
  return (
    value.version === storageVersion &&
    isRentSearchInput(value.input) &&
    Boolean(value.result?.input) &&
    Boolean(value.result?.searchResult) &&
    Boolean(value.result?.estimate)
  );
}

function isRentSearchInput(value: unknown): value is RentSearchInput {
  if (!value || typeof value !== "object") return false;

  const input = value as Partial<RentSearchInput>;
  return (
    typeof input.postcode === "string" &&
    typeof input.rentAmount === "number" &&
    typeof input.rentPeriod === "string" &&
    typeof input.propertyType === "string" &&
    typeof input.bedrooms === "number" &&
    typeof input.tenancyContext === "string"
  );
}

function getLocalStorage(): Storage | null {
  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}
