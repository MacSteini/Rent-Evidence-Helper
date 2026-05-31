import { describe, expect, it } from "vitest";
import {
  assessDisputeTemplateSuitability,
  buildDisputeMessageTemplate,
  getAdvisedDisputeSupportSelection,
  getAvailableDisputeTemplateIds,
  getDefaultDisputeSupportSelection,
  getDisputeEvidenceOptionAdvisories
} from "../lib/disputeSupport";
import type { RentCheckResult } from "../types/rentCheckResult";

describe("dispute support templates", () => {
  it("renders calm evidence-request wording with full postcode and ONS benchmark", () => {
    const result = buildResult();
    const message = buildDisputeMessageTemplate(
      result,
      "ask-for-evidence",
      getDefaultDisputeSupportSelection(result)
    );

    expect(message).toContain("Dear Landlord/Landlady/Agent");
    expect(message).toMatch(/postcode.*SW12 8AA/i);
    expect(message).toContain("ONS monthly private rent estimate for Lambeth");
    expect(message).toContain(
      "Local Authority benchmark, not a figure for the individual postcode"
    );
    expect(message).toContain("area benchmark is £2,050 per month");
    expect(message).toContain("+£400 (+19.5%)");
    expect(message).toContain("written evidence and calculation");
    expect(message).toContain("similar nearby properties or agreed lettings");
    expect(message).toContain("not legal advice");
    expect(message).toContain("not a tribunal decision");
    expect(message).toContain("does not pause, extend or satisfy any tribunal deadline");
    expect(message).not.toMatch(/fair rent|proved|guaranteed/i);
  });

  it("adds PMI context only when PMI evidence exists and is selected", () => {
    const result = buildResult({
      liveEvidence: {
        evidenceKind: "licensed-live",
        provider: "property-market-intel",
        searchedAt: "2026-05-30T00:00:00Z",
        searchAreaDescription: "SW12 outcode",
        totalCount: 4,
        displayedCount: 4,
        medianMonthly: 2100,
        minimumMonthly: 2000,
        maximumMonthly: 2200,
        listings: [
          buildListing("1", 2000),
          buildListing("2", 2050),
          buildListing("3", 2150),
          buildListing("4", 2200)
        ],
        warnings: []
      },
      deeperComparableEvidence: {
        evidenceKind: "licensed-comparables",
        recordKind: "historical-rented-records",
        provider: "property-market-intel",
        searchedAt: "2026-05-30T00:00:00Z",
        searchAreaDescription: "SW12 8 postcode sector",
        dateWindowStart: "2025-05-30",
        dateWindowEnd: "2026-05-30",
        totalCount: 4,
        displayedCount: 4,
        medianMonthly: 2150,
        minimumMonthly: 2050,
        maximumMonthly: 2250,
        comparables: [
          buildComparable("1", 2050),
          buildComparable("2", 2100),
          buildComparable("3", 2200),
          buildComparable("4", 2250)
        ],
        warnings: []
      }
    });
    const message = buildDisputeMessageTemplate(
      result,
      "negotiate-informally",
      getDefaultDisputeSupportSelection(result)
    );

    expect(message).toContain("live asking-rent listings through Property Market Intel");
    expect(message).toContain("recent Property Market Intel rented records");
    expect(message).toContain("30 May 2025 to 30 May 2026");
    expect(message).toContain("not current live listings or a binding outcome");
    expect(message).toContain("£2,100 per month");
    expect(message).toContain("£2,150 per month");

    const withoutPmi = buildDisputeMessageTemplate(result, "negotiate-informally", {
      ...getDefaultDisputeSupportSelection(result),
      includePmiLive: false,
      includePmiDeeper: false
    });

    expect(withoutPmi).not.toContain("Property Market Intel");
  });

  it("keeps formal notice details out of non-formal contexts", () => {
    const informalResult = buildResult({
      input: {
        ...buildResult().input,
        tenancyContext: "informal-proposed-increase",
        noticeReceivedAt: "2026-06-01",
        proposedIncreaseStartsAt: "2026-07-01",
        noticeSaysForm4A: true
      }
    });

    expect(getAvailableDisputeTemplateIds(informalResult)).not.toContain(
      "formal-notice-query"
    );

    const message = buildDisputeMessageTemplate(
      informalResult,
      "negotiate-informally",
      getDefaultDisputeSupportSelection(informalResult)
    );

    expect(message).not.toContain("notice received:");
    expect(message).not.toContain("proposed start date:");
  });

  it("summarises the proposed increase when current rent is provided", () => {
    const result = buildResult({
      input: {
        ...buildResult().input,
        tenancyContext: "informal-proposed-increase",
        rentAmount: 2200,
        currentRentBeforeIncrease: 1800
      }
    });

    const message = buildDisputeMessageTemplate(
      result,
      "ask-for-evidence",
      getDefaultDisputeSupportSelection(result)
    );

    expect(message).toContain(
      "My current rent is £1,800 per month. The proposed rent is £2,200 per month, an increase of £400 per month, or 22.2%."
    );
    expect(message).toContain("£4,800 more per year");
  });

  it("renders formal notice query details for Form 4A or section 13 contexts", () => {
    const formalResult = buildResult({
      input: {
        ...buildResult().input,
        tenancyContext: "formal-form-4a-section-13",
        noticeReceivedAt: "2026-06-01",
        proposedIncreaseStartsAt: "2026-07-01",
        noticeSaysForm4A: true,
        noticeSaysSection13: true
      }
    });

    expect(getAvailableDisputeTemplateIds(formalResult)).toContain(
      "formal-notice-query"
    );

    const message = buildDisputeMessageTemplate(
      formalResult,
      "formal-notice-query",
      getDefaultDisputeSupportSelection(formalResult)
    );

    expect(message).toContain("Form 4A / section 13 notice");
    expect(message).toContain("notice received: 2026-06-01");
    expect(message).toContain("proposed start date: 2026-07-01");
    expect(message).toContain("the notice refers to Form 4A");
    expect(message).toContain("the notice refers to section 13");
    expect(message).toContain("basis on which you consider the notice process applies");
  });

  it("keeps tribunal route preparation cautious about timing and legal effect", () => {
    const result = buildResult();
    const message = buildDisputeMessageTemplate(
      result,
      "tribunal-route-preparation",
      getDefaultDisputeSupportSelection(result)
    );

    expect(message).toContain("check the official GOV.UK guidance promptly");
    expect(message).toContain("what timing rules I need to consider");
    expect(message).toContain("this message does not pause, extend or satisfy any tribunal deadline");
    expect(message).not.toMatch(/guaranteed|deadline is extended|fair rent/i);
  });

  it("marks price-argument templates as not recommended when entered rent is far below the ONS benchmark", () => {
    const result = buildResult({
      officialBenchmarkComparison: {
        ...buildResult().officialBenchmarkComparison,
        selection: {
          field: "monthlyRentFourOrMoreBed",
          label: "four or more bedrooms",
          monthlyRent: 3216
        },
        userRentMonthly: 2200,
        differenceMonthly: -1016,
        percentageDifference: -31.6,
        status: "below_benchmark"
      },
      input: {
        ...buildResult().input,
        postcode: "W25BQ",
        rentAmount: 2200,
        bedrooms: 4
      },
      liveEvidence: {
        evidenceKind: "licensed-live",
        provider: "property-market-intel",
        searchedAt: "2026-05-31T00:00:00Z",
        searchAreaDescription: "W2 outcode",
        totalCount: 10,
        displayedCount: 10,
        medianMonthly: 12424.5,
        minimumMonthly: 3497,
        maximumMonthly: 32500,
        listings: [],
        warnings: []
      }
    });

    expect(
      assessDisputeTemplateSuitability(result, "negotiate-informally").status
    ).toBe("not_recommended");
    expect(getAdvisedDisputeSupportSelection(result, "negotiate-informally"))
      .toMatchObject({
        includeOnsBenchmark: false,
        includePmiLive: false
      });

    const forcedSelection = {
      ...getDefaultDisputeSupportSelection(result),
      includeOnsBenchmark: true,
      includePmiLive: true
    };
    const message = buildDisputeMessageTemplate(
      result,
      "negotiate-informally",
      forcedSelection
    );

    expect(message).not.toContain("£3,216 per month");
    expect(message).not.toContain("£12,424.50 per month");
    expect(message).toContain("postcode I entered is W25BQ");
  });

  it("keeps formal notice queries available while excluding damaging price evidence", () => {
    const formalResult = buildResult({
      input: {
        ...buildResult().input,
        tenancyContext: "formal-form-4a-section-13",
        noticeReceivedAt: "2026-06-01"
      },
      officialBenchmarkComparison: {
        ...buildResult().officialBenchmarkComparison,
        selection: {
          field: "monthlyRentTwoBed",
          label: "two bedrooms",
          monthlyRent: 3000
        },
        userRentMonthly: 2200,
        differenceMonthly: -800,
        percentageDifference: -26.7,
        status: "below_benchmark"
      }
    });

    expect(getAvailableDisputeTemplateIds(formalResult)).toContain(
      "formal-notice-query"
    );
    expect(
      assessDisputeTemplateSuitability(formalResult, "formal-notice-query")
        .status
    ).toBe("use_with_caution");
    expect(
      buildDisputeMessageTemplate(
        formalResult,
        "formal-notice-query",
        getAdvisedDisputeSupportSelection(formalResult, "formal-notice-query")
      )
    ).toContain("notice received: 2026-06-01");
  });

  it("explains why weak evidence options are not added automatically", () => {
    const result = buildResult({
      liveEvidence: {
        evidenceKind: "licensed-live",
        provider: "property-market-intel",
        searchedAt: "2026-05-31T00:00:00Z",
        searchAreaDescription: "SW12 outcode",
        totalCount: 2,
        displayedCount: 2,
        medianMonthly: 2600,
        minimumMonthly: 2400,
        maximumMonthly: 3200,
        listings: [],
        warnings: []
      }
    });

    expect(getDisputeEvidenceOptionAdvisories(result)).toContainEqual(
      expect.objectContaining({
        option: "includePmiLive",
        allowed: false,
        reason: expect.stringMatching(/limited/i)
      })
    );
  });
});

function buildListing(id: string, rentMonthly: number) {
  return {
    id,
    sourceName: "Property Market Intel" as const,
    sourceType: "licensed-dataset" as const,
    observedAt: "2026-05-30T00:00:00Z",
    rentAmount: rentMonthly,
    rentPeriod: "month" as const,
    rentMonthly,
    bedrooms: 2,
    propertyType: "flat" as const,
    listedDate: "2026-05-01"
  };
}

function buildComparable(id: string, rentMonthly: number) {
  return {
    id,
    sourceName: "Property Market Intel" as const,
    sourceType: "licensed-dataset" as const,
    observedAt: "2026-05-30T00:00:00Z",
    rentAmount: rentMonthly,
    rentPeriod: "month" as const,
    rentMonthly,
    bedrooms: 2,
    propertyType: "flat" as const,
    evidenceDate: "2026-05-01"
  };
}

function buildResult(overrides: Partial<RentCheckResult> = {}): RentCheckResult {
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
      status: "above_benchmark"
    },
    warnings: [],
    evidenceMode: "official-only",
    ...overrides
  };
}
