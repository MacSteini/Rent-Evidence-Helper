import { describe, expect, it } from "vitest";
import {
  formatCurrencyRange,
  formatDistance,
  formatOptionalCurrency,
  formatPropertyTypeLabel,
  formatRecentRecordQualityLabel,
  formatSearchAreaLabel,
  formatSignedCurrency,
  formatSignedPercent,
  formatSpread
} from "../lib/displayFormat";

describe("display formatters", () => {
  it("formats optional money and signed benchmark differences consistently", () => {
    expect(formatOptionalCurrency(undefined)).toBe("Unavailable");
    expect(formatOptionalCurrency(1528.4)).toBe("£1,528.40");
    expect(formatSignedCurrency(672)).toBe("+£672");
    expect(formatSignedCurrency(-120.5)).toBe("-£120.50");
    expect(formatSignedCurrency(0)).toBe("£0");
    expect(formatSignedPercent(44)).toBe("+44.0%");
    expect(formatSignedPercent(-8.25)).toBe("-8.3%");
  });

  it("formats ranges, spread and labels without panel-specific drift", () => {
    expect(formatCurrencyRange(1450, 1800)).toBe("£1,450 to £1,800");
    expect(formatCurrencyRange(undefined, 1800)).toBe("Unavailable");
    expect(formatSpread(32.25)).toBe("Range spread is 32.3% around the median");
    expect(formatSpread(undefined)).toBe("Range spread unavailable");
    expect(formatRecentRecordQualityLabel("strong")).toBe("Broader");
    expect(formatRecentRecordQualityLabel(undefined)).toBe("Unavailable");
  });

  it("formats evidence categories and distances for safe display", () => {
    expect(formatPropertyTypeLabel("semi-detached")).toBe("Semi detached");
    expect(formatPropertyTypeLabel(undefined)).toBe("Unknown");
    expect(formatSearchAreaLabel("SW12 8 postcode sector")).toBe(
      "SW12 8 Postcode sector"
    );
    expect(formatSearchAreaLabel("SW12 outcode")).toBe("SW12 Postcode district");
    expect(formatSearchAreaLabel("SW12 postcode district")).toBe(
      "SW12 Postcode district"
    );
    expect(formatPropertyTypeLabel("house")).toBe("House/Bungalow");
    expect(formatDistance(980)).toBe("980 m");
    expect(formatDistance(1420)).toBe("1.4 km");
    expect(formatDistance(undefined)).toBe("Unknown");
  });
});
