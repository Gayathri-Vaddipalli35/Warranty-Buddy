import { describe, expect, it } from "vitest";
import { addMonths, daysRemaining, warrantyEndDate, warrantyStatus } from "./warranty";

describe("warranty end date", () => {
  it("adds a 12-month warranty to the same calendar date", () => {
    expect(warrantyEndDate("2025-03-15", 12)).toBe("2026-03-15");
  });
  it("clamps month-end dates (Jan 31 + 1 month = Feb 28)", () => {
    expect(addMonths("2025-01-31", 1)).toBe("2025-02-28");
  });
  it("handles leap years (Jan 31 2024 + 1 month = Feb 29)", () => {
    expect(addMonths("2024-01-31", 1)).toBe("2024-02-29");
  });
  it("handles Feb 29 + 12 months = Feb 28 next year", () => {
    expect(warrantyEndDate("2024-02-29", 12)).toBe("2025-02-28");
  });
  it("crosses year boundaries", () => {
    expect(addMonths("2025-11-10", 3)).toBe("2026-02-10");
  });
});

describe("warranty status", () => {
  it("is active when more than 30 days remain", () => {
    expect(warrantyStatus("2026-03-01", "2026-01-01")).toBe("active");
  });
  it("is expiring soon at exactly 30 days left", () => {
    expect(daysRemaining("2026-01-31", "2026-01-01")).toBe(30);
    expect(warrantyStatus("2026-01-31", "2026-01-01")).toBe("expiring_soon");
  });
  it("is expiring soon on the last day of cover", () => {
    expect(warrantyStatus("2026-01-01", "2026-01-01")).toBe("expiring_soon");
  });
  it("is expired the day after the end date", () => {
    expect(warrantyStatus("2026-01-01", "2026-01-02")).toBe("expired");
  });
  it("counts days across a DST-style boundary without drifting", () => {
    expect(daysRemaining("2026-11-01", "2026-03-01")).toBe(245);
  });
});
