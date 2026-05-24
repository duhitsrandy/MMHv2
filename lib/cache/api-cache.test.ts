import { describe, expect, it } from "vitest";
import {
  buildGeocodeCacheKey,
  buildPoiCacheKey,
  buildSnapCacheKey,
  gridCoord,
  normalizeAddress,
} from "./api-cache";

describe("api-cache key builders", () => {
  it("rounds coordinates to grid precision", () => {
    expect(gridCoord(40.68921473080187, 4)).toBe("40.6892");
    expect(gridCoord("-74.57667771497297", 4)).toBe("-74.5767");
  });

  it("builds POI keys with radius", () => {
    expect(buildPoiCacheKey("40.68921", "-74.57668", 1500)).toBe(
      "mmh:cache:v1:poi:40.6892:-74.5767:r1500"
    );
    expect(buildPoiCacheKey("40.68921", "-74.57668", 3000)).toBe(
      "mmh:cache:v1:poi:40.6892:-74.5767:r3000"
    );
    expect(buildPoiCacheKey("40.68921", "-74.57668", 1500)).not.toBe(
      buildPoiCacheKey("40.68921", "-74.57668", 3000)
    );
  });

  it("builds snap keys from input coordinates", () => {
    expect(buildSnapCacheKey("40.53818715889691", "-74.31898853697781")).toBe(
      "mmh:cache:v1:snap:40.5382:-74.3190"
    );
  });

  it("normalizes addresses consistently", () => {
    expect(normalizeAddress("  305,  Princeton   Ave ")).toBe("305, princeton ave");
    expect(buildGeocodeCacheKey("305, Princeton Ave")).toBe(
      buildGeocodeCacheKey("  305,   princeton   ave  ")
    );
  });
});
