import { median, sortNumbers } from "../lib/statistics";
import { normalisePostcode, parsePostcode } from "../lib/postcode";
import type {
  LiveEvidenceFailureCode,
  LiveRentalEvidenceResult,
  LiveRentalListing
} from "../types/liveEvidence";
import type { PropertyType, RentSearchInput } from "../types/rent";

const baseUrl = "https://api.propertymarketintel.com/v1";
const providerName = "Property Market Intel";
const perPage = 10;

type FetchLike = typeof fetch;

type PmiListingRow = {
  uprn?: unknown;
  address?: unknown;
  postcode?: unknown;
  price?: unknown;
  bedrooms?: unknown;
  property_type?: unknown;
  listed_date?: unknown;
  distance_m?: unknown;
  url?: unknown;
};

type PmiListingsResponse = {
  total_count?: unknown;
  listings?: unknown;
};

export class PmiEvidenceError extends Error {
  constructor(
    public readonly code: LiveEvidenceFailureCode,
    message: string
  ) {
    super(message);
    this.name = "PmiEvidenceError";
  }
}

export function buildPmiListingsUrl(input: RentSearchInput): URL {
  const url = new URL(`${baseUrl}/listings`);
  url.searchParams.set("type", "rent");
  url.searchParams.set("postcode", normalisePostcode(input.postcode));
  url.searchParams.set("bedrooms", String(input.bedrooms));
  url.searchParams.set("sort", "distance");
  url.searchParams.set("per_page", String(perPage));

  const propertyType = mapPropertyTypeToPmi(input.propertyType);
  if (propertyType) {
    url.searchParams.set("property_type", propertyType);
  }

  return url;
}

export async function searchPmiLiveRentalListings(
  input: RentSearchInput,
  apiKey: string,
  fetchImpl: FetchLike = fetch
): Promise<LiveRentalEvidenceResult> {
  const trimmedKey = normalisePmiApiKey(apiKey);
  if (!trimmedKey) {
    throw new PmiEvidenceError("missing-key", "Enter a Property Market Intel API key.");
  }

  let response: Response;
  try {
    response = await fetchImpl(buildPmiListingsUrl(input), {
      headers: {
        Authorization: `Bearer ${trimmedKey}`,
        Accept: "application/json"
      }
    });
  } catch {
    throw new PmiEvidenceError(
      "network-or-cors",
      "The live listing request could not reach Property Market Intel."
    );
  }

  if (response.status === 401 || response.status === 403) {
    const providerMessage = await readProviderErrorMessage(response);
    throw new PmiEvidenceError(
      "invalid-key",
      providerMessage
        ? `Property Market Intel rejected the API key: ${providerMessage}`
        : "The Property Market Intel API key was rejected."
    );
  }

  if (response.status === 402 || response.status === 429) {
    const providerMessage = await readProviderErrorMessage(response);
    throw new PmiEvidenceError(
      "quota-or-rate-limit",
      providerMessage
        ? `Property Market Intel quota or rate limit: ${providerMessage}`
        : "The Property Market Intel key has reached its quota or rate limit."
    );
  }

  if (!response.ok) {
    const providerMessage = await readProviderErrorMessage(response);
    throw new PmiEvidenceError(
      "network-or-cors",
      providerMessage
        ? `Property Market Intel could not return live listing evidence: ${providerMessage}`
        : "Property Market Intel could not return live listing evidence."
    );
  }

  const value = await response.json();
  return normalisePmiListingsResponse(value, input, new Date().toISOString());
}

