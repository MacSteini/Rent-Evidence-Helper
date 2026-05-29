import { formatCurrency } from "./rentMath";
import type { OfficialBenchmarkComparison } from "../types/officialRentBenchmark";
import type { RentSearchInput } from "../types/rent";

export function buildLandlordMessage(
  input: RentSearchInput,
  comparison: OfficialBenchmarkComparison
): string {
  const rentLabel = `${formatCurrency(input.rentAmount)} per ${input.rentPeriod}`;
  const postcode = input.postcode.trim().toUpperCase();
  const benchmarkLabel = comparison.selection.label;
  const benchmarkRent = formatCurrency(comparison.selection.monthlyRent);
  const userMonthlyRent = formatCurrency(comparison.userRentMonthly);
  const difference = formatSignedCurrency(comparison.differenceMonthly);
  const percentageDifference = formatSignedPercent(comparison.percentageDifference);

  if (input.tenancyContext === "current-rent-only") {
    return `Dear Landlord/Landlady/Agent,

I am writing about the current rent of ${rentLabel}.

I have checked the ONS monthly private rent estimate for ${comparison.benchmark.areaName}. For ${benchmarkLabel}, the official area benchmark is ${benchmarkRent} per month. The rent I entered for postcode ${postcode} is ${userMonthlyRent} per month, which is ${difference} (${percentageDifference}) compared with that benchmark.

I understand this is area-level evidence, not individual rental listings, a tribunal decision or legal advice.

Please could you share any evidence you used when setting or reviewing the rent?

I would like to resolve this informally if possible.

Kind regards,`;
  }

  return `Dear Landlord/Landlady/Agent,

I am writing about the proposed rent of ${rentLabel}.

I have checked the ONS monthly private rent estimate for ${comparison.benchmark.areaName}. For ${benchmarkLabel}, the official area benchmark is ${benchmarkRent} per month. The rent I entered for postcode ${postcode} is ${userMonthlyRent} per month, which is ${difference} (${percentageDifference}) compared with that benchmark.

I understand this is area-level evidence, not individual rental listings, a tribunal decision or legal advice.

Please could you provide the evidence you used to calculate the proposed rent?

I would like to resolve this informally if possible. If the proposed rent remains above market evidence, I may consider checking whether the First-tier Tribunal process applies.

Kind regards,`;
}

function formatSignedCurrency(value: number): string {
  if (value === 0) return formatCurrency(0);
  return `${value > 0 ? "+" : "-"}${formatCurrency(Math.abs(value))}`;
}

function formatSignedPercent(value: number): string {
  const rounded = Math.abs(value).toFixed(1);
  if (value === 0) return "0.0%";
  return `${value > 0 ? "+" : "-"}${rounded}%`;
}
