export type RentPeriod = "week" | "month" | "year";

export type PropertyType =
  | "flat"
  | "house"
  | "studio"
  | "room"
  | "maisonette"
  | "other"
  | "unknown";

export type FurnishedStatus =
  | "furnished"
  | "part-furnished"
  | "unfurnished"
  | "unknown";

export type PropertyCondition =
  | "basic"
  | "average"
  | "good"
  | "newly-renovated"
  | "unknown";

export type TenancyContext =
  | "current-rent-only"
  | "informal-proposed-increase"
  | "formal-form-4a-section-13";

export type RentAssessmentStatus =
  | "insufficient_evidence"
  | "within_range"
  | "above_median"
  | "potentially_high"
  | "likely_above_market"
  | "strongly_above_market";

export type ConfidenceLevel = "low" | "medium" | "high";

export type SourceType =
  | "listing"
  | "official-statistic"
  | "licensed-dataset"
  | "fixture"
  | "manual";

export type ComparableMatchType = "exact" | "partial" | "fallback";

export type DataProviderMode =
  | "fixture"
  | "licensed-live"
  | "official-statistics"
  | "manual-user-evidence";

export type RentSearchInput = {
  postcode: string;
  postcodeSector?: string;
  localAuthorityCode: string;
  rentAmount: number;
  rentPeriod: RentPeriod;
  propertyType: PropertyType;
  bedrooms: number;
  bathrooms?: number;
  furnished?: FurnishedStatus;
  billsIncluded?: boolean | "unknown";
  condition?: PropertyCondition;
  tenancyContext: TenancyContext;
  noticeReceivedAt?: string;
  proposedIncreaseStartsAt?: string;
  noticeSaysForm4A?: boolean;
  noticeSaysSection13?: boolean;
  lastRentIncreaseAt?: string;
};

export type ComparableRent = {
  id: string;
  sourceName: string;
  sourceUrl?: string;
  sourceType: SourceType;
  observedAt: string;
  postcode?: string;
  postcodeSector?: string;
  latitude?: number;
  longitude?: number;
  propertyType?: PropertyType;
  bedrooms?: number;
  bathrooms?: number;
  furnished?: FurnishedStatus;
  billsIncluded?: boolean | "unknown";
  rentAmount: number;
  rentPeriod: RentPeriod;
  rentMonthly: number;
  description?: string;
  matchScore?: number;
  matchType?: ComparableMatchType;
  confidenceNotes?: string[];
};

export type ComparableRentSearchResult = {
  comparables: ComparableRent[];
  providerName: string;
  searchedAt: string;
  searchAreaDescription: string;
  radiusMiles?: number;
  warnings: string[];
  errors: string[];
};

export type RentEstimate = {
  userRentMonthly: number;
  userRentAnnual: number;
  estimatedMedianMonthly?: number;
  estimatedLowerQuartileMonthly?: number;
  estimatedUpperQuartileMonthly?: number;
  observedMinimumMonthly?: number;
  observedMaximumMonthly?: number;
  estimatedRangeLabel: string;
  comparableCount: number;
  status: RentAssessmentStatus;
  confidence: ConfidenceLevel;
  confidenceScore: number;
  warnings: string[];
  methodologyNotes: string[];
};

export type ResultCopy = {
  headline: string;
  summary: string;
  nextStepIntro: string;
  severity: "neutral" | "notice" | "warning";
};
