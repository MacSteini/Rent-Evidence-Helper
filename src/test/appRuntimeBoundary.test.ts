import { describe, expect, it } from "vitest";

describe("App runtime evidence boundary", () => {
  it("imports without the removed comparable-provider flow", async () => {
    await expect(import("../App")).resolves.toHaveProperty("default");
  });
});