export function normalisePmiApiKey(value: string): string {
  return value
    .trim()
    .replace(/^-H\s+/i, "")
    .replace(/^["']|["']$/g, "")
    .trim()
    .replace(/^authorization\s*:\s*/i, "")
    .replace(/^bearer\s+/i, "")
    .trim();
}

async function readProviderErrorMessage(response: Response): Promise<string | null> {
  try {
    const value = (await response.clone().json()) as unknown;
    if (!isObject(value)) return null;
    const title = typeof value.title === "string" ? value.title.trim() : "";
    const detail = typeof value.detail === "string" ? value.detail.trim() : "";
    return [title, detail].filter(Boolean).join(" - ") || null;
  } catch {
    return null;
  }
}

export function normalisePmiListingsResponse(
  value: unknown,
  input: RentSearchInput,
  searchedAt: string
): LiveRentalEvidenceResult {
  if (!isObject(value)) {
    throw new PmiEvidenceError("malformed-response", "PMI response was not an object.");
  }

  const response = value as PmiListingsResponse;
  if (!Array.isArray(response.listings)) {
    throw new PmiEvidenceError(
      "malformed-response",
      "PMI response did not include a listings array."
    );
  }

  const listings = response.listings
    .map((listing, index) => normaliseListing(listing, input, searchedAt, index))
    .filter((listing): listing is LiveRentalListing => listing !== null);

  if (listings.length === 0) {
    throw new PmiEvidenceError(
      "no-listings",
      "Property Market Intel returned no usable rental listings for this search."
    );
  }

  const rents = sortNumbers(listings.map((listing) => listing.rentMonthly));
  const totalCount =
    typeof response.total_count === "number" && Number.isFinite(response.total_count)
      ? response.total_count
      : listings.length;

  return {
    evidenceKind: "licensed-live",
    provider: "property-market-intel",
    searchedAt,
    searchAreaDescription: normalisePostcode(input.postcode),
    totalCount,
    displayedCount: listings.length,
    medianMonthly: median(rents),
    minimumMonthly: rents[0],
    maximumMonthly: rents[rents.length - 1],
    listings,
    warnings: [
      "Property Market Intel listing prices are treated as live asking rents, not achieved rents."
    ]
  };
}

export function liveEvidenceErrorMessage(error: unknown): string {
  if (error instanceof PmiEvidenceError) return error.message;
  return "Live listing evidence is unavailable. The ONS benchmark still applies.";
}

function normaliseListing(
  value: unknown,
  input: RentSearchInput,
  searchedAt: string,
  index: number
): LiveRentalListing | null {
  if (!isObject(value)) return null;
  const row = value as PmiListingRow;
  const rentAmount = toPositiveNumber(row.price);
  if (!rentAmount) return null;

  const postcodeSector =
    typeof row.postcode === "string"
      ? parsePostcode(row.postcode)?.sector
      : undefined;

  return {
    id: `pmi-listing-${index + 1}`,
    sourceName: providerName,
    sourceType: "licensed-dataset",
    sourceUrl: typeof row.url === "string" ? row.url : undefined,
    observedAt: searchedAt,
    postcodeSector,
    rentAmount,
    rentPeriod: "month",
    rentMonthly: rentAmount,
    bedrooms: toFiniteNumber(row.bedrooms),
    propertyType: mapPmiPropertyType(row.property_type) ?? input.propertyType,
    listedDate: typeof row.listed_date === "string" ? row.listed_date : undefined,
    distanceMeters: toFiniteNumber(row.distance_m)
  };
}

function mapPropertyTypeToPmi(propertyType: PropertyType): string | null {
  if (
    propertyType === "flat" ||
    propertyType === "maisonette" ||
    propertyType === "studio"
  ) {
    return "Flat";
  }

  return null;
}

function mapPmiPropertyType(value: unknown): PropertyType | undefined {
  if (typeof value !== "string") return undefined;
  const normalised = value.trim().toLowerCase();
  if (normalised.includes("flat") || normalised.includes("apartment")) return "flat";
  if (normalised.includes("maisonette")) return "maisonette";
  if (normalised.includes("studio")) return "studio";
  if (normalised.includes("room")) return "room";
  if (
    normalised.includes("terrace") ||
    normalised.includes("detached") ||
    normalised.includes("bungalow") ||
    normalised.includes("house")
  ) {
    return "house";
  }
  return "other";
}

function toPositiveNumber(value: unknown): number | null {
  const numberValue = toFiniteNumber(value);
  return numberValue && numberValue > 0 ? numberValue : null;
}

function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
