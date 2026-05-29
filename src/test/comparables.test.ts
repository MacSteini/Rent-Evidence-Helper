import { describe, expect, it } from "vitest";
import { assessRent } from "../lib/assessment";
import { buildRentEstimate } from "../lib/comparables";
import { MockComparableRentProvider } from "../providers/MockComparableRentProvider";
import type { ComparableRentSearchResult, RentSearchInput } from "../types/rent";

const input: RentSearchInput = {
  postcode: "SW12 8AA",
  postcodeSector: "SW12 8",
  rentAmount: 2450,
  rentPeriod: "month",
  propertyType: "flat",
  bedrooms: 2,
  tenancyContext: "informal-proposed-increase"
};

describe("comparables", () => {
  it("builds a high-rent estimate from fixture comparables", async () => {
    const result = await assessRent(input, new MockComparableRentProvider());
    expect(result.estimate.comparableCount).toBeGreaterThanOrEqual(5);
    expect(result.estimate.status).toBe("likely_above_market");
    expect(result.searchResult.warnings[0]).toContain("Fixture mode");
  });

  it("handles provider warnings without crashing", () => {
    const searchResult: ComparableRentSearchResult = {
      comparables: [],
      providerName: "Failing fixture",
      searchedAt: "2026-05-29T00:00:00Z",
      searchAreaDescription: "No data",
      warnings: ["Provider returned no data."],
      errors: []
    };
    const estimate = buildRentEstimate(input, searchResult);
    expect(estimate.status).toBe("insufficient_evidence");
    expect(estimate.warnings).toContain("Provider returned no data.");
  });
});
