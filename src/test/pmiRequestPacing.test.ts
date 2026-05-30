import { describe, expect, it } from "vitest";
import {
  buildPmiCooldownMessage,
  getPmiCooldownMs,
  getPmiCooldownSeconds,
  pmiFreeTierCooldownMs
} from "../lib/pmiRequestPacing";

describe("PMI request pacing", () => {
  it("reports no cooldown before the first PMI attempt", () => {
    expect(getPmiCooldownMs(null, 1_000)).toBe(0);
    expect(getPmiCooldownSeconds(null, 1_000)).toBe(0);
  });

  it("keeps a conservative ten-second cooldown after an attempt", () => {
    expect(pmiFreeTierCooldownMs).toBe(10_000);
    expect(getPmiCooldownMs(1_000, 1_000)).toBe(10_000);
    expect(getPmiCooldownSeconds(1_000, 2_200)).toBe(9);
    expect(getPmiCooldownSeconds(1_000, 11_000)).toBe(0);
  });

  it("formats a clear user-facing wait message", () => {
    expect(buildPmiCooldownMessage(8)).toBe(
      "Property Market Intel free tier allows 2 requests per 10 seconds. Wait 8 seconds before running live evidence again."
    );
    expect(buildPmiCooldownMessage(1)).toContain("Wait 1 second");
  });
});
