import { describe, it, expect } from "vitest";
import { hydrateSearchOrigins } from "./searches";
import type { SelectSearch } from "@/db/schema";

function makeSearch(overrides: Partial<SelectSearch> = {}): SelectSearch {
  return {
    id: "search-1",
    userId: "user-1",
    startLocationAddress: null,
    startLocationLat: null,
    startLocationLng: null,
    endLocationAddress: null,
    endLocationLat: null,
    endLocationLng: null,
    midpointLat: null,
    midpointLng: null,
    originCount: 2,
    searchMetadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("hydrateSearchOrigins", () => {
  it("prefers search_origins rows when provided", () => {
    const search = makeSearch({ originCount: 3 });
    const locations = hydrateSearchOrigins(search, [
      {
        address: "A",
        latitude: "1",
        longitude: "2",
        displayName: "A",
        orderIndex: 0,
      },
      {
        address: "B",
        latitude: "3",
        longitude: "4",
        displayName: "B",
        orderIndex: 1,
      },
      {
        address: "C",
        latitude: "5",
        longitude: "6",
        displayName: "C",
        orderIndex: 2,
      },
    ]);
    expect(locations).toHaveLength(3);
    expect(locations[0].address).toBe("A");
    expect(locations[2].lat).toBe(5);
  });

  it("falls back to legacy start/end columns", () => {
    const search = makeSearch({
      startLocationAddress: "Start",
      startLocationLat: "10",
      startLocationLng: "20",
      endLocationAddress: "End",
      endLocationLat: "30",
      endLocationLng: "40",
    });
    const locations = hydrateSearchOrigins(search);
    expect(locations).toHaveLength(2);
    expect(locations[0].address).toBe("Start");
    expect(locations[1].lng).toBe(40);
  });

  it("falls back to searchMetadata.locations for mobile saves", () => {
    const search = makeSearch({
      originCount: 3,
      searchMetadata: {
        locations: [
          { address: "One", lat: 1, lng: 2 },
          { address: "Two", lat: 3, lng: 4 },
          { address: "Three", lat: 5, lng: 6 },
        ],
      },
    });
    const locations = hydrateSearchOrigins(search);
    expect(locations).toHaveLength(3);
    expect(locations[2].address).toBe("Three");
  });

  it("returns empty array when no origin data exists", () => {
    const search = makeSearch();
    expect(hydrateSearchOrigins(search)).toEqual([]);
  });
});
