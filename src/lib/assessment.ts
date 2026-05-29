import { parsePostcode } from "./postcode";
import type {
  ComparableRentProvider
} from "../providers/ComparableRentProvider";
import { buildRentEstimate } from "./comparables";
import type {
  ComparableRentSearchResult,
  RentEstimate,
  RentSearchInput
} from "../types/rent";

export type AssessmentResult = {
  input: RentSearchInput;
  searchResult: ComparableRentSearchResult;
  estimate: RentEstimate;
};

export async function assessRent(
  rawInput: RentSearchInput,
  provider: ComparableRentProvider
): Promise<AssessmentResult> {
  const postcode = parsePostcode(rawInput.postcode);
  if (!postcode) {
    throw new Error("Enter a valid UK postcode.");
  }

  const input: RentSearchInput = {
    ...rawInput,
    postcode: postcode.normalised,
    postcodeSector: postcode.sector
  };
  const searchResult = await provider.searchComparables(input);
  const estimate = buildRentEstimate(input, searchResult);

  return { input, searchResult, estimate };
}
