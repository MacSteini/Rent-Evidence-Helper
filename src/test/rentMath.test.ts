import { describe, expect, it } from "vitest";
import {
  formatCurrency,
  normaliseRentToMonthly,
  percentageDifference
} from "../lib/rentMath";

describe("rentMath", () => {
  it("normalises weekly rent to monthly rent", () => {
    expect(normaliseRentToMonthly(300, "week")).toBeCloseTo(1300);
  });

  it("normalises annual rent to monthly rent", () => {
    expect(normaliseRentToMonthly(24_000, "year")).toBe(2000);
  });

  it("rejects zero or negative rent", () => {
    expect(() => normaliseRentToMonthly(0, "month")).toThrow(
      "Rent amount must be greater than zero."
    );
  });

  it("calculates percentage difference from a baseline", () => {
    expect(percentageDifference(1210, 1100)).toBe(10);
  });

  it("keeps pence in currency formatting without adding .00 to whole pounds", () => {
    expect(formatCurrency(24.5)).toBe("£24.50");
    expect(formatCurrency(2430.4)).toBe("£2,430.40");
    expect(formatCurrency(2450)).toBe("£2,450");
  });
});
