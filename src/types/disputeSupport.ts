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

export type DisputeTemplateSuitabilityStatus =
  | "recommended"
  | "use_with_caution"
  | "not_recommended";

export type DisputeTemplateSuitability = {
  status: DisputeTemplateSuitabilityStatus;
  title: string;
  summary: string;
  reasons: string[];
  recommendation: string;
};

export type DisputeEvidenceOptionAdvisory = {
  option: Extract<
    DisputeTemplateOption,
    "includeOnsBenchmark" | "includePmiLive" | "includePmiDeeper"
  >;
  allowed: boolean;
  reason: string;
};
