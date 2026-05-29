import { describe, expect, it } from "vitest";
import benchmarkDataset from "../data/official-rent-benchmarks.json";
import type { OfficialRentBenchmarkDataset } from "../types/officialRentBenchmark";

const dataset = benchmarkDataset as OfficialRentBenchmarkDataset;
const sampleAreas = ["Lambeth", "Manchester", "Bristol, City of", "Oxford"];
const englandLocalAuthorityPrefixes = ["E06", "E07", "E08", "E09"];

describe("official rent benchmarks", () => {
  it("uses the official area benchmark contract", () => {
    expect(dataset.schemaVersion).toBe(1);
    expect(dataset.evidenceKind).toBe("official-area-benchmark");
    expect(dataset.sourceName).toBe("ONS Price Index of Private Rents");
    expect(dataset.sourceUrl).toContain("ons.gov.uk");
    expect(dataset.sourceSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(dataset.benchmarks.length).toBeGreaterThan(250);
  });

  it("contains the required sample areas for the latest period", () => {
    const rowsByArea = new Map(
      dataset.benchmarks.map((benchmark) => [benchmark.areaName, benchmark])
    );

    for (const area of sampleAreas) {
      const benchmark = rowsByArea.get(area);
      expect(benchmark, `${area} benchmark missing`).toBeDefined();
      expect(benchmark?.period).toBe(dataset.period);
    }
  });

  it("contains only England Local Authority area codes", () => {
    for (const benchmark of dataset.benchmarks) {
      expect(
        englandLocalAuthorityPrefixes.some((prefix) =>
          benchmark.areaCode.startsWith(prefix)
        ),
        `${benchmark.areaName} has unexpected area code ${benchmark.areaCode}`
      ).toBe(true);
    }
  });

  it("stores positive numeric monthly benchmark values", () => {
    for (const benchmark of dataset.benchmarks) {
      expect(benchmark.monthlyRentAll).toBeGreaterThan(0);
      expect(benchmark.monthlyRentOneBed).toBeGreaterThan(0);
      expect(benchmark.monthlyRentTwoBed).toBeGreaterThan(0);
      expect(benchmark.monthlyRentThreeBed).toBeGreaterThan(0);
      expect(benchmark.monthlyRentFourOrMoreBed).toBeGreaterThan(0);
      expect(benchmark.monthlyRentFlatMaisonette).toBeGreaterThan(0);
    }
  });

  it("does not shape official benchmarks as ComparableRent data", () => {
    const serialisedDataset = JSON.stringify(dataset);
    expect(serialisedDataset).not.toContain("ComparableRent");
    expect(serialisedDataset).not.toContain("searchComparables");

    for (const benchmark of dataset.benchmarks) {
      const comparableLikeFields = benchmark as Record<string, unknown>;
      expect(comparableLikeFields.rentMonthly).toBeUndefined();
      expect(comparableLikeFields.sourceType).toBeUndefined();
      expect(comparableLikeFields.matchType).toBeUndefined();
    }
  });
});
