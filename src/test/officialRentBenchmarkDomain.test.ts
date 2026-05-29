import { describe, expect, it } from "vitest";
import benchmarkDataset from "../data/official-rent-benchmarks.json";
import {
  compareRentWithOfficialBenchmark,
  findOfficialBenchmarkByAreaCode,
  listOfficialBenchmarkAreas,
  selectOfficialBenchmarkField,
  validateOfficialRentBenchmarkDataset
} from "../lib/officialRentBenchmarks";
import type {
  OfficialRentBenchmark,
  OfficialRentBenchmarkDataset
} from "../types/officialRentBenchmark";
import type { RentSearchInput } from "../types/rent";

const dataset = benchmarkDataset as OfficialRentBenchmarkDataset;
const lambeth = findRequiredBenchmark("E09000022");

function input(overrides: Partial<RentSearchInput> = {}): RentSearchInput {
  return {
    postcode: "SW12 8AA",
    localAuthorityCode: "E09000022",
    rentAmount: 2345,
    rentPeriod: "month",
    propertyType: "house",
    bedrooms: 2,
    bathrooms: 1,
    furnished: "unknown",
    billsIncluded: "unknown",
    condition: "unknown",
    tenancyContext: "current-rent-only",
    ...overrides
  };
}

function findRequiredBenchmark(areaCode: string): OfficialRentBenchmark {
  const benchmark = findOfficialBenchmarkByAreaCode(dataset, areaCode);
  if (!benchmark) throw new Error(`Missing benchmark ${areaCode}`);
  return benchmark;
}

