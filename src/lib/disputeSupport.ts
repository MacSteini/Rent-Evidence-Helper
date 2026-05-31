import { formatCurrency } from "./rentMath";
import { formatEvidenceDateRange } from "./evidenceDates";
import {
  calibrateDeeperComparableEvidence,
  calibrateLiveRentalEvidence
} from "./liveEvidenceCalibration";
import type { RentCheckResult } from "../types/rentCheckResult";
import type {
  DisputeEvidenceOptionAdvisory,
  DisputeSupportSelection,
  DisputeTemplateId,
  DisputeTemplateOption,
  DisputeTemplateSuitability
} from "../types/disputeSupport";

const supportThresholdPercent = 10;

export const disputeTemplateIds: DisputeTemplateId[] = [
  "ask-for-evidence",
  "negotiate-informally",
  "formal-notice-query",
  "tribunal-route-preparation"
];

export function getAvailableDisputeTemplateIds(
  result: RentCheckResult
): DisputeTemplateId[] {
  return disputeTemplateIds.filter((templateId) => {
    if (templateId === "formal-notice-query") {
      return result.input.tenancyContext === "formal-form-4a-section-13";
    }
    return true;
  });
}

export function getDefaultDisputeSupportSelection(
  result: RentCheckResult
): DisputeSupportSelection {
  return getAdvisedDisputeSupportSelection(result, "ask-for-evidence");
}

export function getAdvisedDisputeSupportSelection(
  result: RentCheckResult,
  templateId: DisputeTemplateId
): DisputeSupportSelection {
  const advisories = getDisputeEvidenceOptionAdvisories(result);
  const evidenceSelection = Object.fromEntries(
    advisories.map((advisory) => [advisory.option, advisory.allowed])
  ) as Pick<
    DisputeSupportSelection,
    "includeOnsBenchmark" | "includePmiLive" | "includePmiDeeper"
  >;

  return {
    ...evidenceSelection,
    requestWrittenEvidence: true,
    askForInformalResolution: templateId !== "formal-notice-query",
    includeFormalNoticeDetails: hasFormalNoticeDetails(result),
    includeCaveat: true
  };
}

export function getDisputeEvidenceOptionAdvisories(
  result: RentCheckResult
): DisputeEvidenceOptionAdvisory[] {
  return [
    getOnsAdvisory(result),
    getLivePmiAdvisory(result),
    getDeeperPmiAdvisory(result)
  ];
}

