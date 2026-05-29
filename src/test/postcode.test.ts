import { describe, expect, it } from "vitest";
import {
  isSupportedEnglandPostcode,
  isValidPostcode,
  normalisePostcode,
  parsePostcode
} from "../lib/postcode";

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

  it("flags postcode areas outside the supported England scope", () => {
    expect(isSupportedEnglandPostcode("SW12 8AA")).toBe(true);
    expect(isSupportedEnglandPostcode("CF10 1EP")).toBe(false);
    expect(isSupportedEnglandPostcode("BT1 5GS")).toBe(false);
    expect(isSupportedEnglandPostcode("EH1 1YZ")).toBe(false);
  });
});
