import type { RentPeriod } from "../types/rent";

export function normaliseRentToMonthly(
  rentAmount: number,
  rentPeriod: RentPeriod
): number {
  if (!Number.isFinite(rentAmount) || rentAmount <= 0) {
    throw new Error("Rent amount must be greater than zero.");
  }

  if (rentPeriod === "week") {
    return (rentAmount * 52) / 12;
  }

  if (rentPeriod === "year") {
    return rentAmount / 12;
  }

  return rentAmount;
}

export function formatCurrency(value: number): string {
  const hasPence = !Number.isInteger(value);

  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: hasPence ? 2 : 0,
    maximumFractionDigits: 2
  }).format(value);
}

export function percentageDifference(value: number, baseline: number): number {
  if (baseline <= 0) return 0;
  return ((value - baseline) / baseline) * 100;
}