export function assessDisputeTemplateSuitability(
  result: RentCheckResult,
  templateId: DisputeTemplateId
): DisputeTemplateSuitability {
  const evidence = getEvidenceAssessment(result);
  const isProposedIncrease =
    result.input.tenancyContext === "informal-proposed-increase" ||
    result.input.tenancyContext === "formal-form-4a-section-13";
  const isFormalNotice =
    result.input.tenancyContext === "formal-form-4a-section-13";

  if (templateId === "formal-notice-query") {
    return {
      status: evidence.hasSupportingEvidence ? "recommended" : "use_with_caution",
      title: evidence.hasSupportingEvidence
        ? "Suitable for a factual notice query"
        : "Keep this focused on the notice process",
      summary:
        "This template can ask about the form, dates and notice basis without relying on weak price evidence.",
      reasons: evidence.weakeningReasons,
      recommendation:
        "Use this for process questions. Include rent evidence only when it supports the point you want to make."
    };
  }

  if (templateId === "tribunal-route-preparation") {
    if (isFormalNotice && evidence.hasSupportingEvidence) {
      return {
        status: "use_with_caution",
        title: "Use careful wording",
        summary:
          "The formal notice context and supporting evidence may justify checking official tribunal guidance, but timing rules still need care.",
        reasons: evidence.cautionReasons,
        recommendation:
          "Keep the wording cautious and check official GOV.UK guidance before taking any formal step."
      };
    }

    return {
      status: "not_recommended",
      title: "This message may weaken your position",
      summary:
        "The figures entered do not make a tribunal-route message look like the strongest next written step.",
      reasons: [
        ...evidence.weakeningReasons,
        "Tribunal wording can sound escalatory if the rent evidence does not support that approach or no formal notice context is present."
      ],
      recommendation:
        "Use a factual evidence request or correct any test figures before preparing tribunal-route wording."
    };
  }

  if (templateId === "negotiate-informally") {
    if (evidence.hasClearWeakeningEvidence) {
      return {
        status: "not_recommended",
        title: "This message may weaken your position",
        summary:
          "Based on the figures entered, the selected evidence does not support a rent challenge.",
        reasons: evidence.weakeningReasons,
        recommendation:
          "Correct any test or typo values first, or send a narrower factual question instead of a negotiation message."
      };
    }

    if (evidence.hasSupportingEvidence) {
      return {
        status: "recommended",
        title: "Suitable for a cautious informal discussion",
        summary:
          "The selected evidence can support a calm request to discuss the rent.",
        reasons: evidence.cautionReasons,
        recommendation:
          "Keep the wording factual and ask for a written basis rather than presenting the result as a decision."
      };
    }

    return {
      status: "use_with_caution",
      title: "Use a neutral tone",
      summary:
        "The evidence is neutral or incomplete, so the message should ask questions rather than argue a conclusion.",
      reasons: evidence.cautionReasons,
      recommendation:
        "Ask for the calculation and evidence, and avoid saying the rent is too high."
    };
  }

  if (!isProposedIncrease && evidence.hasClearWeakeningEvidence) {
    return {
      status: "not_recommended",
      title: "This message may weaken your position",
      summary:
        "Based on the figures entered, a rent-challenge message may not be the strongest next step.",
      reasons: evidence.weakeningReasons,
      recommendation:
        "If the rent amount was a test or typo, correct it before using a template. Otherwise, use the template only as a factual request for how the rent was calculated."
    };
  }

  if (isProposedIncrease || evidence.hasSupportingEvidence) {
    return {
      status: "recommended",
      title: "Suitable for a factual evidence request",
      summary:
        "This template asks for the calculation and evidence without presenting the app result as a binding outcome.",
      reasons: evidence.cautionReasons,
      recommendation:
        "Use it to ask for the basis of the rent and keep your own evidence separate."
    };
  }

  return {
    status: "use_with_caution",
    title: "Use this as a factual request only",
    summary:
      "The evidence does not strongly point either way, so avoid making a firm claim.",
    reasons: evidence.cautionReasons,
    recommendation:
      "Ask for written evidence and edit out any wording that sounds like a conclusion."
  };
}

export function buildDisputeMessageTemplate(
  result: RentCheckResult,
  templateId: DisputeTemplateId,
  selection: DisputeSupportSelection
): string {
  const { input } = result;
  const evidenceAdvisories = getDisputeEvidenceOptionAdvisories(result);
  const rentLabel = `${formatCurrency(input.rentAmount)} per ${input.rentPeriod}`;
  const postcode = input.postcode.trim().toUpperCase();
  const intro =
    templateId === "ask-for-evidence"
      ? `I am writing to ask for the evidence used to assess the rent of ${rentLabel}.`
      : templateId === "negotiate-informally"
        ? `I am writing to discuss the rent of ${rentLabel} and to see whether we can resolve this informally.`
        : templateId === "formal-notice-query"
          ? `I am writing about the rent increase notice I have received for ${rentLabel}.`
          : `I am writing because I am checking the official guidance on rent increases and open market rent determination.`;

  const paragraphs = [
    "Dear Landlord/Landlady/Agent,",
    intro,
    `For context, the rental property postcode I entered is ${postcode}.`
  ];

  if (
    selection.includeOnsBenchmark &&
    isEvidenceOptionAllowed(evidenceAdvisories, "includeOnsBenchmark")
  ) {
    paragraphs.push(buildOnsParagraph(result));
  }

  if (
    selection.includePmiLive &&
    isEvidenceOptionAllowed(evidenceAdvisories, "includePmiLive") &&
    result.liveEvidence?.medianMonthly
  ) {
    paragraphs.push(
      `I also checked live asking-rent listings through Property Market Intel. The median asking rent in that live-listing context is ${formatCurrency(result.liveEvidence.medianMonthly)} per month.`
    );
  }

  if (
    selection.includePmiDeeper &&
    isEvidenceOptionAllowed(evidenceAdvisories, "includePmiDeeper") &&
    result.deeperComparableEvidence?.medianMonthly
  ) {
    const recordWindow = formatEvidenceDateRange(
      result.deeperComparableEvidence.dateWindowStart,
      result.deeperComparableEvidence.dateWindowEnd
    );
    paragraphs.push(
      `I also checked recent Property Market Intel rented records for the postcode sector from ${recordWindow}. The median rent in that historical rented-record context is ${formatCurrency(result.deeperComparableEvidence.medianMonthly)} per month. This is not current live listings or a binding outcome.`
    );
  }

  if (selection.includeFormalNoticeDetails && hasFormalNoticeDetails(result)) {
    paragraphs.push(buildFormalNoticeParagraph(result));
  }

  if (selection.requestWrittenEvidence) {
    paragraphs.push(
      "Please could you provide the written evidence and calculation used to support the rent or proposed rent, including any similar nearby properties or agreed lettings you relied on?"
    );
  }

  if (templateId === "formal-notice-query") {
    paragraphs.push(
      "Please could you also confirm whether the notice is intended to be a Form 4A / section 13 notice, the date it was served, the date the proposed rent would start, and the basis on which you consider the notice process applies?"
    );
  }

  if (templateId === "tribunal-route-preparation") {
    paragraphs.push(
      "If we cannot resolve this informally, I will check the official GOV.UK guidance promptly to understand whether the First-tier Tribunal open market rent determination process may apply and what timing rules I need to consider."
    );
  }

  if (selection.askForInformalResolution) {
    paragraphs.push(
      "I would prefer to resolve this informally if possible and would welcome your response before any further step is needed."
    );
  }

  if (selection.includeCaveat) {
    paragraphs.push(
      "I understand that this evidence is for context only. It is not legal advice, not a tribunal decision, and this message does not pause, extend or satisfy any tribunal deadline."
    );
  }

  paragraphs.push("Kind regards,");

  return paragraphs.join("\n\n");
}

