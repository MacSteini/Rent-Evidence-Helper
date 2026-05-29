import type {
  ConfidenceLevel,
  RentAssessmentStatus,
  ResultCopy,
  TenancyContext
} from "../types/rent";

export const fieldCopy = {
  postcodeHint:
    "Use the rental property's UK postcode. Results and guidance are intended for England only.",
  rentHint: "Enter the current rent or proposed new rent.",
  evidenceNotice:
    "Compare this result with the evidence you collect and check official guidance before acting."
};

export const jurisdictionCopy = {
  intro:
    "For rental properties in England only. Rent-increase rules and tribunal routes differ in Scotland, Wales and Northern Ireland.",
  disclaimer:
    "This tool is for rental properties in England only. It gives general information based on local rental evidence, not legal advice, and it does not decide the legal market rent.",
  privacy:
    "The postcode is used only to derive a comparison sector; it is not used to decide whether the property is in England.",
  scopeTitle: "Why this is England only",
  scopeSummary:
    "The rent-increase and First-tier Tribunal guidance used here belongs to the England assured-tenancy framework. Wales, Scotland and Northern Ireland have different rented-housing regimes.",
  scopePoints: [
    "England: the current rent-increase, Form 4A / section 13 and First-tier Tribunal flow is the scope this tool supports.",
    "Wales: official Welsh guidance says the main English tenancy reforms do not apply in the same way; Wales uses occupation contracts and different rent rules.",
    "Scotland: official Scottish guidance identifies rental-discrimination provisions, not the English assured-tenancy rent-increase process.",
    "Northern Ireland: the reviewed official sources do not show the English rent-increase and tribunal flow applying there."
  ],
  scopeSourceIntro:
    "Use the official sources below if the property is outside England or if you need to check the current legal position."
};

export const fieldHelpCopy = {
  billsIncluded:
    "Choose Yes if the rent includes regular bills such as utilities or council tax. Bills can make homes less directly comparable, so use this detail when judging the evidence.",
  condition:
    "Use Basic for tired or limited-condition homes, Average for typical lived-in homes, Good for well-kept homes, and Newly renovated for recently upgraded homes. Condition can affect whether a comparable is a close match.",
  tenancyContext:
    "Choose the situation closest to yours. This changes the next-step guidance and may show notice questions, but it does not decide your legal position or calculate deadlines."
};

export const methodologyCopy = [
  "Weekly rent is converted to monthly rent using weekly rent multiplied by 52 and divided by 12.",
  "Comparable homes are matched first by postcode sector, property type and bedrooms, then widened to nearby evidence if needed.",
  "The estimated range uses the lower quartile, median and upper quartile of monthly comparable rents.",
  "Confidence reflects the number of comparables, match quality, data freshness and source quality.",
  "If the evidence is too limited or too broad, the result is marked as insufficient or low confidence."
];

export const privacyCopy =
  "This app does not create an account, send inputs to third-party AI services, or use analytics. To keep a completed result available after refresh, it saves the latest completed check in this browser only. It uses the postcode only to derive a sector for comparison and does not verify the legal jurisdiction of the property.";

export const confidenceCopy = {
  description:
    "This reflects the amount, match quality and freshness of the comparable evidence. It is not a legal reliability score.",
  calculation:
    "The score combines comparable count up to 10 homes (40%), match quality for location, property type and bedrooms (40%), and evidence freshness (20%). Provider warnings and errors reduce the score. High starts at 72%, medium at 48%, and lower scores are shown as low confidence."
};

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
      "Based on the available comparable evidence, the rent is at or below the upper quartile for similar properties.",
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
      "The rent is above the upper quartile, or the available evidence is less certain but still points higher.",
    nextStepIntro:
      "Consider asking how the rent was calculated and collect comparable evidence.",
    severity: "warning"
  },
  likely_above_market: {
    headline: "Your rent appears above comparable market evidence.",
    summary:
      "The rent is more than 10% above the comparable median, with enough evidence to treat this as a concern.",
    nextStepIntro:
      "You may want to ask for supporting evidence and check whether the formal process applies.",
    severity: "warning"
  },
  strongly_above_market: {
    headline: "Your rent appears well above comparable market evidence.",
    summary:
      "The rent is more than 20% above the comparable median, with enough close evidence to treat this as a significant concern.",
    nextStepIntro:
      "Collect evidence, keep copies of any notice, and check official guidance promptly.",
    severity: "warning"
  }
};

export function confidenceLabel(confidence: ConfidenceLevel): string {
  if (confidence === "high") return "High evidence confidence";
  if (confidence === "medium") return "Medium evidence confidence";
  return "Low evidence confidence";
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
