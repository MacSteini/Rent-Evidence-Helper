import type { OfficialBenchmarkStatus } from "../types/officialRentBenchmark";

type ResultCopy = {
  headline: string;
  summary: string;
  nextStepIntro: string;
  severity: "neutral" | "notice" | "warning";
};

export const fieldCopy = {
  postcodeHint:
    "Use the rental property's UK postcode.",
  localAuthorityHint:
    "This is used only for the ONS area benchmark.",
  rentHint: "Enter the current rent or proposed new rent.",
  evidenceNotice:
    "Use this as evidence, not a decision. ONS data is an area benchmark; Property Market Intel data is live asking-rent evidence when you provide a key. Check official guidance before acting or sending any formal challenge."
};

export const jurisdictionCopy = {
  intro:
    "England only: rent-increase rules and tribunal routes differ elsewhere in the UK.",
  disclaimer:
    "Area benchmark and dispute support only. Not legal advice.",
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
    "Start typing to narrow the Local Authority list. The app does not send the full postcode to a lookup service, and this selection only controls the ONS area benchmark.",
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

export const deeperComparableCopy = {
  title: "Recent PMI rented records",
  summary:
    "A separate historical rented-record check for the postcode sector. It may add context, may cost credits, and may still return no recent records.",
  creditWarning:
    "This check may cost 5 PMI credits each time it is run.",
  button: "Run recent rented-record check",
  loading: "Running recent rented-record check...",
  wait: (seconds: number) =>
    `Wait ${seconds}s before running PMI again`,
  noKey:
    "Enter a Property Market Intel API key to run the recent rented-record check.",
  caption:
    "Recent Property Market Intel rented records from the last 12 months. Exact addresses, UPRNs and full postcodes are not shown.",
  sourceLabel: "Property Market Intel rented records",
  available: "Recent PMI rented records available",
  status:
    "These are historical rented records, not current live adverts. Use them as context when asking for evidence, not as proof that the rent is lawful or unlawful.",
  liveEmptyWithRecords:
    "Historical rented records are shown separately below. They are not current live listings.",
  disagreement:
    "Live listings and recent rented records point to different rent levels. Treat PMI as context only.",
  quality: {
    limited:
      "Limited recent record context. A small sample, broad range or missing dates means you should not lean on this alone.",
    useful:
      "Usable recent record context. Check the records and compare them with your own evidence.",
    strong:
      "Broader recent record context. It is still context only, not a rent decision."
  }
};

export const evidenceSummaryCopy = {
  title: "Evidence summary",
  summary:
    "The official benchmark remains the main result. Live listings add context when available.",
  onsLabel: "ONS benchmark status",
  pmiLabel: "Current PMI live listings",
  deeperLabel: "Recent PMI records",
  actionLabel: "Recommended action",
  pmiOnly: "ONS benchmark only",
  pmiWarning:
    "Current PMI live listings unavailable. Recent rented records are a separate optional check.",
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

export const savedResultCopy = {
  title: "Saved result",
  body:
    "This completed check is saved in this browser so it can survive a refresh. Clear it if you are using a shared device.",
  clearButton: "Clear saved result",
  clearNote: "This does not clear your Property Market Intel API key."
};

export const disputeSupportCopy = {
  title: "Dispute support",
  summary:
    "Use these templates to ask for evidence, explain what you want to resolve, and check official routes before you decide what to do next. Edit any message before sending it.",
  note:
    "Sending a message does not pause, extend or satisfy any tribunal deadline and is not a substitute for legal advice.",
  templateLabel: "Choose a message template",
  optionLegend: "Tailor the message",
  editableLabel: "Editable message",
  copyButton: "Copy this message",
  copiedButton: "Message copied.",
  copyError:
    "The message could not be copied. Select the text and copy it manually.",
  templates: {
    "ask-for-evidence": {
      title: "Ask for evidence",
      summary: "Ask for the calculation and written rental evidence behind the rent."
    },
    "negotiate-informally": {
      title: "Negotiate informally",
      summary: "Ask for a calm discussion and a chance to resolve the issue."
    },
    "formal-notice-query": {
      title: "Formal notice query",
      summary: "Ask about Form 4A / section 13 notice details."
    },
    "tribunal-route-preparation": {
      title: "Tribunal route preparation",
      summary: "Say that you will check official tribunal guidance promptly if needed."
    }
  },
  options: {
    includeOnsBenchmark: "Include ONS benchmark summary",
    includePmiLive: "Include PMI live-listings context",
    includePmiDeeper: "Include recent PMI rented-record context",
    requestWrittenEvidence: "Ask for written evidence",
    askForInformalResolution: "Ask to resolve this informally",
    includeFormalNoticeDetails: "Mention recorded notice details",
    includeCaveat: "Keep evidence and deadline caveat"
  },
  officialRoutesTitle: "Official routes to check",
  officialRoutesSummary:
    "Use official guidance to understand the process, forms, evidence and timing before you act.",
  officialRoutes: [
    {
      title: "Rent increase rules",
      description:
        "Use this to check when an assured periodic tenancy rent increase can happen, how much notice is needed and when Form 4A / section 13 may apply.",
      href: "https://www.gov.uk/assured-periodic-tenancies-tenants/rent-increases",
      label: "Assured periodic tenancies: rent increases"
    },
    {
      title: "Assured tenancy forms",
      description:
        "Use this to find the current prescribed forms and check whether the form named in a notice matches the current official forms for England.",
      href: "https://www.gov.uk/guidance/assured-tenancy-forms",
      label: "Assured tenancy forms"
    },
    {
      title: "Open market rent determination",
      description:
        "Use this to check whether the First-tier Tribunal route may be available, what evidence can help, fees, forms and the timing rules before any proposed start date.",
      href: "https://www.gov.uk/guidance/apply-for-an-open-market-rent-determination",
      label: "Apply for an open market rent determination"
    },
    {
      title: "Renters' Rights Act information",
      description:
        "Use this for official context on reforms. It does not decide an individual rent dispute.",
      href: "https://www.gov.uk/government/publications/the-renters-rights-act-information-sheet-2026",
      label: "Renters' Rights Act information sheet"
    }
  ]
};

export const methodologyCopy = [
  "Weekly rent is converted to monthly rent using weekly rent multiplied by 52 and divided by 12.",
  "The result compares your monthly rent with the latest ingested ONS private-rent benchmark for the Local Authority you choose.",
  "If you provide a Property Market Intel API key, the app also requests live rental listings directly from Property Market Intel and treats those listing prices as asking rents.",
    "The optional recent PMI rented-record check is user-triggered, may cost 5 PMI credits, and uses only the postcode sector derived in the browser. It requests records from the last 12 months only. Property Market Intel free-tier use may require short waits between requests; the app does not retry automatically.",
  "Bedroom count is used first to select the ONS benchmark field. If bedrooms are not usable, flats and maisonettes use the flat or maisonette benchmark; other cases use the all-property benchmark.",
  "Status uses the difference from the selected ONS benchmark: near is within 10%, above is more than 10%, and well above is more than 20%. Live listings add context but do not change the ONS-based status or tribunal rules.",
  "The PMI quality labels look at usable row count, rent spread and whether dates are present. A range spread above 60% forces a limited context label even when there are 10 rows.",
  "If current live listings and recent rented records point to materially different rent levels, the app warns you to treat PMI as context only.",
  "The ONS benchmark is an area-level estimate. Live listings and recent PMI rented records are context only. None of these sources is a tribunal decision or legal advice.",
  "Dispute support templates are generated locally from the result and your selected options. They do not send data to AI services and do not calculate or satisfy tribunal deadlines."
];

export const privacyCopy =
  "This app does not create an account, send inputs to third-party AI services, or use analytics. It keeps three local states separate: the API key in the current tab, an optional remembered API key on this device, and the latest completed check saved in this browser for refresh recovery. You can clear the saved result without clearing the API key, and Clear key removes the key without clearing the result. Dispute support templates are generated in this browser from the result and selected options. If you enter a Property Market Intel API key, requests go directly from this browser to Property Market Intel and may require short waits between requests. The optional recent rented-record check sends the postcode sector, not the full postcode. Local Authority is selected manually and is used for the ONS area benchmark.";

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
