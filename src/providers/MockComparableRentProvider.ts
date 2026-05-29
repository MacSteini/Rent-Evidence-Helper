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
    const warnings: string[] = [
      "Fixture mode is active. These are sample comparables, not live market evidence."
    ];

    if (comparables.length < 5) {
      warnings.push("The fixture provider found fewer than five close comparables.");
    }
    if (comparables.some((comparable) => comparable.matchType === "fallback")) {
      warnings.push("The search area or match criteria were broadened in fixture data.");
    }

    return {
      comparables,
      providerName: "Fixture comparable provider",
      searchedAt: new Date().toISOString(),
      searchAreaDescription: input.postcodeSector
        ? `${input.postcodeSector} and nearby fixture sectors`
        : "Fixture sectors",
      radiusMiles: comparables.some((comparable) => comparable.matchType !== "exact")
        ? 3
        : 1,
      warnings,
      errors: []
    };
  }
}
