import type { OfficialBenchmarkStatus } from "../types/officialRentBenchmark";
import type { ResultCopy } from "../types/rent";

export const fieldCopy = {
  postcodeHint:
    "Use the rental property's UK postcode.",
  localAuthorityHint:
    "This is used only for the official ONS area benchmark.",
  rentHint: "Enter the current rent or proposed new rent.",
  evidenceNotice:
    "Use this as evidence, not a decision. ONS data is an official area benchmark; Property Market Intel data is live asking-rent evidence when you provide a key. Check official guidance before acting."
};

export const jurisdictionCopy = {
  intro:
    "For rental properties in England only. Rent-increase rules and tribunal routes differ in Scotland, Wales and Northern Ireland.",
  disclaimer:
    "This tool is for rental properties in England only. It gives an official area-benchmark indication, not legal advice, and it does not decide the legal market rent.",
  privacy:
    "The postcode stays in the browser. It is used for local validation and to block postcode areas that are clearly outside the supported England scope.",
  scopeTitle: "Why this is England only",
  scopeSummary:
    "The rent-increase and First-tier Tribunal guidance used here belongs to the England assured-tenancy framework. Wales, Scotland and Northern Ireland have different rented-housing regimes and different rent-increase routes.",
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
    "Choose Yes if the rent includes regular bills such as utilities or council tax. Bills can make rents harder to compare directly; this check records the detail for context.",
  condition:
    "Use Basic for tired homes, Average for typical lived-in homes, Good for well-kept homes, and Newly renovated for recently upgraded homes. This check records condition for context.",
  localAuthority:
    "Start typing to narrow the Local Authority list. The app does not send the full postcode to a lookup service, and this selection only controls the official ONS area benchmark.",
  tenancyContext:
    "Choose the situation closest to yours. This changes the next-step guidance and may show notice questions, but it does not decide your legal position or calculate deadlines."
};

export const officialBenchmarkCopy = {
  title: "Official area benchmark",
  summary:
    "ONS monthly private rent estimate for the selected local authority.",
  notice:
    "This is an area-level benchmark, not a list of individual rental listings, a tribunal decision or legal advice.",
  threshold:
    "Status uses the difference from the selected ONS benchmark: near is within 10%, above is more than 10%, and well above is more than 20%.",
  sourceLabel: "ONS PIPR monthly price statistics"
};

export const officialBenchmarkStatusCopy = {
  below_benchmark: "Below official area benchmark",
  near_benchmark: "Near official area benchmark",
  above_benchmark: "Above official area benchmark",
  substantially_above_benchmark: "Well above official area benchmark"
};

export const liveEvidenceCopy = {
  resultSummary:
    "Property Market Intel adds live asking-rent context. It does not replace the official benchmark result.",
  title: "Live rental listings",
  summary:
    "Live asking-rent listings for the search area. These are not achieved rents, a tribunal decision or legal advice.",
  caption:
    "Selected Property Market Intel rental listings. Exact addresses and UPRNs are not shown.",
  interpretation: {
    above:
      "Live asking rents sit below your rent by more than 10% of their median.",
    near:
      "Live asking rents sit within 10% of your rent when compared with their median.",
    below:
      "Live asking rents sit above your rent by more than 10% of their median.",
    unavailable:
      "Live asking-rent position is unavailable because no median could be calculated."
  },
  quality: {
    limited:
      "Limited live context. Treat this as a prompt to gather more evidence.",
    useful:
      "Useful live context. Check the individual listings before relying on it.",
    strong:
      "Strong live context. It is still asking-rent evidence, not a decision."
  }
};

export const evidenceSummaryCopy = {
  title: "Evidence summary",
  summary:
    "The official benchmark remains the main result. Live listings add context when available.",
  onsLabel: "ONS benchmark status",
  pmiLabel: "PMI context status",
  actionLabel: "Recommended action",
  pmiOnly: "ONS benchmark only",
  pmiWarning:
    "PMI unavailable. Use the ONS benchmark and evidence you collect yourself.",
  pmiQuality: {
    limited: "Limited PMI context",
    useful: "Useful PMI context",
    strong: "Strong PMI context"
  },
  pmiPosition: {
    above: "median sits below your rent",
    near: "median sits near your rent",
    below: "median sits above your rent",
    unavailable: "median unavailable"
  },
  actionWithPmi:
    "Use the ONS benchmark as the main result, then compare PMI listings with evidence you collect.",
  actionWithoutPmi:
    "Use the ONS benchmark as the main result and collect your own evidence before acting."
};

export const methodologyCopy = [
  "Weekly rent is converted to monthly rent using weekly rent multiplied by 52 and divided by 12.",
  "The result compares your monthly rent with the latest ingested ONS private-rent benchmark for the Local Authority you choose.",
  "If you provide a Property Market Intel API key, the app also requests live rental listings directly from Property Market Intel and treats those listing prices as asking rents.",
  "Bedroom count is used first to select the ONS benchmark field. If bedrooms are not usable, flats and maisonettes use the flat or maisonette benchmark; other cases use the all-property benchmark.",
  "Status uses the difference from the selected ONS benchmark: near is within 10%, above is more than 10%, and well above is more than 20%. Live listings add context but do not change the ONS-based status or tribunal rules.",
  "The live-listing quality label looks at usable listing count, asking-rent spread and whether listing dates are present. It helps you judge the context; it is not a reliability score.",
  "The ONS benchmark is an area-level estimate. Live listings are asking rents. Neither source is a tribunal decision or legal advice."
];

export const privacyCopy =
  "This app does not create an account, send inputs to third-party AI services, or use analytics. To keep a completed result available after refresh, it saves the latest completed check in this browser only. If you enter a Property Market Intel API key, the live listing request goes directly from this browser to Property Market Intel. The key stays in the current tab unless you choose to remember it on this device. Local Authority is selected manually and is used for the official ONS area benchmark.";

export const resultCopy: Record<OfficialBenchmarkStatus, ResultCopy> = {
  below_benchmark: {
    headline: "Your rent is below the official area benchmark.",
    summary:
      "Your monthly rent is more than 10% below the selected ONS Local Authority benchmark.",
    nextStepIntro:
      "Use the official benchmark as one evidence point and keep your own records if rent is reviewed later.",
    severity: "neutral"
  },
  near_benchmark: {
    headline: "Your rent is near the official area benchmark.",
    summary:
      "Your monthly rent is within 10% of the selected ONS Local Authority benchmark.",
    nextStepIntro:
      "Use the official benchmark as one evidence point and compare it with any evidence you collect yourself.",
    severity: "neutral"
  },
  above_benchmark: {
    headline: "Your rent is above the official area benchmark.",
    summary:
      "Your monthly rent is more than 10% above the selected ONS Local Authority benchmark.",
    nextStepIntro:
      "Use the official benchmark as one evidence point, ask how the rent was calculated, and collect your own evidence before acting.",
    severity: "notice"
  },
  substantially_above_benchmark: {
    headline: "Your rent is well above the official area benchmark.",
    summary:
      "Your monthly rent is more than 20% above the selected ONS Local Authority benchmark.",
    nextStepIntro:
      "Use the official benchmark as one evidence point, collect supporting evidence, and check official guidance promptly.",
    severity: "warning"
  }
};
