import { chooseComparables } from "../lib/comparables";
import { fixtureComparables } from "./fixtureComparables";
import type { ComparableRentProvider } from "./ComparableRentProvider";
import type {
  ComparableRentSearchResult,
  RentSearchInput
} from "../types/rent";

export class MockComparableRentProvider implements ComparableRentProvider {
  async searchComparables(input: RentSearchInput): Promise<ComparableRentSearchResult> {
    const comparables = chooseComparables(fixtureComparables, input);
    const warnings: string[] = [];

    if (comparables.length < 5) {
      warnings.push("Fewer than five close comparables were found.");
    }
    if (comparables.some((comparable) => comparable.matchType === "fallback")) {
      warnings.push("The search area or match criteria were broadened.");
    }

    return {
      comparables,
      providerName: "Comparable rent provider",
      searchedAt: new Date().toISOString(),
      searchAreaDescription: input.postcodeSector
        ? `${input.postcodeSector} and nearby sectors`
        : "Nearby sectors",
      radiusMiles: comparables.some((comparable) => comparable.matchType !== "exact")
        ? 3
        : 1,
      warnings,
      errors: []
    };
  }
}
