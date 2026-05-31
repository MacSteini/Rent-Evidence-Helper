import { describe, expect, it } from "vitest";
import {
  clearStoredCheck,
  readStoredCheck,
  writeStoredCheck
} from "../lib/persistedCheck";
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
    writeStoredCheck(
      input,
      comparison,
      { warnings: [], evidenceMode: "official-only" },
      sourceSha256
    );

    const storedCheck = readStoredCheck(sourceSha256);

    expect(storedCheck?.version).toBe(6);
    expect(storedCheck?.officialBenchmarkComparison.userRentMonthly).toBe(2450);
    expect(storedCheck?.evidenceMode).toBe("official-only");
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

  it("clears old version 1, 2, 3, 4 and 5 checks instead of restoring them", () => {
    for (const version of [1, 2, 3, 4, 5]) {
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

  it("round-trips redacted deeper comparable evidence", () => {
    writeStoredCheck(
      input,
      comparison,
      {
        warnings: [],
        evidenceMode: "official-only",
        deeperComparableEvidence: {
          evidenceKind: "licensed-comparables",
          recordKind: "historical-rented-records",
          provider: "property-market-intel",
          searchedAt: "2026-05-30T00:00:00Z",
          searchAreaDescription: "SW12 8 postcode sector",
          dateWindowStart: "2025-05-30",
          dateWindowEnd: "2026-05-30",
          totalCount: 1,
          displayedCount: 1,
          medianMonthly: 2300,
          minimumMonthly: 2300,
          maximumMonthly: 2300,
          comparables: [
            {
              id: "pmi-comparable-1",
              sourceName: "Property Market Intel",
              sourceType: "licensed-dataset",
              observedAt: "2026-05-30T00:00:00Z",
              postcodeSector: "SW12 8",
              rentAmount: 2300,
              rentPeriod: "month",
              rentMonthly: 2300,
              bedrooms: 2,
              propertyType: "flat",
              evidenceDate: "2026-04-01",
              distanceMeters: 120
            }
          ],
          warnings: ["Context only."]
        }
      },
      sourceSha256
    );

    const storedCheck = readStoredCheck(sourceSha256);

    expect(storedCheck?.deeperComparableEvidence?.displayedCount).toBe(1);
    expect(JSON.stringify(storedCheck)).not.toContain("Hidden Address");
    expect(JSON.stringify(storedCheck)).not.toContain("uprn");
  });

  it("clears version 5 checks when the ONS source hash changes", () => {
    writeStoredCheck(
      input,
      comparison,
      { warnings: [], evidenceMode: "official-only" },
      sourceSha256
    );

    expect(readStoredCheck("different-source-hash")).toBeNull();
    expect(window.localStorage.getItem("market-rent-check-last-check")).toBeNull();
  });

  it("clears only the saved check and leaves the PMI key alone", () => {
    writeStoredCheck(
      input,
      comparison,
      { warnings: [], evidenceMode: "official-only" },
      sourceSha256
    );
    window.localStorage.setItem("market-rent-check-pmi-api-key", "pmi_live_test");

    clearStoredCheck();

    expect(window.localStorage.getItem("market-rent-check-last-check")).toBeNull();
    expect(window.localStorage.getItem("market-rent-check-pmi-api-key")).toBe(
      "pmi_live_test"
    );
  });
});
