import { describe, expect, it } from "vitest";
import {
  evaluateSubmitAttempt,
  initialSubmitGuardState,
  inputLimits,
  parseRentAmountInput,
  sanitiseRentAmountInput,
  sanitisePostcodeInput
} from "../lib/inputHardening";

describe("inputHardening", () => {
  it("normalises postcode input and strips unsupported characters", () => {
    expect(sanitisePostcodeInput(" sw12-8aa<script> ")).toBe("SW128AAS");
    expect(sanitisePostcodeInput(`sw12${" ".repeat(3)}8aa`)).toBe("SW12 8AA");
    expect(sanitisePostcodeInput("SW12 8AA EXTRA")).toHaveLength(
      inputLimits.postcodeMaxLength
    );
  });

  it("sanitises and parses rent amount text input", () => {
    expect(sanitiseRentAmountInput("£2,450.50<script>")).toBe("2450.50");
    expect(sanitiseRentAmountInput("12.345")).toBe("12.34");
    expect(parseRentAmountInput("")).toBeNaN();
    expect(parseRentAmountInput(".")).toBeNaN();
    expect(parseRentAmountInput("2450.50")).toBe(2450.5);
  });

  it("allows normal submits and blocks rapid repeated submits", () => {
    const first = evaluateSubmitAttempt(initialSubmitGuardState, 1_000);
    expect(first.allowed).toBe(true);

    const second = evaluateSubmitAttempt(first.state, 1_300);
    expect(second.allowed).toBe(false);
    expect(second.message).toMatch(/wait a moment/i);

    const third = evaluateSubmitAttempt(second.state, 2_600);
    expect(third.allowed).toBe(true);
  });

  it("locks out excessive submit bursts", () => {
    let state = initialSubmitGuardState;

    for (let attempt = 0; attempt < inputLimits.submitMaxAttempts; attempt += 1) {
      state = evaluateSubmitAttempt(
        state,
        10_000 + attempt * inputLimits.submitCooldownMs
      ).state;
    }

    const blocked = evaluateSubmitAttempt(
      state,
      10_000 + inputLimits.submitMaxAttempts * inputLimits.submitCooldownMs
    );

    expect(blocked.allowed).toBe(false);
    expect(blocked.message).toMatch(/too many checks/i);
    expect(blocked.state.lockedUntil).toBeGreaterThan(0);
  });
});
