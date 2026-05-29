import type { PropertyType, RentPeriod, RentSearchInput } from "./rent";

export type LiveEvidenceKind = "licensed-live";

export type LiveEvidenceProvider = "property-market-intel";

export type LiveEvidenceFailureCode =
  | "missing-key"
  | "invalid-key"
  | "quota-or-rate-limit"
  | "network-or-cors"
  | "no-listings"
  | "malformed-response";

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

export type LiveEvidenceRequest = {
  input: RentSearchInput;
  apiKey: string;
};

