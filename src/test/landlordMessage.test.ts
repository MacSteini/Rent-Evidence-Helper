import { describe, expect, it } from "vitest";
import { buildLandlordMessage } from "../lib/landlordMessage";
import type { OfficialBenchmarkComparison } from "../types/officialRentBenchmark";
import type { RentSearchInput } from "../types/rent";

const input: RentSearchInput = {
  postcode: "SW12 8AA",
  postcodeSector: "SW12 8",
  localAuthorityCode: "E09000022",
  rentAmount: 2450,
  rentPeriod: "month",
  propertyType: "flat",
  bedrooms: 2,
  tenancyContext: "informal-proposed-increase"
};

const comparison: OfficialBenchmarkComparison = {
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
  percentageDifference: 19.512,
  status: "above_benchmark"
};

describe("buildLandlordMessage", () => {
  it("uses the entered postcode and official benchmark wording", () => {
    const message = buildLandlordMessage(input, comparison);

    expect(message).toContain("Dear Landlord/Landlady/Agent");
    expect(message).toContain("ONS monthly private rent estimate for Lambeth");
    expect(message).toContain("postcode SW12 8AA");
    expect(message).toContain("official area benchmark is £2,050 per month");
    expect(message).toContain("+£400 (+19.5%)");
    expect(message).not.toContain("postcode sector SW12 8");
  });

  it("does not describe app evidence as individual listings or comparable data points", () => {
    const message = buildLandlordMessage(
      { ...input, postcodeSector: undefined },
      comparison
    );

    expect(message).toContain("area-level evidence");
    expect(message).toContain("not individual rental listings");
    expect(message).not.toContain("comparable data points");
    expect(message).not.toContain("estimated range");
  });
});
