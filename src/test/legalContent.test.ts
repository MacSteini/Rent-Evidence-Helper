import { describe, expect, it } from "vitest";
import { getLegalContent, legalContent } from "../content/legalGuidance";
import { jurisdictionCopy } from "../content/uiCopy";

describe("legalContent", () => {
  it("includes source metadata for legal guidance", () => {
    const sourcedItems = legalContent.filter((item) => item.id !== "evidence-notice");
    expect(sourcedItems.length).toBeGreaterThan(0);
    for (const item of sourcedItems) {
      expect(item.jurisdiction).toBe("england");
      expect(item.lastCheckedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(item.sourceUrls.length).toBeGreaterThan(0);
    }
  });

  it("limits Form 4A guidance to private assured tenancies and points to the applicable rules", () => {
    const guidance = getLegalContent("form-4a-section-13");
    expect(guidance.body).toContain("private assured tenancies in England");
    expect(guidance.body).toContain("Other tenancy types and older notices");
    expect(guidance.sourceUrls).toContain(
      "https://www.gov.uk/guidance/assured-tenancy-forms"
    );
    expect(guidance.sourceUrls).toContain(
      "https://www.gov.uk/assured-periodic-tenancies-tenants/rent-increases"
    );
    expect(jurisdictionCopy.scopeSummary).toContain("private assured tenancies in England");
  });
});
