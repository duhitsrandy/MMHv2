import { describe, it, expect, beforeEach } from 'vitest';
import type { PoiResponse } from '@/types/poi-types';

// Sample POI data for tests
const samplePOIs: PoiResponse[] = [
  {
    id: '1',
    osm_id: '1',
    name: 'Cafe One',
    type: 'cafe',
    lat: '40.1',
    lon: '-74.1',
    travelTimeFromStart: 600,
    travelTimeFromEnd: 700,
    totalTravelTime: 1300,
    travelTimeDifference: 100,
    isFavorite: true,
  },
  {
    id: '2',
    osm_id: '2',
    name: 'Park Place',
    type: 'park',
    lat: '40.2',
    lon: '-74.2',
    travelTimeFromStart: 800,
    travelTimeFromEnd: 900,
    totalTravelTime: 1700,
    travelTimeDifference: 100,
    isFavorite: false,
  },
  {
    id: '3',
    osm_id: '3',
    name: 'Diner',
    type: 'restaurant',
    lat: '40.3',
    lon: '-74.3',
    travelTimeFromStart: 500,
    travelTimeFromEnd: 600,
    totalTravelTime: 1100,
    travelTimeDifference: 100,
    isFavorite: true,
  },
];

function filterByCategory(pois: PoiResponse[], category: string) {
  if (category === 'all') return pois;
  if (category === 'food') return pois.filter(poi => ['restaurant', 'cafe', 'bar', 'pub', 'food'].some(type => poi.type.includes(type)));
  if (category === 'activities') return pois.filter(poi => ['park', 'museum', 'cinema', 'theatre', 'theater', 'entertainment', 'gym', 'recreation'].some(type => poi.type.includes(type)));
  if (category === 'lodging') return pois.filter(poi => ['hotel', 'motel', 'inn', 'hostel', 'lodging'].some(type => poi.type.includes(type)));
  if (category === 'other') return pois.filter(poi => !['restaurant', 'cafe', 'bar', 'pub', 'food', 'park', 'museum', 'cinema', 'theatre', 'theater', 'entertainment', 'gym', 'recreation', 'hotel', 'motel', 'inn', 'hostel', 'lodging'].some(type => poi.type.includes(type)));
  return pois;
}

function sortByTotalTravelTime(pois: PoiResponse[]) {
  return [...pois].sort((a, b) => (a.totalTravelTime || Infinity) - (b.totalTravelTime || Infinity));
}

function filterFavorites(pois: PoiResponse[]) {
  return pois.filter(poi => poi.isFavorite);
}

describe('POI Filtering, Sorting, and Favorites', () => {
  let pois: PoiResponse[];

  beforeEach(() => {
    pois = [...samplePOIs];
  });

  it('filters by category: food', () => {
    const filtered = filterByCategory(pois, 'food');
    expect(filtered.length).toBe(2);
    expect(filtered.every(poi => ['cafe', 'restaurant'].includes(poi.type))).toBe(true);
  });

  it('filters by category: activities', () => {
    const filtered = filterByCategory(pois, 'activities');
    expect(filtered.length).toBe(1);
    expect(filtered[0].type).toBe('park');
  });

  it('filters by favorites', () => {
    const filtered = filterFavorites(pois);
    expect(filtered.length).toBe(2);
    expect(filtered.every(poi => poi.isFavorite)).toBe(true);
  });

  it('sorts by total travel time ascending', () => {
    const sorted = sortByTotalTravelTime(pois);
    expect(sorted[0].name).toBe('Diner'); // 1100
    expect(sorted[1].name).toBe('Cafe One'); // 1300
    expect(sorted[2].name).toBe('Park Place'); // 1700
  });

  it('returns all POIs for category "all"', () => {
    const filtered = filterByCategory(pois, 'all');
    expect(filtered.length).toBe(3);
  });

  it('returns empty array if no POIs match category', () => {
    const filtered = filterByCategory(pois, 'lodging');
    expect(filtered.length).toBe(0);
  });
}); 