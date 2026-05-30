import { describe, expect, it } from "vitest";
import { buildEvidenceSummary } from "../lib/evidenceSummary";
import type { RentCheckResult } from "../types/rentCheckResult";

describe("evidence summary", () => {
  it("summarises ONS-only results without inventing live context", () => {
    const summary = buildEvidenceSummary(buildResult());

    expect(summary.onsStatus).toBe("Well above official area benchmark");
    expect(summary.pmiStatus).toBe("ONS benchmark only");
    expect(summary.recommendedAction).toMatch(/ONS benchmark as the main result/i);
  });

  it("summarises PMI live evidence as context only", () => {
    const summary = buildEvidenceSummary(
      buildResult({
        liveEvidence: {
          evidenceKind: "licensed-live",
          provider: "property-market-intel",
          searchedAt: "2026-05-30T00:00:00Z",
          searchAreaDescription: "SW12 outcode",
          totalCount: 2,
          displayedCount: 2,
          medianMonthly: 2500,
          minimumMonthly: 2400,
          maximumMonthly: 2600,
          listings: [
            liveListing("one", 2400, "2026-05-01"),
            liveListing("two", 2600, "2026-05-02")
          ],
          warnings: []
        },
        evidenceMode: "official-with-pmi-live"
      })
    );

    expect(summary.onsStatus).toBe("Well above official area benchmark");
    expect(summary.pmiStatus).toBe("Limited PMI context; median sits near your rent.");
    expect(summary.recommendedAction).toMatch(/compare PMI listings/i);
  });

  it("summarises PMI failure without showing live evidence as successful", () => {
    const summary = buildEvidenceSummary(
      buildResult({
        evidenceMode: "official-with-pmi-warning",
        warnings: ["Property Market Intel rejected the API key."]
      })
    );

    expect(summary.pmiStatus).toMatch(/PMI unavailable/i);
  });
});

function buildResult(overrides: Partial<RentCheckResult> = {}): RentCheckResult {
  return {
    input: {
      postcode: "SW12 8AA",
      localAuthorityCode: "E09000022",
      rentAmount: 2450,
      rentPeriod: "month",
      propertyType: "flat",
      bedrooms: 2,
      tenancyContext: "current-rent-only"
    },
    officialBenchmarkComparison: {
      benchmark: {
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
      },
      selection: {
        field: "monthlyRentTwoBed",
        label: "two bedrooms",
        monthlyRent: 2050
      },
      userRentMonthly: 2450,
      differenceMonthly: 400,
      percentageDifference: 19.5,
      status: "substantially_above_benchmark"
    },
    warnings: [],
    evidenceMode: "official-only",
    ...overrides
  };
}

function liveListing(id: string, rentMonthly: number, listedDate: string) {
  return {
    id,
    sourceName: "Property Market Intel" as const,
    sourceType: "licensed-dataset" as const,
    observedAt: "2026-05-30T00:00:00Z",
    postcodeSector: "SW12 8",
    rentAmount: rentMonthly,
    rentPeriod: "month" as const,
    rentMonthly,
    bedrooms: 2,
    propertyType: "flat" as const,
    listedDate
  };
}
