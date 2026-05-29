import { normaliseRentToMonthly } from "../lib/rentMath";
import type { ComparableRent } from "../types/rent";

function fixture(
  id: string,
  postcodeSector: string,
  propertyType: ComparableRent["propertyType"],
  bedrooms: number,
  rentAmount: number,
  observedAt = "2026-03-15"
): ComparableRent {
  return {
    id,
    sourceName: "Fixture comparable data",
    sourceType: "fixture",
    observedAt,
    postcodeSector,
    propertyType,
    bedrooms,
    furnished: "unknown",
    billsIncluded: "unknown",
    rentAmount,
    rentPeriod: "month",
    rentMonthly: normaliseRentToMonthly(rentAmount, "month"),
    description: `${bedrooms}-bed ${propertyType} in ${postcodeSector}`
  };
}

export const fixtureComparables: ComparableRent[] = [
  fixture("sw12-flat-2-1", "SW12 8", "flat", 2, 1850),
  fixture("sw12-flat-2-2", "SW12 8", "flat", 2, 1950),
  fixture("sw12-flat-2-3", "SW12 8", "flat", 2, 2050),
  fixture("sw12-flat-2-4", "SW12 8", "flat", 2, 2125),
  fixture("sw12-flat-2-5", "SW12 8", "flat", 2, 2200),
  fixture("sw12-flat-2-6", "SW12 9", "flat", 2, 2250),
  fixture("sw12-house-3-1", "SW12 8", "house", 3, 2800),
  fixture("sw12-house-3-2", "SW12 8", "house", 3, 2950),
  fixture("sw12-house-3-3", "SW12 9", "house", 3, 3100),
  fixture("sw12-house-3-4", "SW12 9", "house", 3, 3250),
  fixture("sw12-house-3-5", "SW12 7", "house", 3, 3350),
  fixture("m1-flat-1-1", "M1 4", "flat", 1, 1050),
  fixture("m1-flat-1-2", "M1 4", "flat", 1, 1100),
  fixture("m1-flat-1-3", "M1 4", "flat", 1, 1150),
  fixture("m1-flat-1-4", "M1 3", "flat", 1, 1200),
  fixture("m1-flat-1-5", "M1 3", "flat", 1, 1280),
  fixture("bs1-studio-0-1", "BS1 5", "studio", 0, 925),
  fixture("bs1-studio-0-2", "BS1 5", "studio", 0, 980),
  fixture("bs1-studio-0-3", "BS1 6", "studio", 0, 1025),
  fixture("bs1-studio-0-4", "BS1 6", "studio", 0, 1080),
  fixture("bs1-studio-0-5", "BS1 4", "studio", 0, 1125),
  fixture("e1-room-1-1", "E1 6", "room", 1, 850),
  fixture("e1-room-1-2", "E1 6", "room", 1, 925),
  fixture("e1-room-1-3", "E1 7", "room", 1, 975),
  fixture("e1-room-1-4", "E1 7", "room", 1, 1050),
  fixture("e1-room-1-5", "E1 8", "room", 1, 1100),
  fixture("old-low-confidence", "NE1 1", "flat", 2, 900, "2021-04-01")
];
