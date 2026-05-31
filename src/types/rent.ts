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

export type RentSearchInput = {
  postcode: string;
  postcodeSector?: string;
  localAuthorityCode: string;
  rentAmount: number;
  currentRentBeforeIncrease?: number;
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
