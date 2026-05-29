import type {
  ComparableRentSearchResult,
  RentSearchInput
} from "../types/rent";

export interface ComparableRentProvider {
  searchComparables(input: RentSearchInput): Promise<ComparableRentSearchResult>;
}
