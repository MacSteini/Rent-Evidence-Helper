import type { DataProviderMode } from "../types/rent";

export const appConfig = {
  productName: "Market Rent Check",
  tagline: "Compare your rent with local market evidence.",
  dataProviderMode: "fixture" as DataProviderMode,
  legalLastCheckedAt: "2026-05-29",
  minComparableCount: 5,
  freshnessDays: 730
};
