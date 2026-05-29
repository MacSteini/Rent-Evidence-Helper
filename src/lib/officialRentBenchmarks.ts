import { normaliseRentToMonthly, percentageDifference } from "./rentMath";
import type { RentSearchInput } from "../types/rent";
import type {
  OfficialBenchmarkComparison,
  OfficialBenchmarkField,
  OfficialBenchmarkSelection,
  OfficialBenchmarkStatus,
  OfficialRentBenchmark,
  OfficialRentBenchmarkDataset
} from "../types/officialRentBenchmark";

const expectedEvidenceKind = "official-area-benchmark";
const expectedSourceName = "ONS Price Index of Private Rents";
const rentFields: OfficialBenchmarkField[] = [
  "monthlyRentAll",
  "monthlyRentOneBed",
  "monthlyRentTwoBed",
  "monthlyRentThreeBed",
  "monthlyRentFourOrMoreBed",
  "monthlyRentFlatMaisonette"
];

const fieldLabels: Record<OfficialBenchmarkField, string> = {
  monthlyRentAll: "all properties",
  monthlyRentOneBed: "one bedroom",
  monthlyRentTwoBed: "two bedrooms",
  monthlyRentThreeBed: "three bedrooms",
  monthlyRentFourOrMoreBed: "four or more bedrooms",
  monthlyRentFlatMaisonette: "flat or maisonette"
};

export function validateOfficialRentBenchmarkDataset(
  value: unknown
): asserts value is OfficialRentBenchmarkDataset {
  if (!isObject(value)) {
    throw new Error("Official rent benchmark dataset must be an object.");
  }

  if (value.schemaVersion !== 1) {
    throw new Error("Official rent benchmark dataset has an unsupported schema version.");
  }

  if (value.evidenceKind !== expectedEvidenceKind) {
    throw new Error("Official rent benchmark dataset has an invalid evidence kind.");
  }

  if (value.sourceName !== expectedSourceName) {
    throw new Error("Official rent benchmark dataset has an invalid source name.");
  }

  assertNonEmptyString(value.sourceUrl, "sourceUrl");
  assertNonEmptyString(value.releaseDate, "releaseDate");
  assertNonEmptyString(value.nextRelease, "nextRelease");
  assertNonEmptyString(value.period, "period");
  assertNonEmptyString(value.lastIngestedAt, "lastIngestedAt");
  assertNonEmptyString(value.sourceSha256, "sourceSha256");

  if (!Array.isArray(value.benchmarks) || value.benchmarks.length === 0) {
    throw new Error("Official rent benchmark dataset must contain benchmarks.");
  }

  for (const benchmark of value.benchmarks) {
    validateBenchmark(benchmark);
  }
}

export function listOfficialBenchmarkAreas(
  dataset: OfficialRentBenchmarkDataset
): Array<Pick<OfficialRentBenchmark, "areaCode" | "areaName" | "regionOrCountryName">> {
  validateOfficialRentBenchmarkDataset(dataset);

  return dataset.benchmarks
    .map(({ areaCode, areaName, regionOrCountryName }) => ({
      areaCode,
      areaName,
      regionOrCountryName
    }))
    .sort((left, right) =>
      left.areaName.localeCompare(right.areaName, "en-GB", {
        sensitivity: "base"
      })
    );
}

export function findOfficialBenchmarkByAreaCode(
  dataset: OfficialRentBenchmarkDataset,
  areaCode: string
): OfficialRentBenchmark | undefined {
  validateOfficialRentBenchmarkDataset(dataset);
  return dataset.benchmarks.find((benchmark) => benchmark.areaCode === areaCode);
}

export function selectOfficialBenchmarkField(
  input: RentSearchInput,
  benchmark: OfficialRentBenchmark
): OfficialBenchmarkSelection {
  const field = chooseBenchmarkField(input);
  return {
    field,
    label: fieldLabels[field],
    monthlyRent: benchmark[field]
  };
}

export function compareRentWithOfficialBenchmark(
  input: RentSearchInput,
  benchmark: OfficialRentBenchmark
): OfficialBenchmarkComparison {
  validateBenchmark(benchmark);
  const userRentMonthly = normaliseRentToMonthly(input.rentAmount, input.rentPeriod);
  const selection = selectOfficialBenchmarkField(input, benchmark);
  const differenceMonthly = userRentMonthly - selection.monthlyRent;
  const percent = percentageDifference(userRentMonthly, selection.monthlyRent);

  return {
    benchmark,
    selection,
    userRentMonthly,
    differenceMonthly,
    percentageDifference: percent,
    status: classifyOfficialBenchmarkDifference(percent)
  };
}

function chooseBenchmarkField(input: RentSearchInput): OfficialBenchmarkField {
  if (input.bedrooms === 1) return "monthlyRentOneBed";
  if (input.bedrooms === 2) return "monthlyRentTwoBed";
  if (input.bedrooms === 3) return "monthlyRentThreeBed";
  if (input.bedrooms >= 4) return "monthlyRentFourOrMoreBed";

  if (input.propertyType === "flat" || input.propertyType === "maisonette") {
    return "monthlyRentFlatMaisonette";
  }

  return "monthlyRentAll";
}

function classifyOfficialBenchmarkDifference(
  percent: number
): OfficialBenchmarkStatus {
  if (percent < -10) return "below_benchmark";
  if (percent <= 10) return "near_benchmark";
  if (percent <= 20) return "above_benchmark";
  return "substantially_above_benchmark";
}

function validateBenchmark(value: unknown): asserts value is OfficialRentBenchmark {
  if (!isObject(value)) {
    throw new Error("Official rent benchmark row must be an object.");
  }

  assertNonEmptyString(value.areaCode, "areaCode");
  assertNonEmptyString(value.areaName, "areaName");
  assertNonEmptyString(value.regionOrCountryName, "regionOrCountryName");
  assertNonEmptyString(value.period, "period");

  for (const field of rentFields) {
    assertPositiveNumber(value[field], field);
  }
}

function assertNonEmptyString(value: unknown, fieldName: string): void {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Official rent benchmark ${fieldName} must be a non-empty string.`);
  }
}

function assertPositiveNumber(value: unknown, fieldName: string): void {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new Error(`Official rent benchmark ${fieldName} must be a positive number.`);
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
