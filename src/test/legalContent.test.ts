import { describe, expect, it } from "vitest";
import { legalContent } from "../content/legalGuidance";

describe("legalContent", () => {
  it("includes source metadata for legal guidance", () => {
    const sourcedItems = legalContent.filter((item) => item.id !== "fixture-data");
    expect(sourcedItems.length).toBeGreaterThan(0);
    for (const item of sourcedItems) {
      expect(item.jurisdiction).toBe("england");
      expect(item.lastCheckedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(item.sourceUrls.length).toBeGreaterThan(0);
    }
  });
});
