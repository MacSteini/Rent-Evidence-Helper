import { describe, expect, it } from "vitest";
import { lowerQuartile, median, upperQuartile } from "../lib/statistics";

describe("statistics", () => {
  it("calculates median and quartiles deterministically", () => {
    const values = [2200, 1850, 2050, 1950, 2125];
    expect(median(values)).toBe(2050);
    expect(lowerQuartile(values)).toBe(1950);
    expect(upperQuartile(values)).toBe(2125);
  });

  it("returns undefined for empty data", () => {
    expect(median([])).toBeUndefined();
  });
});
