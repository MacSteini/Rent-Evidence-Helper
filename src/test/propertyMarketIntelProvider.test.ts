import { describe, expect, it, vi } from "vitest";
import {
  buildPmiListingsUrl,
  normalisePmiApiKey,
  normalisePmiListingsResponse,
  PmiEvidenceError,
  searchPmiLiveRentalListings
} from "../providers/propertyMarketIntelProvider";
import type { RentSearchInput } from "../types/rent";

const input: RentSearchInput = {
  postcode: "SW12 8AA",
  localAuthorityCode: "E09000022",
  rentAmount: 2450,
  rentPeriod: "month",
  propertyType: "flat",
  bedrooms: 2,
  bathrooms: 1,
  tenancyContext: "current-rent-only"
};

const pmiResponse = {
  total_count: 2,
  listings: [
    {
      uprn: "secret-uprn",
      address: "1 Private Street",
      postcode: "SW12 8AA",
      price: 2400,
      bedrooms: 2,
      property_type: "Flat",
      listed_date: "2026-05-01",
      distance_m: 123,
      url: "https://provider.example/listing/1"
    },
    {
      uprn: "another-secret-uprn",
      address: "2 Private Street",
      postcode: "SW12 8AB",
      price: 2600,
      bedrooms: "2",
      property_type: "Flat",
      listed_date: "2026-05-02",
      distance_m: "456",
      url: "https://provider.example/listing/2"
    }
  ]
};

describe("Property Market Intel provider", () => {
  it("builds a credit-saving rental listings request", () => {
    const url = buildPmiListingsUrl(input);

    expect(url.pathname).toBe("/v1/listings");
    expect(url.searchParams.get("type")).toBe("rent");
    expect(url.searchParams.get("postcode")).toBe("SW12 8AA");
    expect(url.searchParams.get("bedrooms")).toBe("2");
    expect(url.searchParams.get("property_type")).toBe("Flat");
    expect(url.searchParams.get("sort")).toBe("distance");
    expect(url.searchParams.get("per_page")).toBe("10");
    expect(url.searchParams.has("uprn")).toBe(false);
  });

  it("omits unsupported property type params", () => {
    const url = buildPmiListingsUrl({ ...input, propertyType: "house" });

    expect(url.searchParams.has("property_type")).toBe(false);
  });

  it("normalises listings without exposing exact address or UPRN", () => {
    const evidence = normalisePmiListingsResponse(
      pmiResponse,
      input,
      "2026-05-29T00:00:00Z"
    );

    expect(evidence.evidenceKind).toBe("licensed-live");
    expect(evidence.provider).toBe("property-market-intel");
    expect(evidence.displayedCount).toBe(2);
    expect(evidence.medianMonthly).toBe(2500);
    expect(evidence.listings[0]).toMatchObject({
      postcodeSector: "SW12 8",
      rentMonthly: 2400,
      bedrooms: 2,
      propertyType: "flat",
      sourceUrl: "https://provider.example/listing/1"
    });
    expect(JSON.stringify(evidence)).not.toContain("Private Street");
    expect(JSON.stringify(evidence)).not.toContain("secret-uprn");
  });

  it("maps API auth, quota and empty-result failures", async () => {
    await expect(searchPmiLiveRentalListings(input, "")).rejects.toMatchObject({
      code: "missing-key"
    });

    await expect(
      searchPmiLiveRentalListings(input, "bad-key", responseFetch(401, {}))
    ).rejects.toMatchObject({ code: "invalid-key" });

    await expect(
      searchPmiLiveRentalListings(input, "rate-limited", responseFetch(429, {}))
    ).rejects.toMatchObject({ code: "quota-or-rate-limit" });

    await expect(() =>
      normalisePmiListingsResponse({ total_count: 0, listings: [] }, input, "now")
    ).toThrow(PmiEvidenceError);
  });

  it("accepts a raw key, bearer value or copied authorization header", () => {
    expect(normalisePmiApiKey(" pmi_live_test ")).toBe("pmi_live_test");
    expect(normalisePmiApiKey("Bearer pmi_live_test")).toBe("pmi_live_test");
    expect(normalisePmiApiKey("Authorization: Bearer pmi_live_test")).toBe(
      "pmi_live_test"
    );
    expect(normalisePmiApiKey('"Bearer pmi_live_test"')).toBe("pmi_live_test");
  });

  it("calls PMI with a bearer token and accepts a valid response", async () => {
    const fetchMock = responseFetch(200, pmiResponse);

    const evidence = await searchPmiLiveRentalListings(
      input,
      "pmi_live_test",
      fetchMock
    );

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(URL),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer pmi_live_test"
        })
      })
    );
    expect(evidence.displayedCount).toBe(2);
  });
});

function responseFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" }
    })
  );
}
