import type {
  OfficialBenchmarkComparison,
  OfficialBenchmarkField,
  OfficialBenchmarkStatus,
  OfficialRentBenchmark
} from "../types/officialRentBenchmark";
import type { LiveRentalEvidenceResult } from "../types/liveEvidence";
import type { RentSearchInput } from "../types/rent";
import type { EvidenceMode } from "../types/rentCheckResult";

const storageKey = "market-rent-check-last-check";
const storageVersion = 4;
const tenancyContexts: Array<RentSearchInput["tenancyContext"]> = [
  "current-rent-only",
  "informal-proposed-increase",
  "formal-form-4a-section-13"
];
const benchmarkStatuses: OfficialBenchmarkStatus[] = [
  "below_benchmark",
  "near_benchmark",
  "above_benchmark",
  "substantially_above_benchmark"
];
const benchmarkFields: OfficialBenchmarkField[] = [
  "monthlyRentAll",
  "monthlyRentOneBed",
  "monthlyRentTwoBed",
  "monthlyRentThreeBed",
  "monthlyRentFourOrMoreBed",
  "monthlyRentFlatMaisonette"
];

type StoredCheck = {
  version: typeof storageVersion;
  input: RentSearchInput;
  officialBenchmarkComparison: OfficialBenchmarkComparison;
  liveEvidence?: LiveRentalEvidenceResult;
  warnings: string[];
  evidenceMode: EvidenceMode;
  sourceSha256: string;
  savedAt: string;
};

type StoredCheckEvidence = Pick<
  StoredCheck,
  "liveEvidence" | "warnings" | "evidenceMode"
>;

export function readStoredCheck(currentSourceSha256: string): StoredCheck | null {
  const storage = getLocalStorage();
  if (!storage) return null;

  const storedValue = storage.getItem(storageKey);
  if (!storedValue) return null;

  try {
    const parsed = JSON.parse(storedValue) as Partial<StoredCheck>;
    if (!isStoredCheck(parsed) || parsed.sourceSha256 !== currentSourceSha256) {
      storage.removeItem(storageKey);
      return null;
    }
    return parsed;
  } catch {
    storage.removeItem(storageKey);
    return null;
  }
}

export function writeStoredCheck(
  input: RentSearchInput,
  officialBenchmarkComparison: OfficialBenchmarkComparison,
  evidence: StoredCheckEvidence,
  sourceSha256: string
) {
  const storage = getLocalStorage();
  if (!storage) return;

  const storedCheck: StoredCheck = {
    version: storageVersion,
    input,
    officialBenchmarkComparison,
    liveEvidence: evidence.liveEvidence,
    warnings: evidence.warnings,
    evidenceMode: evidence.evidenceMode,
    sourceSha256,
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
    isOfficialBenchmarkComparison(value.officialBenchmarkComparison) &&
    (value.liveEvidence === undefined || isLiveEvidence(value.liveEvidence)) &&
    Array.isArray(value.warnings) &&
    value.warnings.every((warning) => typeof warning === "string") &&
    isEvidenceMode(value.evidenceMode) &&
    typeof value.sourceSha256 === "string" &&
    value.sourceSha256.trim() !== "" &&
    typeof value.savedAt === "string"
  );
}

function isRentSearchInput(value: unknown): value is RentSearchInput {
  if (!value || typeof value !== "object") return false;

  const input = value as Partial<RentSearchInput>;
  return (
    typeof input.postcode === "string" &&
    typeof input.localAuthorityCode === "string" &&
    input.localAuthorityCode.trim() !== "" &&
    typeof input.rentAmount === "number" &&
    typeof input.rentPeriod === "string" &&
    typeof input.propertyType === "string" &&
    typeof input.bedrooms === "number" &&
    typeof input.tenancyContext === "string" &&
    tenancyContexts.includes(input.tenancyContext as RentSearchInput["tenancyContext"])
  );
}

function isOfficialBenchmarkComparison(
  value: unknown
): value is OfficialBenchmarkComparison {
  if (!value || typeof value !== "object") return false;

  const comparison = value as Partial<OfficialBenchmarkComparison>;
  return (
    isOfficialBenchmark(comparison.benchmark) &&
    isBenchmarkSelection(comparison.selection) &&
    isFiniteNumber(comparison.userRentMonthly) &&
    comparison.userRentMonthly > 0 &&
    isFiniteNumber(comparison.differenceMonthly) &&
    isFiniteNumber(comparison.percentageDifference) &&
    typeof comparison.status === "string" &&
    benchmarkStatuses.includes(comparison.status as OfficialBenchmarkStatus)
  );
}

function isOfficialBenchmark(value: unknown): value is OfficialRentBenchmark {
  if (!value || typeof value !== "object") return false;

  const benchmark = value as Partial<OfficialRentBenchmark>;
  return (
    typeof benchmark.areaCode === "string" &&
    benchmark.areaCode.trim() !== "" &&
    typeof benchmark.areaName === "string" &&
    benchmark.areaName.trim() !== "" &&
    typeof benchmark.regionOrCountryName === "string" &&
    benchmark.regionOrCountryName.trim() !== "" &&
    typeof benchmark.period === "string" &&
    benchmark.period.trim() !== "" &&
    benchmarkFields.every((field) => {
      const valueForField = benchmark[field];
      return isFiniteNumber(valueForField) && valueForField > 0;
    })
  );
}

function isBenchmarkSelection(
  value: unknown
): value is OfficialBenchmarkComparison["selection"] {
  if (!value || typeof value !== "object") return false;

  const selection = value as Partial<OfficialBenchmarkComparison["selection"]>;
  return (
    typeof selection.field === "string" &&
    benchmarkFields.includes(selection.field as OfficialBenchmarkField) &&
    typeof selection.label === "string" &&
    selection.label.trim() !== "" &&
    isFiniteNumber(selection.monthlyRent) &&
    selection.monthlyRent > 0
  );
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isEvidenceMode(value: unknown): value is EvidenceMode {
  return (
    value === "official-only" ||
    value === "official-with-pmi-live" ||
    value === "official-with-pmi-warning"
  );
}

function isLiveEvidence(value: unknown): value is LiveRentalEvidenceResult {
  if (!value || typeof value !== "object") return false;

  const evidence = value as Partial<LiveRentalEvidenceResult>;
  return (
    evidence.evidenceKind === "licensed-live" &&
    evidence.provider === "property-market-intel" &&
    typeof evidence.searchedAt === "string" &&
    typeof evidence.searchAreaDescription === "string" &&
    isFiniteNumber(evidence.totalCount) &&
    isFiniteNumber(evidence.displayedCount) &&
    Array.isArray(evidence.listings) &&
    evidence.listings.every((listing) => {
      if (!listing || typeof listing !== "object") return false;
      const row = listing as LiveRentalEvidenceResult["listings"][number];
      return (
        typeof row.id === "string" &&
        row.sourceName === "Property Market Intel" &&
        row.sourceType === "licensed-dataset" &&
        typeof row.observedAt === "string" &&
        isFiniteNumber(row.rentAmount) &&
        row.rentAmount > 0 &&
        row.rentPeriod === "month" &&
        isFiniteNumber(row.rentMonthly) &&
        row.rentMonthly > 0
      );
    }) &&
    Array.isArray(evidence.warnings) &&
    evidence.warnings.every((warning) => typeof warning === "string")
  );
}

function getLocalStorage(): Storage | null {
  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}
