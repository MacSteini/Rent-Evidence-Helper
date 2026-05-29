import { describe, expect, it } from "vitest";
import { isValidPostcode, normalisePostcode, parsePostcode } from "../lib/postcode";

describe("postcode", () => {
  it("normalises UK postcodes", () => {
    expect(normalisePostcode("sw128aa")).toBe("SW12 8AA");
  });

  it("derives outward code and sector", () => {
    expect(parsePostcode("SW12 8AA")).toEqual({
      normalised: "SW12 8AA",
      outwardCode: "SW12",
      sector: "SW12 8"
    });
  });

  it("rejects malformed postcodes", () => {
    expect(isValidPostcode("not a postcode")).toBe(false);
  });
});
