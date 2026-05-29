import { describe, expect, it } from "vitest";
import { classifyRent } from "../lib/classifyRent";
import type { ComparableRentSearchResult } from "../types/rent";

const baseResult: ComparableRentSearchResult = {
  comparables: Array.from({ length: 6 }, (_, index) => ({
    id: `c-${index}`,
    sourceName: "Fixture",
    sourceType: "fixture",
    observedAt: "2026-03-01",
    rentAmount: 1000 + index,
    rentPeriod: "month",
    rentMonthly: 1000 + index,
    matchType: "exact",
    matchScore: 1
  })),
  providerName: "Fixture",
  searchedAt: "2026-05-29T00:00:00Z",
  searchAreaDescription: "Fixture area",
  warnings: [],
  errors: []
};

describe("classifyRent", () => {
  it("returns insufficient evidence with fewer than five comparables", () => {
    expect(
      classifyRent(1200, 1000, 1100, {
        ...baseResult,
        comparables: baseResult.comparables.slice(0, 4)
      }, 0.8)
    ).toBe("insufficient_evidence");
  });

  it("returns within range below median", () => {
    expect(classifyRent(950, 1000, 1100, baseResult, 0.8)).toBe("within_range");
  });

  it("returns above median within upper quartile", () => {
    expect(classifyRent(1050, 1000, 1100, baseResult, 0.8)).toBe("above_median");
  });

  it("returns likely above market above ten percent", () => {
    expect(classifyRent(1120, 1000, 1100, baseResult, 0.8)).toBe(
      "likely_above_market"
    );
  });

  it("returns strongly above market above twenty percent", () => {
    expect(classifyRent(1250, 1000, 1100, baseResult, 0.8)).toBe(
      "strongly_above_market"
    );
  });

  it("returns potentially high for low-confidence high result", () => {
    expect(classifyRent(1150, 1000, 1100, baseResult, 0.4)).toBe(
      "potentially_high"
    );
  });
});
