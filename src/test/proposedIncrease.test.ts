import { describe, expect, it } from "vitest";
import { calculateProposedIncrease } from "../lib/proposedIncrease";
import type { RentSearchInput } from "../types/rent";

describe("calculateProposedIncrease", () => {
  it("calculates monthly, percentage and yearly increase values", () => {
    const increase = calculateProposedIncrease({
      ...buildInput(),
      rentAmount: 2200,
      currentRentBeforeIncrease: 1800
    });

    expect(increase?.currentRentMonthly).toBe(1800);
    expect(increase?.proposedRentMonthly).toBe(2200);
    expect(increase?.increaseMonthly).toBe(400);
    expect(increase?.increasePercent).toBeCloseTo(22.2222, 4);
    expect(increase?.increaseYearly).toBe(4800);
  });

  it("normalises weekly and yearly rents to monthly values", () => {
    const weeklyIncrease = calculateProposedIncrease({
      ...buildInput(),
      rentPeriod: "week",
      rentAmount: 500,
      currentRentBeforeIncrease: 400
    });

    expect(weeklyIncrease?.currentRentMonthly).toBeCloseTo(1733.3333, 4);
    expect(weeklyIncrease?.proposedRentMonthly).toBeCloseTo(2166.6667, 4);
    expect(weeklyIncrease?.increaseMonthly).toBeCloseTo(433.3333, 4);
    expect(weeklyIncrease?.increaseYearly).toBeCloseTo(5200, 4);

    const yearlyIncrease = calculateProposedIncrease({
      ...buildInput(),
      rentPeriod: "year",
      rentAmount: 24_000,
      currentRentBeforeIncrease: 21_600
    });

    expect(yearlyIncrease?.currentRentMonthly).toBe(1800);
    expect(yearlyIncrease?.proposedRentMonthly).toBe(2000);
    expect(yearlyIncrease?.increaseMonthly).toBe(200);
    expect(yearlyIncrease?.increaseYearly).toBe(2400);
  });

  it("returns undefined outside increase contexts or without a valid current rent", () => {
    expect(
      calculateProposedIncrease({
        ...buildInput(),
        tenancyContext: "current-rent-only",
        currentRentBeforeIncrease: 1800
      })
    ).toBeUndefined();
    expect(calculateProposedIncrease(buildInput())).toBeUndefined();
    expect(
      calculateProposedIncrease({
        ...buildInput(),
        currentRentBeforeIncrease: 0
      })
    ).toBeUndefined();
    expect(
      calculateProposedIncrease({
        ...buildInput(),
        rentAmount: 1800,
        currentRentBeforeIncrease: 1800
      })
    ).toBeUndefined();
  });
});

function buildInput(): RentSearchInput {
  return {
    postcode: "SW12 8AA",
    localAuthorityCode: "E09000022",
    rentAmount: 2200,
    rentPeriod: "month",
    propertyType: "flat",
    bedrooms: 2,
    tenancyContext: "informal-proposed-increase"
  };
}