function isEvidenceOptionAllowed(
  advisories: DisputeEvidenceOptionAdvisory[],
  option: DisputeEvidenceOptionAdvisory["option"]
): boolean {
  return advisories.find((advisory) => advisory.option === option)?.allowed ?? false;
}

function buildOnsParagraph(result: RentCheckResult): string {
  const comparison = result.officialBenchmarkComparison;
  return `I checked the ONS monthly private rent estimate for ${comparison.benchmark.areaName}. This is a Local Authority benchmark, not a figure for the individual postcode. For ${comparison.selection.label}, the area benchmark is ${formatCurrency(comparison.selection.monthlyRent)} per month. The monthly rent I entered is ${formatCurrency(comparison.userRentMonthly)}, which is ${formatSignedCurrency(comparison.differenceMonthly)} (${formatSignedPercent(comparison.percentageDifference)}) compared with that benchmark.`;
}

function getOnsAdvisory(result: RentCheckResult): DisputeEvidenceOptionAdvisory {
  const percentage = result.officialBenchmarkComparison.percentageDifference;
  if (percentage > supportThresholdPercent) {
    return {
      option: "includeOnsBenchmark",
      allowed: true,
      reason:
        "The rent entered is more than 10% above the ONS Local Authority benchmark."
    };
  }

  if (percentage < -supportThresholdPercent) {
    return {
      option: "includeOnsBenchmark",
      allowed: false,
      reason:
        "The ONS Local Authority benchmark is more than 10% higher than the rent entered, so including it may weaken the message."
    };
  }

  return {
    option: "includeOnsBenchmark",
    allowed: true,
    reason:
      "The rent entered is within 10% of the ONS Local Authority benchmark, so treat it as neutral context."
  };
}

function getLivePmiAdvisory(
  result: RentCheckResult
): DisputeEvidenceOptionAdvisory {
  if (!result.liveEvidence?.medianMonthly) {
    return {
      option: "includePmiLive",
      allowed: false,
      reason: "No usable PMI live-listing median is available."
    };
  }

  const calibration = calibrateLiveRentalEvidence(
    result.liveEvidence,
    result.officialBenchmarkComparison.userRentMonthly
  );

  if (calibration.qualityLevel === "limited") {
    return {
      option: "includePmiLive",
      allowed: false,
      reason:
        "PMI live-listing context is limited, so it is not added to the message automatically."
    };
  }

  if (calibration.rentPosition !== "above") {
    return {
      option: "includePmiLive",
      allowed: false,
      reason:
        "The PMI live-listing median does not show the rent entered as more than 10% above that context."
    };
  }

  return {
    option: "includePmiLive",
    allowed: true,
    reason:
      "PMI live-listing context is usable and shows the rent entered more than 10% above the median."
  };
}

