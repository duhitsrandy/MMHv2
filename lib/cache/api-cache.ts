import { createHash } from "crypto";
import { Redis } from "@upstash/redis";

const CACHE_VERSION = "v1";
const KEY_PREFIX = `mmh:cache:${CACHE_VERSION}`;

const DEFAULT_POI_TTL = 43200; // 12h
const DEFAULT_GEOCODE_TTL = 86400; // 24h
const DEFAULT_SNAP_TTL = 86400; // 24h
const DEFAULT_GRID_DECIMALS = 4;

export function isApiCacheEnabled(): boolean {
  return process.env.API_CACHE_ENABLED !== "false";
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getPoiCacheTtlSeconds(): number {
  return parsePositiveInt(process.env.POI_CACHE_TTL_SECONDS, DEFAULT_POI_TTL);
}

export function getGeocodeCacheTtlSeconds(): number {
  return parsePositiveInt(process.env.GEOCODE_CACHE_TTL_SECONDS, DEFAULT_GEOCODE_TTL);
}

export function getSnapCacheTtlSeconds(): number {
  return parsePositiveInt(process.env.SNAP_CACHE_TTL_SECONDS, DEFAULT_SNAP_TTL);
}

export function getPoiCacheGridDecimals(): number {
  const parsed = parseInt(process.env.POI_CACHE_GRID_DECIMALS ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 6) {
    return DEFAULT_GRID_DECIMALS;
  }
  return parsed;
}

export function gridCoord(value: string | number, decimals?: number): string {
  const d = decimals ?? getPoiCacheGridDecimals();
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (!Number.isFinite(n)) {
    return String(value);
  }
  return n.toFixed(d);
}

export function buildPoiCacheKey(lat: string, lon: string, radius: number): string {
  const d = getPoiCacheGridDecimals();
  return `${KEY_PREFIX}:poi:${gridCoord(lat, d)}:${gridCoord(lon, d)}:r${radius}`;
}

export function buildSnapCacheKey(lat: string, lon: string): string {
  const d = getPoiCacheGridDecimals();
  return `${KEY_PREFIX}:snap:${gridCoord(lat, d)}:${gridCoord(lon, d)}`;
}

export function normalizeAddress(address: string): string {
  return address.trim().toLowerCase().replace(/\s+/g, " ");
}

export function buildGeocodeCacheKey(address: string): string {
  const normalized = normalizeAddress(address);
  const hash = createHash("sha256").update(normalized).digest("hex");
  return `${KEY_PREFIX}:geocode:${hash}`;
}

let redisClient: Redis | null = null;

function getRedis(): Redis | null {
  if (!isApiCacheEnabled()) {
    return null;
  }
  try {
    if (!redisClient) {
      redisClient = Redis.fromEnv();
    }
    return redisClient;
  } catch {
    return null;
  }
}

export async function getCachedJson<T>(key: string): Promise<T | null> {
  if (!isApiCacheEnabled()) {
    return null;
  }
  try {
    const redis = getRedis();
    if (!redis) {
      return null;
    }
    const raw = await redis.get<T | string>(key);
    if (raw == null) {
      return null;
    }
    if (typeof raw === "string") {
      return JSON.parse(raw) as T;
    }
    return raw as T;
  } catch (err) {
    console.warn("[ApiCache] get failed:", key, err);
    return null;
  }
}

export async function setCachedJson(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<void> {
  if (!isApiCacheEnabled()) {
    return;
  }
  try {
    const redis = getRedis();
    if (!redis) {
      return;
    }
    await redis.set(key, JSON.stringify(value), { ex: ttlSeconds });
  } catch (err) {
    console.warn("[ApiCache] set failed:", key, err);
  }
}
