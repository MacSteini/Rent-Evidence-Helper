import { formatEvidenceDate } from "./evidenceDates";
import { formatCurrency } from "./rentMath";
import type { LiveEvidenceQualityLevel } from "../types/liveEvidence";

export function formatOptionalCurrency(value: number | undefined): string {
  return value === undefined ? "Unavailable" : formatCurrency(value);
}

export function formatSignedCurrency(value: number | undefined): string {
  if (value === undefined) return "Unavailable";
  if (value === 0) return formatCurrency(0);
  return `${value > 0 ? "+" : "-"}${formatCurrency(Math.abs(value))}`;
}

export function formatSignedPercent(value: number): string {
  const rounded = Math.abs(value).toFixed(1);
  if (value === 0) return "0.0%";
  return `${value > 0 ? "+" : "-"}${rounded}%`;
}

export function formatCurrencyRange(
  minimum: number | undefined,
  maximum: number | undefined
): string {
  if (minimum === undefined || maximum === undefined) return "Unavailable";
  return `${formatCurrency(minimum)} to ${formatCurrency(maximum)}`;
}

export function formatSpread(value: number | undefined): string {
  if (value === undefined) return "Range spread unavailable";
  return `Range spread is ${value.toFixed(1)}% around the median`;
}

export function formatLiveQualityLabel(value: LiveEvidenceQualityLevel): string {
  if (value === "limited") return "Limited";
  if (value === "useful") return "Useful";
  return "Strong";
}

export function formatRecentRecordQualityLabel(
  value: LiveEvidenceQualityLevel | undefined
): string {
  if (value === "limited") return "Limited";
  if (value === "useful") return "Usable";
  if (value === "strong") return "Broader";
  return "Unavailable";
}

export function formatPropertyTypeLabel(value: string | undefined): string {
  if (!value || value === "unknown") return "Unknown";
  if (value === "house") return "House/Bungalow";
  return capitaliseFirst(value.replace(/-/g, " "));
}

export function formatSearchAreaLabel(value: string): string {
  return value
    .replace(/\bpostcode sector\b/g, "Postcode sector")
    .replace(/\bpostcode district\b/g, "Postcode district")
    .replace(/\boutcode\b/g, "Postcode district");
}

export function formatDistance(value: number | undefined): string {
  if (value === undefined) return "Unknown";
  if (value >= 1000) return `${(value / 1000).toFixed(1)} km`;
  return `${Math.round(value)} m`;
}

export function formatListingDate(value: string | undefined): string {
  return formatEvidenceDate(value);
}

export function formatMonthLong(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(value));
}

export function formatDateLong(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(value));
}

export function capitaliseFirst(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