describe("official rent benchmark domain", () => {
  it("accepts the generated ONS benchmark dataset", () => {
    expect(() => validateOfficialRentBenchmarkDataset(dataset)).not.toThrow();
  });

  it("rejects invalid dataset envelopes", () => {
    expect(() =>
      validateOfficialRentBenchmarkDataset({ ...dataset, schemaVersion: 2 })
    ).toThrow("unsupported schema version");

    expect(() =>
      validateOfficialRentBenchmarkDataset({ ...dataset, evidenceKind: "fixture" })
    ).toThrow("invalid evidence kind");

    expect(() =>
      validateOfficialRentBenchmarkDataset({ ...dataset, benchmarks: [] })
    ).toThrow("must contain benchmarks");
  });

  it("rejects non-positive benchmark rent values", () => {
    const invalidDataset: OfficialRentBenchmarkDataset = {
      ...dataset,
      benchmarks: [{ ...dataset.benchmarks[0], monthlyRentAll: 0 }]
    };

    expect(() => validateOfficialRentBenchmarkDataset(invalidDataset)).toThrow(
      "monthlyRentAll must be a positive number"
    );
  });

  it("lists benchmark areas sorted by area name", () => {
    const areas = listOfficialBenchmarkAreas(dataset);
    const names = areas.map((area) => area.areaName);

    expect(names).toEqual([...names].sort((left, right) => left.localeCompare(right)));
    expect(names).toContain("Lambeth");
    expect(names).toContain("Manchester");
    expect(names).toContain("Bristol, City of");
    expect(names).toContain("Oxford");
  });

  it("finds benchmarks exactly by Local Authority area code", () => {
    expect(findOfficialBenchmarkByAreaCode(dataset, "E09000022")?.areaName).toBe(
      "Lambeth"
    );
    expect(findOfficialBenchmarkByAreaCode(dataset, "E99999999")).toBeUndefined();
  });

  it("selects bedroom-specific benchmark fields first", () => {
    expect(selectOfficialBenchmarkField(input({ bedrooms: 1 }), lambeth)).toMatchObject({
      field: "monthlyRentOneBed",
      monthlyRent: 1883
    });
    expect(selectOfficialBenchmarkField(input({ bedrooms: 2 }), lambeth)).toMatchObject({
      field: "monthlyRentTwoBed",
      monthlyRent: 2345
    });
    expect(selectOfficialBenchmarkField(input({ bedrooms: 3 }), lambeth)).toMatchObject({
      field: "monthlyRentThreeBed",
      monthlyRent: 2684
    });
    expect(selectOfficialBenchmarkField(input({ bedrooms: 4 }), lambeth)).toMatchObject({
      field: "monthlyRentFourOrMoreBed",
      monthlyRent: 3732
    });
    expect(selectOfficialBenchmarkField(input({ bedrooms: 7 }), lambeth)).toMatchObject({
      field: "monthlyRentFourOrMoreBed",
      monthlyRent: 3732
    });
  });

  it("uses flat or maisonette benchmark only without a plausible bedroom count", () => {
    expect(
      selectOfficialBenchmarkField(
        input({ bedrooms: 0, propertyType: "flat" }),
        lambeth
      )
    ).toMatchObject({
      field: "monthlyRentFlatMaisonette",
      monthlyRent: 2189
    });

    expect(
      selectOfficialBenchmarkField(
        input({ bedrooms: 0, propertyType: "maisonette" }),
        lambeth
      )
    ).toMatchObject({
      field: "monthlyRentFlatMaisonette",
      monthlyRent: 2189
    });

    expect(
      selectOfficialBenchmarkField(
        input({ bedrooms: 0, propertyType: "unknown" }),
        lambeth
      )
    ).toMatchObject({
      field: "monthlyRentAll",
      monthlyRent: 2529
    });
  });

  it("normalises weekly, monthly and yearly rents before comparison", () => {
    expect(
      compareRentWithOfficialBenchmark(
        input({ rentAmount: 540, rentPeriod: "week", bedrooms: 2 }),
        lambeth
      ).userRentMonthly
    ).toBe(2340);

    expect(
      compareRentWithOfficialBenchmark(
        input({ rentAmount: 2345, rentPeriod: "month", bedrooms: 2 }),
        lambeth
      ).userRentMonthly
    ).toBe(2345);

    expect(
      compareRentWithOfficialBenchmark(
        input({ rentAmount: 28140, rentPeriod: "year", bedrooms: 2 }),
        lambeth
      ).userRentMonthly
    ).toBe(2345);
  });

  it("classifies benchmark percentage differences at the agreed thresholds", () => {
    expect(
      compareRentWithOfficialBenchmark(
        input({ rentAmount: 89.99, bedrooms: 0, propertyType: "unknown" }),
        { ...lambeth, monthlyRentAll: 100 }
      ).status
    ).toBe("below_benchmark");

    expect(
      compareRentWithOfficialBenchmark(
        input({ rentAmount: 90, bedrooms: 0, propertyType: "unknown" }),
        { ...lambeth, monthlyRentAll: 100 }
      ).status
    ).toBe("near_benchmark");

    expect(
      compareRentWithOfficialBenchmark(
        input({ rentAmount: 110, bedrooms: 0, propertyType: "unknown" }),
        { ...lambeth, monthlyRentAll: 100 }
      ).status
    ).toBe("near_benchmark");

    expect(
      compareRentWithOfficialBenchmark(
        input({ rentAmount: 110.01, bedrooms: 0, propertyType: "unknown" }),
        { ...lambeth, monthlyRentAll: 100 }
      ).status
    ).toBe("above_benchmark");

    expect(
      compareRentWithOfficialBenchmark(
        input({ rentAmount: 120, bedrooms: 0, propertyType: "unknown" }),
        { ...lambeth, monthlyRentAll: 100 }
      ).status
    ).toBe("above_benchmark");

    expect(
      compareRentWithOfficialBenchmark(
        input({ rentAmount: 120.01, bedrooms: 0, propertyType: "unknown" }),
        { ...lambeth, monthlyRentAll: 100 }
      ).status
    ).toBe("substantially_above_benchmark");
  });

  it("returns benchmark comparisons without ComparableRent shape", () => {
    const comparison = compareRentWithOfficialBenchmark(input(), lambeth);
    const comparableLikeFields = comparison as Record<string, unknown>;

    expect(comparableLikeFields.rentMonthly).toBeUndefined();
    expect(comparableLikeFields.sourceType).toBeUndefined();
    expect(comparableLikeFields.matchType).toBeUndefined();
    expect(JSON.stringify(comparison)).not.toContain("searchComparables");
  });
});
