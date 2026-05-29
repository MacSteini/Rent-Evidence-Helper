import { describe, expect, it, vi } from "vitest";
import { calculateConfidenceScore, confidenceBand } from "../lib/confidence";
import type { ComparableRentSearchResult } from "../types/rent";

function result(observedAt = "2026-03-01"): ComparableRentSearchResult {
  return {
    comparables: Array.from({ length: 8 }, (_, index) => ({
      id: `c-${index}`,
      sourceName: "Fixture",
      sourceType: "fixture",
      observedAt,
      rentAmount: 1000,
      rentPeriod: "month",
      rentMonthly: 1000,
      matchScore: 1
    })),
    providerName: "Fixture",
    searchedAt: "2026-05-29T00:00:00Z",
    searchAreaDescription: "Fixture area",
    warnings: [],
    errors: []
  };
}

describe("confidence", () => {
  it("bands scores", () => {
    expect(confidenceBand(0.8)).toBe("high");
    expect(confidenceBand(0.5)).toBe("medium");
    expect(confidenceBand(0.2)).toBe("low");
  });

  it("penalises stale data", () => {
    vi.setSystemTime(new Date("2026-05-29T00:00:00Z"));
    expect(calculateConfidenceScore(result("2021-01-01"))).toBeLessThan(
      calculateConfidenceScore(result("2026-03-01"))
    );
    vi.useRealTimers();
  });
});
