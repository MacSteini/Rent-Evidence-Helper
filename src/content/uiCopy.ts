import type {
  ConfidenceLevel,
  RentAssessmentStatus,
  ResultCopy,
  TenancyContext
} from "../types/rent";

export const fieldCopy = {
  postcodeHint: "Use a UK postcode. The app only displays the sector in results.",
  rentHint: "Enter the current rent or proposed new rent.",
  fixtureNotice:
    "This prototype uses sample data, not live rental listings. Do not use this result as evidence."
};

export const methodologyCopy = [
  "Weekly rent is converted to monthly rent using weekly rent multiplied by 52 and divided by 12.",
  "Comparable homes are matched first by postcode sector, property type and bedrooms, then widened to fixture fallback data if needed.",
  "The range uses the lower quartile, median and upper quartile of normalised monthly comparable rents.",
  "Confidence reflects sample size, match quality, data freshness and source quality.",
  "If the evidence is too limited or too broad, the result is marked as insufficient or low confidence."
];

export const resultCopy: Record<RentAssessmentStatus, ResultCopy> = {
  insufficient_evidence: {
    headline: "There is not enough evidence to give a reliable estimate.",
    summary:
      "The available comparable data is too limited, too broad, or not closely matched enough for a firm market-rent indication.",
    nextStepIntro:
      "You can still collect examples of similar properties and check official guidance before deciding what to do next.",
    severity: "neutral"
  },
  within_range: {
    headline: "Your rent appears within the typical range.",
    summary:
      "Based on the available comparable evidence, the rent is at or below the upper quartile for similar fixture properties.",
    nextStepIntro:
      "Keep a copy of your evidence and check official guidance if your landlord proposes a formal increase.",
    severity: "neutral"
  },
  above_median: {
    headline: "Your rent is above the median but still within the observed range.",
    summary:
      "The rent is higher than the midpoint of the comparable evidence, but not above the upper quartile.",
    nextStepIntro:
      "You may want to collect more comparable examples before raising the issue.",
    severity: "notice"
  },
  potentially_high: {
    headline: "Your rent appears higher than much of the comparable evidence.",
    summary:
      "The rent is above the upper quartile or the evidence is low confidence but directionally high.",
    nextStepIntro:
      "Consider asking how the rent was calculated and collect comparable evidence.",
    severity: "warning"
  },
  likely_above_market: {
    headline: "Your rent appears above comparable market evidence.",
    summary:
      "The rent is more than 10% above the comparable median and enough evidence is available to flag it clearly.",
    nextStepIntro:
      "You may want to ask for supporting evidence and check whether the formal process applies.",
    severity: "warning"
  },
  strongly_above_market: {
    headline: "Your rent appears well above comparable market evidence.",
    summary:
      "The rent is more than 20% above the comparable median and the fixture evidence is close enough to make this a strong warning.",
    nextStepIntro:
      "Collect evidence, keep copies of any notice, and check official guidance promptly.",
    severity: "warning"
  }
};

export function confidenceLabel(confidence: ConfidenceLevel): string {
  if (confidence === "high") return "High confidence";
  if (confidence === "medium") return "Medium confidence";
  return "Low confidence";
}

export function contextHeading(context: TenancyContext): string {
  switch (context) {
    case "current-rent-only":
      return "Current rent";
    case "informal-proposed-increase":
      return "Informal proposed increase";
    case "formal-form-4a-section-13":
      return "Form 4A / section 13 notice";
    case "not-sure":
      return "Not sure";
  }
}
