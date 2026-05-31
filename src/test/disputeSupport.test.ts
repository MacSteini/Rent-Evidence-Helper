import { describe, expect, it } from "vitest";
import {
  buildDisputeMessageTemplate,
  getAvailableDisputeTemplateIds,
  getDefaultDisputeSupportSelection
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
    expect(message).toContain("official area benchmark is £2,050 per month");
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
        totalCount: 2,
        displayedCount: 2,
        medianMonthly: 2500,
        minimumMonthly: 2400,
        maximumMonthly: 2600,
        listings: [],
        warnings: []
      },
      deeperComparableEvidence: {
        evidenceKind: "licensed-comparables",
        provider: "property-market-intel",
        searchedAt: "2026-05-30T00:00:00Z",
        searchAreaDescription: "SW12 8 postcode sector",
        totalCount: 1,
        displayedCount: 1,
        medianMonthly: 2300,
        minimumMonthly: 2300,
        maximumMonthly: 2300,
        comparables: [],
        warnings: []
      }
    });
    const message = buildDisputeMessageTemplate(
      result,
      "negotiate-informally",
      getDefaultDisputeSupportSelection(result)
    );

    expect(message).toContain("live asking-rent listings through Property Market Intel");
    expect(message).toContain("optional Property Market Intel comparable check");
    expect(message).toContain("£2,500 per month");
    expect(message).toContain("£2,300 per month");

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
});

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
