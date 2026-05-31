export type DisputeTemplateId =
  | "ask-for-evidence"
  | "negotiate-informally"
  | "formal-notice-query"
  | "tribunal-route-preparation";

export type DisputeTemplateOption =
  | "includeOnsBenchmark"
  | "includePmiLive"
  | "includePmiDeeper"
  | "requestWrittenEvidence"
  | "askForInformalResolution"
  | "includeFormalNoticeDetails"
  | "includeCaveat";

export type DisputeSupportSelection = Record<DisputeTemplateOption, boolean>;
