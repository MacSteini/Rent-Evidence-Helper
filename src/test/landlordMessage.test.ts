import { describe, expect, it } from "vitest";
import { buildLandlordMessage } from "../lib/landlordMessage";
import type { RentEstimate, RentSearchInput } from "../types/rent";

const input: RentSearchInput = {
  postcode: "SW12 8AA",
  postcodeSector: "SW12 8",
  rentAmount: 2450,
  rentPeriod: "month",
  propertyType: "flat",
  bedrooms: 2,
  tenancyContext: "informal-proposed-increase"
};

const estimate: RentEstimate = {
  userRentMonthly: 2450,
  userRentAnnual: 29_400,
  estimatedMedianMonthly: 2050,
  estimatedLowerQuartileMonthly: 1950,
  estimatedUpperQuartileMonthly: 2125,
  estimatedRangeLabel: "£1,950 to £2,125 per month",
  comparableCount: 5,
  status: "likely_above_market",
  confidence: "high",
  confidenceScore: 0.72,
  warnings: [],
  methodologyNotes: []
};

describe("buildLandlordMessage", () => {
  it("labels postcode sector instead of making it look like a truncated postcode", () => {
    const message = buildLandlordMessage(input, estimate);

    expect(message).toContain("postcode sector SW12 8");
    expect(message).not.toContain("properties in SW12 8,");
  });

  it("uses a local-area fallback when no postcode sector is available", () => {
    const message = buildLandlordMessage(
      { ...input, postcodeSector: undefined },
      estimate
    );

    expect(message).toContain("similar properties in my local area");
  });
});
