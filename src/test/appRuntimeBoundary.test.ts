import { describe, expect, it, vi } from "vitest";

vi.mock("../providers/MockComparableRentProvider", () => {
  throw new Error("App must not import MockComparableRentProvider.");
});

vi.mock("../lib/assessment", () => {
  throw new Error("App must not import assessRent.");
});

describe("App runtime evidence boundary", () => {
  it("does not import the dormant comparable-provider flow", async () => {
    await expect(import("../App")).resolves.toHaveProperty("default");
  });
});
