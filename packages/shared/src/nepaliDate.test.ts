import { describe, expect, it } from "vitest";
import { adToBs, bsToAd } from "./nepaliDate";

describe("nepaliDate", () => {
  it("anchors on the epoch", () => {
    expect(adToBs("1943-04-14").formatted).toBe("2000-01-01");
  });
  it("round-trips without a timezone off-by-one", () => {
    for (const d of ["2025-04-14", "2026-10-16", "2024-02-29", "2000-01-01"]) {
      const bs = adToBs(d);
      expect(bsToAd(bs).toISOString().slice(0, 10)).toBe(d);
    }
  });
});
