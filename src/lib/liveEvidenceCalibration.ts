import { percentageDifference } from "./rentMath";
import type {
  LiveEvidenceCalibration,
  LiveEvidenceFreshnessLabel,
  LiveEvidenceRentPosition,
  LiveEvidenceSampleSizeLabel,
  LiveRentalEvidenceResult
} from "../types/liveEvidence";

const nearRentPercent = 10;
const strongSpreadPercent = 35;
const limitedSpreadPercent = 60;
const recentDays = 60;

export function calibrateLiveRentalEvidence(
  evidence: LiveRentalEvidenceResult,
  userRentMonthly: number
): LiveEvidenceCalibration {
  const median = evidence.medianMonthly;
  const displayedCount = evidence.displayedCount;
  const datedListings = countDatedListings(evidence);
  const datedThreshold = Math.ceil(displayedCount / 2);
  const freshnessLabel = getFreshnessLabel(evidence, datedListings);
  const spreadPercent = calculateSpreadPercent(evidence);
  const medianDifferenceMonthly =
    median === undefined ? undefined : userRentMonthly - median;
  const medianDifferencePercent =
    median === undefined ? undefined : percentageDifference(userRentMonthly, median);

  const reasons = buildReasons({
    displayedCount,
    median,
    spreadPercent,
    datedListings,
    datedThreshold,
    freshnessLabel
  });

  return {
    qualityLevel: getQualityLevel({
      displayedCount,
      median,
      spreadPercent,
      datedListings,
      datedThreshold
    }),
    sampleSizeLabel: getSampleSizeLabel(displayedCount),
    freshnessLabel,
    rentPosition: getRentPosition(medianDifferencePercent),
    medianDifferenceMonthly,
    medianDifferencePercent,
    spreadPercent,
    datedListings,
    reasons
  };
}

function getQualityLevel({
  displayedCount,
  median,
  spreadPercent,
  datedListings,
  datedThreshold
}: {
  displayedCount: number;
  median: number | undefined;
  spreadPercent: number | undefined;
  datedListings: number;
  datedThreshold: number;
}): LiveEvidenceCalibration["qualityLevel"] {
  if (
    displayedCount < 4 ||
    median === undefined ||
    (spreadPercent !== undefined && spreadPercent > limitedSpreadPercent) ||
    datedListings < datedThreshold
  ) {
    return "limited";
  }

  if (
    displayedCount >= 8 &&
    spreadPercent !== undefined &&
    spreadPercent <= strongSpreadPercent &&
    datedListings >= 6
  ) {
    return "strong";
  }

  return "useful";
}

function getSampleSizeLabel(displayedCount: number): LiveEvidenceSampleSizeLabel {
  if (displayedCount >= 8) return "Broad sample";
  if (displayedCount >= 4) return "Usable sample";
  return "Small sample";
}

function getRentPosition(
  medianDifferencePercent: number | undefined
): LiveEvidenceRentPosition {
  if (medianDifferencePercent === undefined) return "unavailable";
  if (medianDifferencePercent > nearRentPercent) return "above";
  if (medianDifferencePercent < -nearRentPercent) return "below";
  return "near";
}

function calculateSpreadPercent(
  evidence: LiveRentalEvidenceResult
): number | undefined {
  if (
    evidence.medianMonthly === undefined ||
    evidence.minimumMonthly === undefined ||
    evidence.maximumMonthly === undefined ||
    evidence.medianMonthly <= 0
  ) {
    return undefined;
  }

  return ((evidence.maximumMonthly - evidence.minimumMonthly) / evidence.medianMonthly) * 100;
}

function getFreshnessLabel(
  evidence: LiveRentalEvidenceResult,
  datedListings: number
): LiveEvidenceFreshnessLabel {
  if (datedListings < Math.ceil(evidence.displayedCount / 2)) {
    return "Unknown freshness";
  }

  const searchedAt = parseEvidenceDate(evidence.searchedAt);
  if (!searchedAt) return "Mixed freshness";

  const datedRows = evidence.listings
    .map((listing) => parseEvidenceDate(listing.listedDate))
    .filter((date): date is Date => date !== null);

  const allRecent = datedRows.every((date) => {
    const ageDays = (searchedAt.getTime() - date.getTime()) / 86_400_000;
    return ageDays >= 0 && ageDays <= recentDays;
  });

  return allRecent ? "Recent" : "Mixed freshness";
}

function countDatedListings(evidence: LiveRentalEvidenceResult): number {
  return evidence.listings.filter((listing) => parseEvidenceDate(listing.listedDate)).length;
}

function parseEvidenceDate(value: string | undefined): Date | null {
  if (!value) return null;

  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return buildUtcDate(isoMatch[1], isoMatch[2], isoMatch[3]);
  }

  const ukMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ukMatch) {
    return buildUtcDate(ukMatch[3], ukMatch[2], ukMatch[1]);
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function buildUtcDate(year: string, month: string, day: string): Date | null {
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return Number.isNaN(date.getTime()) ? null : date;
}

function buildReasons({
  displayedCount,
  median,
  spreadPercent,
  datedListings,
  datedThreshold,
  freshnessLabel
}: {
  displayedCount: number;
  median: number | undefined;
  spreadPercent: number | undefined;
  datedListings: number;
  datedThreshold: number;
  freshnessLabel: LiveEvidenceFreshnessLabel;
}): string[] {
  const reasons: string[] = [];

  if (displayedCount < 4) {
    reasons.push("Small sample: fewer than 4 live listings were usable.");
  } else if (displayedCount >= 8) {
    reasons.push("Broad sample: at least 8 live listings were usable.");
  } else {
    reasons.push("Usable sample: at least 4 live listings were usable.");
  }

  if (median === undefined) {
    reasons.push("No median asking rent could be calculated.");
  }

  if (spreadPercent !== undefined && spreadPercent > limitedSpreadPercent) {
    reasons.push("Wide range: asking rents vary by more than 60% around the median.");
  } else if (spreadPercent !== undefined && spreadPercent <= strongSpreadPercent) {
    reasons.push("Tighter range: asking rents vary by no more than 35% around the median.");
  }

  if (datedListings < datedThreshold) {
    reasons.push("Unknown listing dates: most usable listings do not include a date.");
  } else if (freshnessLabel === "Recent") {
    reasons.push("Recent listings: dated listings are within the recent search window.");
  } else {
    reasons.push("Mixed freshness: dated listings are not all recent.");
  }

  return reasons;
}
