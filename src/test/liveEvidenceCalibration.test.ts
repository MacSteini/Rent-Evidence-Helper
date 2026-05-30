import { describe, expect, it } from "vitest";
import { calibrateLiveRentalEvidence } from "../lib/liveEvidenceCalibration";
import type {
  LiveRentalEvidenceResult,
  LiveRentalListing
} from "../types/liveEvidence";

describe("live evidence calibration", () => {
  it("marks broad, tight, dated evidence as strong", () => {
    const evidence = evidenceWithRents(
      [1900, 1980, 2000, 2020, 2060, 2100, 2150, 2180],
      {
        listedDates: [
          "28/05/2026",
          "2026-05-27T10:00:00Z",
          "2026-05-26",
          "2026-05-25",
          "2026-05-24",
          "2026-05-23",
          "2026-05-22",
          "2026-05-21"
        ]
      }
    );

    const calibration = calibrateLiveRentalEvidence(evidence, 2450);

    expect(calibration.qualityLevel).toBe("strong");
    expect(calibration.sampleSizeLabel).toBe("Broad sample");
    expect(calibration.freshnessLabel).toBe("Recent");
    expect(calibration.rentPosition).toBe("above");
    expect(calibration.medianDifferenceMonthly).toBe(410);
    expect(calibration.medianDifferencePercent).toBeCloseTo(20.1, 1);
    expect(calibration.spreadPercent).toBeCloseTo(13.7, 1);
    expect(calibration.reasons).toEqual(
      expect.arrayContaining([
        "Broad sample: at least 8 live listings were usable.",
        "Tighter range: asking rents vary by no more than 35% around the median.",
        "Recent listings: dated listings are within the recent search window."
      ])
    );
  });

  it("marks 4 to 7 usable listings with a median as useful", () => {
    const calibration = calibrateLiveRentalEvidence(
      evidenceWithRents([2300, 2400, 2500, 2600], {
        listedDates: ["2026-05-01", "2026-05-02", "2026-05-03", "2026-05-04"]
      }),
      2400
    );

    expect(calibration.qualityLevel).toBe("useful");
    expect(calibration.sampleSizeLabel).toBe("Usable sample");
    expect(calibration.rentPosition).toBe("near");
    expect(calibration.medianDifferenceMonthly).toBe(-50);
    expect(calibration.medianDifferencePercent).toBeCloseTo(-2, 1);
  });

  it("marks small samples, broad spreads or unknown freshness as limited", () => {
    expect(
      calibrateLiveRentalEvidence(
        evidenceWithRents([2300, 2400, 2500], {
          listedDates: ["2026-05-01", "2026-05-02", "2026-05-03"]
        }),
        2450
      ).qualityLevel
    ).toBe("limited");

    expect(
      calibrateLiveRentalEvidence(
        evidenceWithRents([1000, 2500, 5000, 6000], {
          listedDates: ["2026-05-01", "2026-05-02", "2026-05-03", "2026-05-04"]
        }),
        2450
      ).qualityLevel
    ).toBe("limited");

    const unknownFreshness = calibrateLiveRentalEvidence(
      evidenceWithRents([2300, 2400, 2500, 2600], {
        listedDates: [undefined, undefined, "2026-05-03", undefined]
      }),
      2450
    );

    expect(unknownFreshness.qualityLevel).toBe("limited");
    expect(unknownFreshness.freshnessLabel).toBe("Unknown freshness");
    expect(unknownFreshness.reasons).toContain(
      "Unknown listing dates: most usable listings do not include a date."
    );
  });

  it("handles missing medians without inventing a live position", () => {
    const evidence = {
      ...evidenceWithRents([2300, 2400, 2500, 2600]),
      medianMonthly: undefined
    };

    const calibration = calibrateLiveRentalEvidence(evidence, 2450);

    expect(calibration.qualityLevel).toBe("limited");
    expect(calibration.rentPosition).toBe("unavailable");
    expect(calibration.medianDifferenceMonthly).toBeUndefined();
    expect(calibration.medianDifferencePercent).toBeUndefined();
    expect(calibration.reasons).toContain(
      "No median asking rent could be calculated."
    );
  });
});

function evidenceWithRents(
  rents: number[],
  options: { listedDates?: Array<string | undefined> } = {}
): LiveRentalEvidenceResult {
  const sorted = [...rents].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const medianMonthly =
    sorted.length % 2 === 0
      ? (sorted[middle - 1] + sorted[middle]) / 2
      : sorted[middle];
  const listings = rents.map((rent, index): LiveRentalListing => ({
    id: `listing-${index}`,
    sourceName: "Property Market Intel",
    sourceType: "licensed-dataset",
    observedAt: "2026-05-30T00:00:00Z",
    postcodeSector: "SW12 8",
    rentAmount: rent,
    rentPeriod: "month",
    rentMonthly: rent,
    bedrooms: 2,
    propertyType: "flat",
    listedDate: options.listedDates?.[index]
  }));

  return {
    evidenceKind: "licensed-live",
    provider: "property-market-intel",
    searchedAt: "2026-05-30T00:00:00Z",
    searchAreaDescription: "SW12 outcode",
    totalCount: rents.length,
    displayedCount: rents.length,
    medianMonthly,
    minimumMonthly: sorted[0],
    maximumMonthly: sorted[sorted.length - 1],
    listings,
    warnings: [
      "Property Market Intel listing prices are treated as live asking rents, not achieved rents."
    ]
  };
}
