import { appConfig } from "../config/appConfig";
import { classifyRent } from "./classifyRent";
import { calculateConfidenceScore, confidenceBand } from "./confidence";
import { formatCurrency, normaliseRentToMonthly, monthlyToAnnual } from "./rentMath";
import { lowerQuartile, median, sortNumbers, upperQuartile } from "./statistics";
import type {
  ComparableRent,
  ComparableRentSearchResult,
  RentEstimate,
  RentSearchInput
} from "../types/rent";

export function chooseComparables(
  comparables: ComparableRent[],
  input: RentSearchInput
): ComparableRent[] {
  const exact = comparables.filter(
    (comparable) =>
      comparable.postcodeSector === input.postcodeSector &&
      comparable.propertyType === input.propertyType &&
      comparable.bedrooms === input.bedrooms
  );
  if (exact.length >= appConfig.minComparableCount) {
    return exact.map((comparable) => ({
      ...comparable,
      matchType: "exact",
      matchScore: 1
    }));
  }

  const partial = comparables.filter(
    (comparable) =>
      comparable.propertyType === input.propertyType &&
      comparable.bedrooms === input.bedrooms
  );
  if (partial.length >= appConfig.minComparableCount) {
    return partial.map((comparable) => ({
      ...comparable,
      matchType:
        comparable.postcodeSector === input.postcodeSector ? "exact" : "partial",
      matchScore: comparable.postcodeSector === input.postcodeSector ? 1 : 0.72
    }));
  }

  return comparables
    .filter((comparable) => comparable.bedrooms === input.bedrooms)
    .map((comparable) => ({
      ...comparable,
      matchType:
        comparable.propertyType === input.propertyType ? "partial" : "fallback",
      matchScore: comparable.propertyType === input.propertyType ? 0.62 : 0.42
    }));
}

export function buildRentEstimate(
  input: RentSearchInput,
  searchResult: ComparableRentSearchResult
): RentEstimate {
  const userRentMonthly = normaliseRentToMonthly(input.rentAmount, input.rentPeriod);
  const monthlyRents = sortNumbers(
    searchResult.comparables.map((comparable) => comparable.rentMonthly)
  );

  const medianMonthly = median(monthlyRents);
  const lowerQuartileMonthly = lowerQuartile(monthlyRents);
  const upperQuartileMonthly = upperQuartile(monthlyRents);
  const confidenceScore = calculateConfidenceScore(searchResult);
  const status = classifyRent(
    userRentMonthly,
    medianMonthly,
    upperQuartileMonthly,
    searchResult,
    confidenceScore
  );

  const warnings = [...searchResult.warnings];
  if (searchResult.comparables.length < appConfig.minComparableCount) {
    warnings.push("Fewer than five comparable data points were available.");
  }
  if (searchResult.comparables.some((comparable) => comparable.matchType === "fallback")) {
    warnings.push("Fallback comparables were used because close matches were limited.");
  }

  return {
    userRentMonthly,
    userRentAnnual: monthlyToAnnual(userRentMonthly),
    estimatedMedianMonthly: medianMonthly,
    estimatedLowerQuartileMonthly: lowerQuartileMonthly,
    estimatedUpperQuartileMonthly: upperQuartileMonthly,
    observedMinimumMonthly: monthlyRents[0],
    observedMaximumMonthly: monthlyRents[monthlyRents.length - 1],
    estimatedRangeLabel:
      lowerQuartileMonthly && upperQuartileMonthly
        ? `${formatCurrency(lowerQuartileMonthly)} to ${formatCurrency(upperQuartileMonthly)} per month`
        : "Not enough comparable evidence",
    comparableCount: searchResult.comparables.length,
    status,
    confidence: confidenceBand(confidenceScore),
    confidenceScore,
    warnings,
    methodologyNotes: [
      "Rent values were normalised to monthly amounts before comparison.",
      "The first matching pass uses postcode sector, property type and bedrooms.",
      "The result is based on comparable rental evidence."
    ]
  };
}