function getDeeperPmiAdvisory(
  result: RentCheckResult
): DisputeEvidenceOptionAdvisory {
  if (!result.deeperComparableEvidence?.medianMonthly) {
    return {
      option: "includePmiDeeper",
      allowed: false,
      reason: "No usable recent PMI rented-record median is available."
    };
  }

  const calibration = calibrateDeeperComparableEvidence(
    result.deeperComparableEvidence,
    result.officialBenchmarkComparison.userRentMonthly
  );

  if (calibration.qualityLevel === "limited") {
    return {
      option: "includePmiDeeper",
      allowed: false,
      reason:
        "Recent PMI rented-record context is limited, so it is not added to the message automatically."
    };
  }

  if (calibration.rentPosition !== "above") {
    return {
      option: "includePmiDeeper",
      allowed: false,
      reason:
        "The recent PMI rented-record median does not show the rent entered as more than 10% above that context."
    };
  }

  return {
    option: "includePmiDeeper",
    allowed: true,
    reason:
      "Recent PMI rented-record context is usable and shows the rent entered more than 10% above the median."
  };
}

function getEvidenceAssessment(result: RentCheckResult): {
  hasSupportingEvidence: boolean;
  hasClearWeakeningEvidence: boolean;
  weakeningReasons: string[];
  cautionReasons: string[];
} {
  const advisories = getDisputeEvidenceOptionAdvisories(result);
  const onsAdvisory = advisories.find(
    (advisory) => advisory.option === "includeOnsBenchmark"
  );
  const pmiAdvisories = advisories.filter(
    (advisory) => advisory.option !== "includeOnsBenchmark"
  );
  const onsSupports = onsAdvisory?.allowed === true && isOnsSupportive(result);
  const pmiSupports = pmiAdvisories.some((advisory) => advisory.allowed);
  const onsWeakens = onsAdvisory?.allowed === false;
  const pmiWeakens = pmiAdvisories.some(
    (advisory) =>
      !advisory.allowed &&
      !advisory.reason.startsWith("No usable") &&
      !advisory.reason.includes("limited")
  );
  const weakeningReasons = advisories
    .filter(
      (advisory) =>
        !advisory.allowed &&
        !advisory.reason.startsWith("No usable") &&
        !advisory.reason.includes("limited")
    )
    .map((advisory) => advisory.reason);
  const cautionReasons = advisories.map((advisory) => advisory.reason);

  return {
    hasSupportingEvidence: onsSupports || pmiSupports,
    hasClearWeakeningEvidence: onsWeakens || pmiWeakens,
    weakeningReasons:
      weakeningReasons.length > 0
        ? weakeningReasons
        : ["The available benchmark and PMI context do not strongly support this message."],
    cautionReasons
  };
}

function isOnsSupportive(result: RentCheckResult): boolean {
  return (
    result.officialBenchmarkComparison.percentageDifference >
    supportThresholdPercent
  );
}

function buildFormalNoticeParagraph(result: RentCheckResult): string {
  const details: string[] = [];
  if (result.input.noticeReceivedAt) {
    details.push(`notice received: ${result.input.noticeReceivedAt}`);
  }
  if (result.input.proposedIncreaseStartsAt) {
    details.push(`proposed start date: ${result.input.proposedIncreaseStartsAt}`);
  }
  if (result.input.noticeSaysForm4A) {
    details.push("the notice refers to Form 4A");
  }
  if (result.input.noticeSaysSection13) {
    details.push("the notice refers to section 13");
  }
  return `The notice details I have recorded are: ${details.join(", ")}.`;
}

function hasFormalNoticeDetails(result: RentCheckResult): boolean {
  return Boolean(
    result.input.tenancyContext === "formal-form-4a-section-13" &&
      (result.input.noticeReceivedAt ||
        result.input.proposedIncreaseStartsAt ||
        result.input.noticeSaysForm4A ||
        result.input.noticeSaysSection13)
  );
}

function formatSignedCurrency(value: number): string {
  if (value === 0) return formatCurrency(0);
  return `${value > 0 ? "+" : "-"}${formatCurrency(Math.abs(value))}`;
}

function formatSignedPercent(value: number): string {
  const rounded = Math.abs(value).toFixed(1);
  if (value === 0) return "0.0%";
  return `${value > 0 ? "+" : "-"}${rounded}%`;
}
