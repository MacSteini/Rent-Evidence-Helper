import { appConfig } from "../config/appConfig";
import { confidenceBand } from "./confidence";
import { percentageDifference } from "./rentMath";
import type {
  ComparableRentSearchResult,
  RentAssessmentStatus
} from "../types/rent";

export function classifyRent(
  userRentMonthly: number,
  medianMonthly: number | undefined,
  upperQuartileMonthly: number | undefined,
  searchResult: ComparableRentSearchResult,
  confidenceScore: number
): RentAssessmentStatus {
  if (
    medianMonthly === undefined ||
    upperQuartileMonthly === undefined ||
    searchResult.comparables.length < appConfig.minComparableCount ||
    searchResult.errors.length > 0
  ) {
    return "insufficient_evidence";
  }

  const confidence = confidenceBand(confidenceScore);
  const aboveMedianPercent = percentageDifference(userRentMonthly, medianMonthly);

  if (confidence === "low" && userRentMonthly > upperQuartileMonthly) {
    return "potentially_high";
  }

  if (confidence === "low") {
    return "insufficient_evidence";
  }

  if (aboveMedianPercent > 20) {
    return "strongly_above_market";
  }

  if (aboveMedianPercent > 10) {
    return "likely_above_market";
  }

  if (userRentMonthly > upperQuartileMonthly) {
    return "potentially_high";
  }

  if (userRentMonthly > medianMonthly) {
    return "above_median";
  }

  return "within_range";
}
