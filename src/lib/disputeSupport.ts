import { formatCurrency } from "./rentMath";
import { formatEvidenceDateRange } from "./evidenceDates";
import type { RentCheckResult } from "../types/rentCheckResult";
import type {
  DisputeSupportSelection,
  DisputeTemplateId
} from "../types/disputeSupport";

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
  return {
    includeOnsBenchmark: true,
    includePmiLive: Boolean(result.liveEvidence?.medianMonthly),
    includePmiDeeper: Boolean(result.deeperComparableEvidence?.medianMonthly),
    requestWrittenEvidence: true,
    askForInformalResolution: true,
    includeFormalNoticeDetails: hasFormalNoticeDetails(result),
    includeCaveat: true
  };
}

export function buildDisputeMessageTemplate(
  result: RentCheckResult,
  templateId: DisputeTemplateId,
  selection: DisputeSupportSelection
): string {
  const { input } = result;
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
    `The rental property postcode I entered is ${postcode}.`
  ];

  if (selection.includeOnsBenchmark) {
    paragraphs.push(buildOnsParagraph(result));
  }

  if (selection.includePmiLive && result.liveEvidence?.medianMonthly) {
    paragraphs.push(
      `I also checked live asking-rent listings through Property Market Intel. The median asking rent in that live-listing context is ${formatCurrency(result.liveEvidence.medianMonthly)} per month.`
    );
  }

  if (
    selection.includePmiDeeper &&
    result.deeperComparableEvidence?.medianMonthly
  ) {
    const recordWindow = formatEvidenceDateRange(
      result.deeperComparableEvidence.dateWindowStart,
      result.deeperComparableEvidence.dateWindowEnd
    );
    paragraphs.push(
      `I also checked recent Property Market Intel rented records for the postcode sector from ${recordWindow}. The median rent in that historical rented-record context is ${formatCurrency(result.deeperComparableEvidence.medianMonthly)} per month. This is not current live listings or a legal decision.`
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

function buildOnsParagraph(result: RentCheckResult): string {
  const comparison = result.officialBenchmarkComparison;
  return `I checked the ONS monthly private rent estimate for ${comparison.benchmark.areaName}. For ${comparison.selection.label}, the official area benchmark is ${formatCurrency(comparison.selection.monthlyRent)} per month. The monthly rent I entered is ${formatCurrency(comparison.userRentMonthly)}, which is ${formatSignedCurrency(comparison.differenceMonthly)} (${formatSignedPercent(comparison.percentageDifference)}) compared with that benchmark.`;
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
