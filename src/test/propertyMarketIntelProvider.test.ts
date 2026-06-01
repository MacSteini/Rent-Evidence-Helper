import { describe, expect, it, vi } from "vitest";
import {
  buildPmiComparableDateWindow,
  buildPmiComparablesUrl,
  buildPmiListingsUrl,
  normalisePmiApiKey,
  normalisePmiComparablesResponse,
  normalisePmiListingsResponse,
  PmiEvidenceError,
  searchPmiDeeperComparables,
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

const pmiComparablesResponse = {
  total_count: 2,
  count: 2,
  comparables: [
    {
      uprn: "secret-comparable-uprn",
      address: "10 Hidden Comparable Street",
      postcode: "SW12 8AA",
      price: 2300,
      date: "2026-04-01",
      bedrooms: 2,
      property_type: "Flat",
      distance_m: 180
    },
    {
      uprn: "secret-comparable-uprn-2",
      address: "11 Hidden Comparable Street",
      postcode: "SW12 8AB",
      price: "2500",
      date: "2026-03-01",
      bedrooms: "2",
      property_type: "f",
      distance_m: "270"
    }
  ]
};

describe("Property Market Intel provider", () => {
  it("builds a credit-saving rental listings request", () => {
    const url = buildPmiListingsUrl(input);

    expect(url.origin).toBe("https://api.propertymarketintel.com");
    expect(url.pathname).toBe("/v1/listings");
    expect(url.searchParams.get("type")).toBe("lettings");
    expect(url.searchParams.get("outcode")).toBe("SW12");
    expect(url.searchParams.has("postcode")).toBe(false);
    expect(url.searchParams.get("bedrooms")).toBe("2");
    expect(url.searchParams.has("property_type")).toBe(false);
    expect(url.searchParams.get("sort")).toBe("distance");
    expect(url.searchParams.get("per_page")).toBe("10");
    expect(url.searchParams.has("uprn")).toBe(false);
  });

  it("does not send a property type filter that can over-narrow PMI listings", () => {
    const url = buildPmiListingsUrl({ ...input, propertyType: "house" });

    expect(url.searchParams.has("property_type")).toBe(false);
  });

  it("builds a deeper comparable request using postcode sector only", () => {
    const url = buildPmiComparablesUrl(input, new Date("2026-05-30T00:00:00Z"));

    expect(url.origin).toBe("https://api.propertymarketintel.com");
    expect(url.pathname).toBe("/v1/prices/comparables");
    expect(url.searchParams.get("type")).toBe("rented");
    expect(url.searchParams.get("postcode")).toBe("SW12 8");
    expect(url.searchParams.get("bedrooms")).toBe("2");
    expect(url.searchParams.get("per_page")).toBe("10");
    expect(url.searchParams.get("min_date")).toBe("2025-05-30");
    expect(url.searchParams.get("max_date")).toBe("2026-05-30");
    expect(String(url)).not.toContain("SW12+8AA");
    expect(url.searchParams.has("outcode")).toBe(false);
    expect(url.searchParams.has("property_type")).toBe(false);
    expect(url.searchParams.has("address")).toBe(false);
    expect(url.searchParams.has("uprn")).toBe(false);
  });

  it("builds a rolling 12-month comparable date window", () => {
    expect(buildPmiComparableDateWindow(new Date("2026-05-31T18:00:00Z"))).toEqual({
      start: "2025-05-31",
      end: "2026-05-31"
    });
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

  it("normalises the stable PMI listings response shape", () => {
    const evidence = normalisePmiListingsResponse(
      {
        total_count: 117,
        listings: [
          {
            uprn: "secret-uprn",
            full_address: "Hidden Address",
            postcode: "SW12 9RF",
            price_pcm: 2350,
            bedrooms: 2,
            property_type: "f",
            date_crawled: "2026-05-29T12:00:00Z",
            distance_m: 61,
            url: "https://www.onthemarket.com/details/19587809/"
          }
        ]
      },
      input,
      "2026-05-29T00:00:00Z"
    );

    expect(evidence.totalCount).toBe(117);
    expect(evidence.searchAreaDescription).toBe("SW12 outcode");
    expect(evidence.listings[0]).toMatchObject({
      postcodeSector: "SW12 9",
      rentMonthly: 2350,
      propertyType: "flat",
      listedDate: "2026-05-29T12:00:00Z"
    });
    expect(JSON.stringify(evidence)).not.toContain("Hidden Address");
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

  it("maps malformed successful listing responses to a controlled PMI error", async () => {
    await expect(
      searchPmiLiveRentalListings(input, "pmi_live_test", malformedJsonFetch())
    ).rejects.toMatchObject({
      code: "malformed-response",
      message: "Property Market Intel returned a malformed live listing response."
    });
  });

  it("maps malformed successful listing response shapes to a controlled PMI error", async () => {
    await expect(
      searchPmiLiveRentalListings(
        input,
        "pmi_live_test",
        responseFetch(200, { total_count: 1, listings: "not-an-array" })
      )
    ).rejects.toMatchObject({
      code: "malformed-response",
      message: "PMI response did not include a listings array."
    });
  });

  it("normalises deeper comparables without exposing address, UPRN or full postcode", () => {
    const evidence = normalisePmiComparablesResponse(
      pmiComparablesResponse,
      input,
      "2026-05-30T00:00:00Z"
    );

    expect(evidence.evidenceKind).toBe("licensed-comparables");
    expect(evidence.recordKind).toBe("historical-rented-records");
    expect(evidence.provider).toBe("property-market-intel");
    expect(evidence.searchAreaDescription).toBe("SW12 8 postcode sector");
    expect(evidence.dateWindowStart).toBe("2025-05-30");
    expect(evidence.dateWindowEnd).toBe("2026-05-30");
    expect(evidence.displayedCount).toBe(2);
    expect(evidence.medianMonthly).toBe(2400);
    expect(evidence.comparables[0]).toMatchObject({
      postcodeSector: "SW12 8",
      rentMonthly: 2300,
      bedrooms: 2,
      propertyType: "flat",
      evidenceDate: "2026-04-01"
    });
    expect(JSON.stringify(evidence)).not.toContain("Hidden Comparable Street");
    expect(JSON.stringify(evidence)).not.toContain("secret-comparable-uprn");
    expect(JSON.stringify(evidence)).not.toContain("SW12 8AA");
  });

  it("filters deeper comparables outside the recent date window", () => {
    const evidence = normalisePmiComparablesResponse(
      {
        total_count: 3,
        count: 3,
        comparables: [
          {
            postcode: "SW12 8AA",
            price: 2300,
            date: "2026-04-01",
            bedrooms: 2,
            property_type: "Flat"
          },
          {
            postcode: "SW12 8AB",
            price: 9999,
            date: "2024-04-01",
            bedrooms: 2,
            property_type: "Flat"
          },
          {
            postcode: "SW12 8AC",
            price: 2500,
            date: "15/04/2026",
            bedrooms: 2,
            property_type: "Flat"
          }
        ]
      },
      input,
      "2026-05-30T00:00:00Z"
    );

    expect(evidence.displayedCount).toBe(2);
    expect(evidence.medianMonthly).toBe(2400);
    expect(evidence.comparables.map((comparable) => comparable.rentMonthly)).toEqual([
      2300,
      2500
    ]);
  });

  it("rejects deeper comparables when no recent records remain", () => {
    expect(() =>
      normalisePmiComparablesResponse(
        {
          total_count: 1,
          count: 1,
          comparables: [
            {
              postcode: "SW12 8AA",
              price: 2300,
              date: "2024-04-01",
              bedrooms: 2,
              property_type: "Flat"
            }
          ]
        },
        input,
        "2026-05-30T00:00:00Z"
      )
    ).toThrow(/none within the last 12 months/i);
    expect(() =>
      normalisePmiComparablesResponse(
        {
          total_count: 1,
          count: 1,
          comparables: [
            {
              postcode: "SW12 8AA",
              price: 2300,
              date: "2024-04-01",
              bedrooms: 2,
              property_type: "Flat"
            }
          ]
        },
        input,
        "2026-05-30T00:00:00Z"
      )
    ).toThrow(/does not include records outside the last 12 months/i);
  });

  it("maps deeper comparable failures and calls PMI with a bearer token", async () => {
    await expect(searchPmiDeeperComparables(input, "")).rejects.toMatchObject({
      code: "missing-key"
    });

    await expect(
      searchPmiDeeperComparables(input, "bad-key", responseFetch(401, {}))
    ).rejects.toMatchObject({ code: "invalid-key" });

    await expect(
      searchPmiDeeperComparables(input, "rate-limited", responseFetch(402, {}))
    ).rejects.toMatchObject({ code: "quota-or-rate-limit" });

    await expect(() =>
      normalisePmiComparablesResponse(
        { total_count: 0, comparables: [] },
        input,
        "now"
      )
    ).toThrow(PmiEvidenceError);

    const fetchMock = responseFetch(200, pmiComparablesResponse);
    const evidence = await searchPmiDeeperComparables(
      input,
      "pmi_live_test",
      fetchMock
    );

    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/v1/prices/comparables" }),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer pmi_live_test"
        })
      })
    );
    expect(evidence.displayedCount).toBe(2);
  });

  it("maps malformed successful recent rented-record responses to a controlled PMI error", async () => {
    await expect(
      searchPmiDeeperComparables(input, "pmi_live_test", malformedJsonFetch())
    ).rejects.toMatchObject({
      code: "malformed-response",
      message: "Property Market Intel returned a malformed recent rented-record response."
    });
  });

  it("maps malformed successful recent rented-record response shapes to a controlled PMI error", async () => {
    await expect(
      searchPmiDeeperComparables(
        input,
        "pmi_live_test",
        responseFetch(200, { total_count: 1, comparables: "not-an-array" })
      )
    ).rejects.toMatchObject({
      code: "malformed-response",
      message: "PMI response did not include a comparables array."
    });
  });

  it("accepts a raw key, bearer value or copied authorization header", () => {
    expect(normalisePmiApiKey(" pmi_live_test ")).toBe("pmi_live_test");
    expect(normalisePmiApiKey("Bearer pmi_live_test")).toBe("pmi_live_test");
    expect(normalisePmiApiKey("Authorization: Bearer pmi_live_test")).toBe(
      "pmi_live_test"
    );
    expect(normalisePmiApiKey('"Bearer pmi_live_test"')).toBe("pmi_live_test");
    expect(normalisePmiApiKey('-H "Authorization: Bearer pmi_live_test"')).toBe(
      "pmi_live_test"
    );
  });

  it("includes PMI problem details in rejected-key errors", async () => {
    await expect(
      searchPmiLiveRentalListings(
        input,
        "bad-key",
        responseFetch(401, {
          title: "Invalid API key",
          detail: "The provided API key is not recognised."
        })
      )
    ).rejects.toMatchObject({
      code: "invalid-key",
      message:
        "Property Market Intel rejected the API key: Invalid API key – The provided API key is not recognised."
    });
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

function malformedJsonFetch() {
  return vi.fn().mockResolvedValue(
    new Response("<html>Not JSON</html>", {
      status: 200,
      headers: { "Content-Type": "text/html" }
    })
  );
}
