import { describe, expect, it } from "vitest";
import {
  calibrateDeeperComparableEvidence,
  calibrateLiveRentalEvidence,
  comparePmiEvidenceLayers
} from "../lib/liveEvidenceCalibration";
import type {
  DeeperComparableEvidenceResult,
  DeeperComparableRent,
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

  it("keeps real broad-spread live samples limited even with 10 usable rows", () => {
    const bristolLikeEvidence = evidenceWithRents(
      [580, 620, 700, 730, 740, 755, 800, 900, 1200, 2300],
      {
        listedDates: [
          "2026-05-01",
          "2026-05-02",
          "2026-05-03",
          "2026-05-04",
          "2026-05-05",
          "2026-05-06",
          "2026-05-07",
          "2026-05-08",
          "2026-05-09",
          "2026-05-10"
        ]
      }
    );

    const calibration = calibrateLiveRentalEvidence(bristolLikeEvidence, 1300);

    expect(calibration.qualityLevel).toBe("limited");
    expect(calibration.spreadPercent).toBeCloseTo(230.1, 1);
    expect(calibration.reasons).toContain(
      "Wide range: asking rents vary by more than 60% around the median."
    );
  });

  it("calibrates deeper comparables with the same broad-spread caution", () => {
    const londonDeeperEvidence = deeperEvidenceWithRents([
      1200, 1600, 1800, 1900, 2000, 2000, 2200, 2400, 2600, 4000
    ]);

    const calibration = calibrateDeeperComparableEvidence(
      londonDeeperEvidence,
      2450
    );

    expect(calibration.qualityLevel).toBe("limited");
    expect(calibration.sampleSizeLabel).toBe("Broad sample");
    expect(calibration.spreadPercent).toBeCloseTo(140, 1);
    expect(calibration.medianDifferencePercent).toBeCloseTo(22.5, 1);
    expect(calibration.reasons).toContain(
      "Wide range: recent rented records vary by more than 60% around the median."
    );
  });

  it("flags material disagreement between live listings and deeper comparables", () => {
    const liveEvidence = evidenceWithRents([
      565, 1000, 1100, 1200, 1200, 1205, 1300, 1400, 1450, 1495
    ]);
    const deeperEvidence = deeperEvidenceWithRents([
      797, 820, 850, 880, 890, 900, 950, 1000, 1100, 1150
    ]);

    const comparison = comparePmiEvidenceLayers(liveEvidence, deeperEvidence);

    expect(comparison.status).toBe("materially-different");
    expect(comparison.medianDifferenceMonthly).toBe(-307.5);
    expect(comparison.medianDifferencePercent).toBeCloseTo(-25.6, 1);
    expect(comparison.message).toMatch(/context only/i);
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
    searchAreaDescription: "SW12 postcode district",
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

function deeperEvidenceWithRents(rents: number[]): DeeperComparableEvidenceResult {
  const sorted = [...rents].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const medianMonthly =
    sorted.length % 2 === 0
      ? (sorted[middle - 1] + sorted[middle]) / 2
      : sorted[middle];
  const comparables = rents.map((rent, index): DeeperComparableRent => ({
    id: `comparable-${index}`,
    sourceName: "Property Market Intel",
    sourceType: "licensed-dataset",
    observedAt: "2026-05-30T00:00:00Z",
    postcodeSector: "SW12 8",
    rentAmount: rent,
    rentPeriod: "month",
    rentMonthly: rent,
    bedrooms: 1,
    propertyType: "flat",
    evidenceDate: `2026-05-${String(index + 1).padStart(2, "0")}`
  }));

  return {
    evidenceKind: "licensed-comparables",
    recordKind: "historical-rented-records",
    provider: "property-market-intel",
    searchedAt: "2026-05-30T00:00:00Z",
    searchAreaDescription: "SW12 8 postcode sector",
    dateWindowStart: "2025-05-30",
    dateWindowEnd: "2026-05-30",
    totalCount: rents.length,
    displayedCount: rents.length,
    medianMonthly,
    minimumMonthly: sorted[0],
    maximumMonthly: sorted[sorted.length - 1],
    comparables,
    warnings: [
      "Property Market Intel recent rented records are historical rented-record context, not current live listings or a market-rent decision."
    ]
  };
}
