import { describe, it, expect } from "vitest";
import { getMaxLocationsForTier } from "./tier-limits";

describe("getMaxLocationsForTier", () => {
  it("returns correct limits per tier", () => {
    expect(getMaxLocationsForTier("starter")).toBe(2);
    expect(getMaxLocationsForTier("plus")).toBe(3);
    expect(getMaxLocationsForTier("pro")).toBe(5);
    expect(getMaxLocationsForTier("business")).toBe(10);
  });

  it("defaults to starter for null/undefined", () => {
    expect(getMaxLocationsForTier(null)).toBe(2);
    expect(getMaxLocationsForTier(undefined)).toBe(2);
  });
});
