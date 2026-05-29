import { appConfig } from "../config/appConfig";
import type {
  ComparableRent,
  ConfidenceLevel,
  ComparableRentSearchResult
} from "../types/rent";

export function scoreComparableMatch(comparable: ComparableRent): number {
  if (typeof comparable.matchScore === "number") {
    return comparable.matchScore;
  }
  if (comparable.matchType === "exact") return 1;
  if (comparable.matchType === "partial") return 0.72;
  return 0.45;
}

export function calculateConfidenceScore(
  searchResult: ComparableRentSearchResult
): number {
  const comparables = searchResult.comparables;
  if (comparables.length === 0) return 0;

  const sampleScore = Math.min(comparables.length / 10, 1);
  const matchScore =
    comparables.reduce((sum, comparable) => sum + scoreComparableMatch(comparable), 0) /
    comparables.length;
  const warningPenalty = Math.min(searchResult.warnings.length * 0.08, 0.25);
  const errorPenalty = searchResult.errors.length > 0 ? 0.25 : 0;
  const freshnessScore = comparables.some((comparable) =>
    isComparableStale(comparable.observedAt)
  )
    ? 0.75
    : 1;

  return Math.max(
    0,
    Math.min(
      1,
      sampleScore * 0.4 + matchScore * 0.4 + freshnessScore * 0.2 - warningPenalty - errorPenalty
    )
  );
}

export function confidenceBand(score: number): ConfidenceLevel {
  if (score >= 0.72) return "high";
  if (score >= 0.48) return "medium";
  return "low";
}

export function isComparableStale(observedAt: string): boolean {
  const observedTime = Date.parse(observedAt);
  if (Number.isNaN(observedTime)) return true;
  const ageDays = (Date.now() - observedTime) / 86_400_000;
  return ageDays > appConfig.freshnessDays;
}
