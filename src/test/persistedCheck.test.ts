import { describe, expect, it } from "vitest";
import { readStoredCheck, writeStoredCheck } from "../lib/persistedCheck";
import type {
  OfficialBenchmarkComparison,
  OfficialRentBenchmark
} from "../types/officialRentBenchmark";
import type { RentSearchInput } from "../types/rent";

const sourceSha256 = "abc123";

const input: RentSearchInput = {
  postcode: "SW12 8AA",
  localAuthorityCode: "E09000022",
  rentAmount: 2450,
  rentPeriod: "month",
  propertyType: "flat",
  bedrooms: 2,
  tenancyContext: "informal-proposed-increase"
};

const benchmark: OfficialRentBenchmark = {
  areaCode: "E09000022",
  areaName: "Lambeth",
  regionOrCountryName: "London",
  period: "2026-04",
  monthlyRentAll: 1750,
  monthlyRentOneBed: 1600,
  monthlyRentTwoBed: 2050,
  monthlyRentThreeBed: 2550,
  monthlyRentFourOrMoreBed: 3200,
  monthlyRentFlatMaisonette: 1900
};

const comparison: OfficialBenchmarkComparison = {
  benchmark,
  selection: {
    field: "monthlyRentTwoBed",
    label: "two bedrooms",
    monthlyRent: 2050
  },
  userRentMonthly: 2450,
  differenceMonthly: 400,
  percentageDifference: 19.5,
  status: "above_benchmark"
};

describe("persisted check", () => {
  it("round-trips a completed benchmark check", () => {
    writeStoredCheck(input, comparison, sourceSha256);

    const storedCheck = readStoredCheck(sourceSha256);

    expect(storedCheck?.version).toBe(3);
    expect(storedCheck?.officialBenchmarkComparison.userRentMonthly).toBe(2450);
    expect(storedCheck?.sourceSha256).toBe(sourceSha256);
  });

  it("clears malformed stored checks instead of restoring them", () => {
    window.localStorage.setItem(
      "market-rent-check-last-check",
      JSON.stringify({
        version: 3,
        input,
        officialBenchmarkComparison: {
          ...comparison,
          selection: { ...comparison.selection, monthlyRent: 0 }
        },
        sourceSha256,
        savedAt: "2026-05-29T00:00:00Z"
      })
    );

    expect(readStoredCheck(sourceSha256)).toBeNull();
    expect(window.localStorage.getItem("market-rent-check-last-check")).toBeNull();
  });

  it("clears old version 1 and version 2 checks instead of restoring them", () => {
    for (const version of [1, 2]) {
      window.localStorage.setItem(
        "market-rent-check-last-check",
        JSON.stringify({
          version,
          input,
          result: {},
          savedAt: "2026-05-29T00:00:00Z"
        })
      );

      expect(readStoredCheck(sourceSha256)).toBeNull();
      expect(window.localStorage.getItem("market-rent-check-last-check")).toBeNull();
    }
  });

  it("clears version 3 checks when the ONS source hash changes", () => {
    writeStoredCheck(input, comparison, sourceSha256);

    expect(readStoredCheck("different-source-hash")).toBeNull();
    expect(window.localStorage.getItem("market-rent-check-last-check")).toBeNull();
  });
});
