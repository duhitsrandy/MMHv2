import { describe, it, expect } from "vitest";
import { buildPoiNavigationLinks } from "./poi-navigation-links";

describe("buildPoiNavigationLinks", () => {
  const base = {
    name: "Test Cafe",
    lat: 40.1,
    lon: -74.1,
  };

  it("normalizes lng to lon", () => {
    const links = buildPoiNavigationLinks({
      name: "Test",
      lat: 40,
      lng: -74,
    });
    expect(links.google).toContain("40,-74");
  });

  it("uses web Apple Maps URL on web platform", () => {
    const links = buildPoiNavigationLinks(base, { platform: "web" });
    expect(links.apple).toMatch(/^http:\/\/maps\.apple\.com/);
  });

  it("uses maps:// on native-ios", () => {
    const links = buildPoiNavigationLinks(base, { platform: "native-ios" });
    expect(links.apple).toMatch(/^maps:\/\//);
  });

  it("includes Waze search query when address is structured", () => {
    const links = buildPoiNavigationLinks({
      ...base,
      address: { street: "123 Main St", city: "NYC" },
    });
    expect(links.waze).toContain("q=");
    expect(links.waze).toContain("navigate=yes");
    expect(decodeURIComponent(links.waze)).toContain("Test Cafe");
  });

  it("includes Waze search query for string address", () => {
    const links = buildPoiNavigationLinks({
      ...base,
      address: "123 Main St, NYC",
    });
    expect(decodeURIComponent(links.waze)).toContain("123 Main St");
  });
});
