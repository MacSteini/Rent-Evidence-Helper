import { describe, expect, it } from "vitest";
import { formatEvidenceDate, parseEvidenceDate } from "../lib/evidenceDates";

describe("evidence dates", () => {
  it("formats ISO and UK day-level dates consistently", () => {
    expect(formatEvidenceDate("2026-04-15")).toBe("15 Apr 2026");
    expect(formatEvidenceDate("15/04/2026")).toBe("15 Apr 2026");
  });

  it("formats month-level dates without inventing a visible day", () => {
    expect(formatEvidenceDate("2026-04")).toBe("Apr 2026");
    expect(formatEvidenceDate("Apr 2026")).toBe("Apr 2026");
  });

  it("treats missing or invalid dates as unknown", () => {
    expect(formatEvidenceDate(undefined)).toBe("Unknown");
    expect(formatEvidenceDate("not-a-date")).toBe("Unknown");
    expect(parseEvidenceDate("31/02/2026")).toBeNull();
  });
});
