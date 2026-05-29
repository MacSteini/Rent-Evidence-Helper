import { formatCurrency } from "./rentMath";
import type { RentEstimate, RentSearchInput } from "../types/rent";

export function buildLandlordMessage(
  input: RentSearchInput,
  estimate: RentEstimate
): string {
  const rentLabel = `${formatCurrency(input.rentAmount)} per ${input.rentPeriod}`;
  const area = input.postcodeSector
    ? `postcode sector ${input.postcodeSector}`
    : "my local area";

  if (input.tenancyContext === "current-rent-only") {
    return `Dear Landlord/Agent,

I am writing about the current rent of ${rentLabel}.

I have been looking at comparable rental evidence for similar properties in ${area}. The evidence I have seen suggests it may be helpful to review how the rent compares with the local market.

Please could you share any evidence you used when setting or reviewing the rent?

I would like to resolve this informally if possible.

Kind regards,`;
  }

  return `Dear Landlord/Agent,

I am writing about the proposed rent of ${rentLabel}.

Based on comparable rental evidence for similar properties in ${area}, this proposed rent appears to need further explanation. The current estimate is ${estimate.estimatedRangeLabel}, with ${estimate.comparableCount} comparable data points in the sample.

Please could you provide the evidence you used to calculate the proposed rent?

I would like to resolve this informally if possible. If the proposed rent remains above market evidence, I may consider checking whether the First-tier Tribunal process applies.

Kind regards,`;
}
