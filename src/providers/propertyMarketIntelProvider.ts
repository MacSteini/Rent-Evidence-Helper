import { median, sortNumbers } from "../lib/statistics";
import { parseEvidenceDate } from "../lib/evidenceDates";
import { parsePostcode } from "../lib/postcode";
import type {
  DeeperComparableEvidenceResult,
  DeeperComparableRent,
  LiveEvidenceFailureCode,
  LiveRentalEvidenceResult,
  LiveRentalListing
} from "../types/liveEvidence";
import type { PropertyType, RentSearchInput } from "../types/rent";

const baseUrl = "https://api.propertymarketintel.com/v1";
const providerName = "Property Market Intel";
const perPage = 10;
const recentComparableMonths = 12;

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

type PmiComparableRow = {
  uprn?: unknown;
  address?: unknown;
  postcode?: unknown;
  price?: unknown;
  date?: unknown;
  bedrooms?: unknown;
  property_type?: unknown;
  distance_m?: unknown;
  url?: unknown;
};

type PmiComparablesResponse = {
  total_count?: unknown;
  count?: unknown;
  comparables?: unknown;
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

export type PmiComparableDateWindow = {
  start: string;
  end: string;
};

export function buildPmiComparableDateWindow(
  now: Date = new Date()
): PmiComparableDateWindow {
  const safeNow = Number.isNaN(now.getTime()) ? new Date() : now;
  const end = new Date(
    Date.UTC(safeNow.getUTCFullYear(), safeNow.getUTCMonth(), safeNow.getUTCDate())
  );
  const start = new Date(end);
  start.setUTCMonth(start.getUTCMonth() - recentComparableMonths);

  return {
    start: formatDateParam(start),
    end: formatDateParam(end)
  };
}

export function buildPmiComparablesUrl(
  input: RentSearchInput,
  now: Date = new Date()
): URL {
  const postcodeSector = getSearchPostcodeSector(input);
  if (!postcodeSector) {
    throw new PmiEvidenceError(
      "malformed-response",
      "A valid postcode sector is required for the recent rented-record check."
    );
  }

  const url = new URL(`${baseUrl}/prices/comparables`);
  const dateWindow = buildPmiComparableDateWindow(now);
  url.searchParams.set("type", "rented");
  url.searchParams.set("postcode", postcodeSector);
  url.searchParams.set("bedrooms", String(input.bedrooms));
  url.searchParams.set("per_page", String(perPage));
  url.searchParams.set("min_date", dateWindow.start);
  url.searchParams.set("max_date", dateWindow.end);

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

export async function searchPmiDeeperComparables(
  input: RentSearchInput,
  apiKey: string,
  fetchImpl: FetchLike = fetch
): Promise<DeeperComparableEvidenceResult> {
  const trimmedKey = normalisePmiApiKey(apiKey);
  if (!trimmedKey) {
    throw new PmiEvidenceError("missing-key", "Enter a Property Market Intel API key.");
  }

  let response: Response;
  try {
    const requestedAt = new Date();
    response = await fetchImpl(buildPmiComparablesUrl(input, requestedAt), {
      headers: {
        Authorization: `Bearer ${trimmedKey}`,
        Accept: "application/json"
      }
    });
  } catch {
    throw new PmiEvidenceError(
      "network-or-cors",
      "The recent rented-record request could not reach Property Market Intel."
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
        ? `Property Market Intel could not return recent rented-record evidence: ${providerMessage}`
        : "Property Market Intel could not return recent rented-record evidence."
    );
  }

  const value = await response.json();
  return normalisePmiComparablesResponse(value, input, new Date().toISOString());
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
        : "PMI returned no current live rental listings for this outcode. This does not rule out older rented records or official benchmark evidence."
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

export function normalisePmiComparablesResponse(
  value: unknown,
  input: RentSearchInput,
  searchedAt: string
): DeeperComparableEvidenceResult {
  if (!isObject(value)) {
    throw new PmiEvidenceError("malformed-response", "PMI response was not an object.");
  }

  const response = value as PmiComparablesResponse;
  if (!Array.isArray(response.comparables)) {
    throw new PmiEvidenceError(
      "malformed-response",
      "PMI response did not include a comparables array."
    );
  }

  const postcodeSector = getSearchPostcodeSector(input);
  const dateWindow = buildPmiComparableDateWindow(new Date(searchedAt));
  const comparables = response.comparables
    .map((comparable, index) =>
      normaliseComparable(comparable, input, searchedAt, postcodeSector, index)
    )
    .filter((comparable): comparable is DeeperComparableRent => comparable !== null)
    .filter((comparable) =>
      isComparableInsideDateWindow(comparable, dateWindow)
    );

  if (comparables.length === 0) {
    const returnedCount = response.comparables.length;
    const recentOnlyMessage =
      "Older PMI records may still exist, but this tool does not include records outside the last 12 months. Use the ONS benchmark and evidence you collect yourself.";
    throw new PmiEvidenceError(
      "no-listings",
      returnedCount > 0
        ? `PMI returned records, but none within the last 12 months for this postcode sector. ${recentOnlyMessage}`
        : `Property Market Intel returned no recent rented records for this postcode sector in the last 12 months. ${recentOnlyMessage}`
    );
  }

  const rents = sortNumbers(comparables.map((comparable) => comparable.rentMonthly));
  const totalCount =
    typeof response.total_count === "number" && Number.isFinite(response.total_count)
      ? response.total_count
      : typeof response.count === "number" && Number.isFinite(response.count)
        ? response.count
        : comparables.length;

  return {
    evidenceKind: "licensed-comparables",
    recordKind: "historical-rented-records",
    provider: "property-market-intel",
    searchedAt,
    searchAreaDescription: postcodeSector
      ? `${postcodeSector} postcode sector`
      : "selected postcode sector",
    dateWindowStart: dateWindow.start,
    dateWindowEnd: dateWindow.end,
    totalCount,
    displayedCount: comparables.length,
    medianMonthly: median(rents),
    minimumMonthly: rents[0],
    maximumMonthly: rents[rents.length - 1],
    comparables,
    warnings: [
      "Property Market Intel recent rented records are historical rented-record context, not current live listings or a market-rent decision.",
      "The recent rented-record check may cost 5 PMI credits each time it is run."
    ]
  };
}

function getSearchOutcode(input: RentSearchInput): string {
  return parsePostcode(input.postcode)?.outwardCode ?? input.postcode.trim().toUpperCase();
}

function getSearchPostcodeSector(input: RentSearchInput): string | undefined {
  return parsePostcode(input.postcode)?.sector;
}

export function liveEvidenceErrorMessage(error: unknown): string {
  if (error instanceof PmiEvidenceError) return error.message;
  return "Live listing evidence is unavailable. The ONS benchmark still applies.";
}

export function deeperComparableErrorMessage(error: unknown): string {
  if (error instanceof PmiEvidenceError) return error.message;
  return "Recent rented-record evidence is unavailable. The ONS benchmark still applies.";
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

function normaliseComparable(
  value: unknown,
  input: RentSearchInput,
  searchedAt: string,
  fallbackPostcodeSector: string | undefined,
  index: number
): DeeperComparableRent | null {
  if (!isObject(value)) return null;
  const row = value as PmiComparableRow;
  const rentAmount = toPositiveNumber(row.price);
  if (!rentAmount) return null;

  const postcodeSector =
    typeof row.postcode === "string"
      ? parsePostcode(row.postcode)?.sector
      : fallbackPostcodeSector;

  return {
    id: `pmi-comparable-${index + 1}`,
    sourceName: providerName,
    sourceType: "licensed-dataset",
    observedAt: searchedAt,
    postcodeSector,
    rentAmount,
    rentPeriod: "month",
    rentMonthly: rentAmount,
    bedrooms: toFiniteNumber(row.bedrooms),
    propertyType: mapPmiPropertyType(row.property_type) ?? input.propertyType,
    evidenceDate: firstString(row.date),
    distanceMeters: toFiniteNumber(row.distance_m)
  };
}

function isComparableInsideDateWindow(
  comparable: DeeperComparableRent,
  dateWindow: PmiComparableDateWindow
): boolean {
  const parsed = parseEvidenceDate(comparable.evidenceDate);
  if (!parsed) return false;

  const start = parseEvidenceDate(dateWindow.start);
  const end = parseEvidenceDate(dateWindow.end);
  if (!start || !end) return false;

  return (
    parsed.date.getTime() >= start.date.getTime() &&
    parsed.date.getTime() <= end.date.getTime()
  );
}

function formatDateParam(date: Date): string {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0")
  ].join("-");
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
