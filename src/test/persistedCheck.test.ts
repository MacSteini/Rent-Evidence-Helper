import { describe, expect, it } from "vitest";
import { readStoredCheck, writeStoredCheck } from "../lib/persistedCheck";
import type { AssessmentResult } from "../lib/assessment";
import type { RentSearchInput } from "../types/rent";

const input: RentSearchInput = {
  postcode: "SW12 8AA",
  rentAmount: 2450,
  rentPeriod: "month",
  propertyType: "flat",
  bedrooms: 2,
  tenancyContext: "informal-proposed-increase"
};

const result: AssessmentResult = {
  input,
  searchResult: {
    comparables: [],
    providerName: "Local comparable evidence",
    searchedAt: "2026-05-29T00:00:00Z",
    searchAreaDescription: "SW12 8 and nearby sectors",
    warnings: [],
    errors: []
  },
  estimate: {
    userRentMonthly: 2450,
    userRentAnnual: 29400,
    estimatedRangeLabel: "Unavailable",
    comparableCount: 0,
    status: "insufficient_evidence",
    confidence: "low",
    confidenceScore: 0,
    warnings: [],
    methodologyNotes: []
  }
};

describe("persisted check", () => {
  it("round-trips a completed check", () => {
    writeStoredCheck(input, result);

    expect(readStoredCheck()?.result.estimate.userRentMonthly).toBe(2450);
  });

  it("clears malformed stored checks instead of restoring them", () => {
    window.localStorage.setItem(
      "market-rent-check-last-check",
      JSON.stringify({
        version: 1,
        input,
        result: {
          input,
          searchResult: {},
          estimate: { userRentMonthly: 2450 }
        },
        savedAt: "2026-05-29T00:00:00Z"
      })
    );

    expect(readStoredCheck()).toBeNull();
    expect(window.localStorage.getItem("market-rent-check-last-check")).toBeNull();
  });
});
