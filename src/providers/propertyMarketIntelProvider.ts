import { median, sortNumbers } from "../lib/statistics";
import { parsePostcode } from "../lib/postcode";
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
  price_pcm?: unknown;
  bedrooms?: unknown;
  property_type?: unknown;
  listed_date?: unknown;
  date_crawled?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
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
  url.searchParams.set("type", "lettings");
  url.searchParams.set("outcode", getSearchOutcode(input));
  url.searchParams.set("bedrooms", String(input.bedrooms));
  url.searchParams.set("sort", "distance");
  url.searchParams.set("per_page", String(perPage));

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
    const returnedCount = response.listings.length;
    throw new PmiEvidenceError(
      "no-listings",
      returnedCount > 0
        ? `Property Market Intel returned ${returnedCount} listing records, but none included a usable monthly asking rent.`
        : "Property Market Intel returned no rental listings for this outcode search."
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
    searchAreaDescription: `${getSearchOutcode(input)} outcode`,
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

function getSearchOutcode(input: RentSearchInput): string {
  return parsePostcode(input.postcode)?.outwardCode ?? input.postcode.trim().toUpperCase();
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
  const rentAmount = toPositiveNumber(row.price_pcm) ?? toPositiveNumber(row.price);
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
    listedDate: firstString(row.listed_date, row.date_crawled, row.created_at, row.updated_at),
    distanceMeters: toFiniteNumber(row.distance_m)
  };
}

function mapPmiPropertyType(value: unknown): PropertyType | undefined {
  if (typeof value !== "string") return undefined;
  const normalised = value.trim().toLowerCase();
  if (normalised === "f") return "flat";
  if (normalised === "s") return "studio";
  if (normalised === "r") return "room";
  if (normalised === "h" || normalised === "d" || normalised === "t") return "house";
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

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim() !== "") return value;
  }
  return undefined;
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
