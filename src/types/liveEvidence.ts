import type { PropertyType, RentPeriod, RentSearchInput } from "./rent";

export type LiveEvidenceKind = "licensed-live";

export type DeeperComparableEvidenceKind = "licensed-comparables";

export type LiveEvidenceProvider = "property-market-intel";

export type LiveEvidenceFailureCode =
  | "missing-key"
  | "invalid-key"
  | "quota-or-rate-limit"
  | "network-or-cors"
  | "no-listings"
  | "malformed-response";

export type LiveEvidenceQualityLevel = "limited" | "useful" | "strong";

export type LiveEvidenceSampleSizeLabel =
  | "Small sample"
  | "Usable sample"
  | "Broad sample";

export type LiveEvidenceFreshnessLabel =
  | "Recent"
  | "Mixed freshness"
  | "Unknown freshness";

export type LiveEvidenceRentPosition = "below" | "near" | "above" | "unavailable";

export type LiveRentalListing = {
  id: string;
  sourceName: "Property Market Intel";
  sourceType: "licensed-dataset";
  sourceUrl?: string;
  observedAt: string;
  postcodeSector?: string;
  rentAmount: number;
  rentPeriod: RentPeriod;
  rentMonthly: number;
  bedrooms?: number;
  propertyType?: PropertyType;
  listedDate?: string;
  distanceMeters?: number;
};

export type DeeperComparableRent = {
  id: string;
  sourceName: "Property Market Intel";
  sourceType: "licensed-dataset";
  observedAt: string;
  postcodeSector?: string;
  rentAmount: number;
  rentPeriod: RentPeriod;
  rentMonthly: number;
  bedrooms?: number;
  propertyType?: PropertyType;
  evidenceDate?: string;
  distanceMeters?: number;
};

export type LiveRentalEvidenceResult = {
  evidenceKind: LiveEvidenceKind;
  provider: LiveEvidenceProvider;
  searchedAt: string;
  searchAreaDescription: string;
  totalCount: number;
  displayedCount: number;
  medianMonthly?: number;
  minimumMonthly?: number;
  maximumMonthly?: number;
  listings: LiveRentalListing[];
  warnings: string[];
};

export type DeeperComparableEvidenceResult = {
  evidenceKind: DeeperComparableEvidenceKind;
  provider: LiveEvidenceProvider;
  searchedAt: string;
  searchAreaDescription: string;
  totalCount: number;
  displayedCount: number;
  medianMonthly?: number;
  minimumMonthly?: number;
  maximumMonthly?: number;
  comparables: DeeperComparableRent[];
  warnings: string[];
};

export type LiveEvidenceCalibration = {
  qualityLevel: LiveEvidenceQualityLevel;
  sampleSizeLabel: LiveEvidenceSampleSizeLabel;
  freshnessLabel: LiveEvidenceFreshnessLabel;
  rentPosition: LiveEvidenceRentPosition;
  medianDifferenceMonthly?: number;
  medianDifferencePercent?: number;
  spreadPercent?: number;
  datedListings: number;
  reasons: string[];
};

export type LiveEvidenceRequest = {
  input: RentSearchInput;
  apiKey: string;
};
