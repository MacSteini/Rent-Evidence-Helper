import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ResultSummary } from "../components/ResultSummary";
import type {
  OfficialBenchmarkCheckResult,
  OfficialBenchmarkStatus
} from "../types/officialRentBenchmark";

const expectedHeadlines: Record<OfficialBenchmarkStatus, RegExp> = {
  below_benchmark: /your rent is below the official area benchmark/i,
  near_benchmark: /your rent is near the official area benchmark/i,
  above_benchmark: /your rent is above the official area benchmark/i,
  substantially_above_benchmark:
    /your rent is well above the official area benchmark/i
};

describe("ResultSummary", () => {
  it.each(Object.entries(expectedHeadlines) as Array<[OfficialBenchmarkStatus, RegExp]>)(
    "renders benchmark headline for %s",
    (status, headline) => {
      render(<ResultSummary result={buildResult(status)} />);

      expect(screen.getByRole("heading", { name: headline })).toBeInTheDocument();
      expect(screen.getByText("ONS benchmark")).toBeInTheDocument();
      expect(screen.getByText("Official benchmark")).toBeInTheDocument();
      expect(screen.queryByText(/median comparable/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/evidence confidence/i)).not.toBeInTheDocument();
    }
  );
});

function buildResult(status: OfficialBenchmarkStatus): OfficialBenchmarkCheckResult {
  return {
    input: {
      postcode: "SW12 8AA",
      localAuthorityCode: "E09000022",
      rentAmount: 2450,
      rentPeriod: "month",
      propertyType: "flat",
      bedrooms: 2,
      tenancyContext: "current-rent-only"
    },
    officialBenchmarkComparison: {
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
      percentageDifference: 19.5,
      status
    }
  };
}
