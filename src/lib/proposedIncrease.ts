import { normaliseRentToMonthly, percentageDifference } from "./rentMath";
import type { RentSearchInput } from "../types/rent";

export type ProposedIncreaseSummary = {
  currentRentMonthly: number;
  proposedRentMonthly: number;
  increaseMonthly: number;
  increasePercent: number;
  increaseYearly: number;
};

export function isRentIncreaseContext(input: RentSearchInput): boolean {
  return input.tenancyContext !== "current-rent-only";
}

export function calculateProposedIncrease(
  input: RentSearchInput
): ProposedIncreaseSummary | undefined {
  if (!isRentIncreaseContext(input)) return undefined;
  if (
    !Number.isFinite(input.currentRentBeforeIncrease) ||
    input.currentRentBeforeIncrease === undefined ||
    input.currentRentBeforeIncrease <= 0 ||
    !Number.isFinite(input.rentAmount) ||
    input.rentAmount <= input.currentRentBeforeIncrease
  ) {
    return undefined;
  }

  const currentRentMonthly = normaliseRentToMonthly(
    input.currentRentBeforeIncrease,
    input.rentPeriod
  );
  const proposedRentMonthly = normaliseRentToMonthly(
    input.rentAmount,
    input.rentPeriod
  );
  const increaseMonthly = proposedRentMonthly - currentRentMonthly;

  if (increaseMonthly <= 0) return undefined;

  return {
    currentRentMonthly,
    proposedRentMonthly,
    increaseMonthly,
    increasePercent: percentageDifference(
      proposedRentMonthly,
      currentRentMonthly
    ),
    increaseYearly: increaseMonthly * 12
  };
}
