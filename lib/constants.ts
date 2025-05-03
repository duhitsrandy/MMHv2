// lib/constants.ts

// API Base URLs
export const ORS_API_BASE = "https://api.openrouteservice.org";
export const OVERPASS_API_URL = "https://overpass-api.de/api/interpreter";
export const LOCATIONIQ_API_BASE = "https://us1.locationiq.com/v1";
export const NOMINATIM_API_BASE = "https://nominatim.openstreetmap.org";

// Environment Variable Names
export const LOCATIONIQ_API_KEY_ENV_VAR = "LOCATIONIQ_API_KEY";
export const ORS_API_KEY_ENV_VAR = "OPENROUTESERVICE_API_KEY";

// --- REMOVE or COMMENT OUT these ---
// export const OSRM_API_BASE = ...
// export const OSRM_API_KEY_ENV_VAR = ...

// --- ADD these for RapidAPI Fast Routing ---
export const RAPIDAPI_FAST_ROUTING_HOST_ENV_VAR = "RAPIDAPI_FAST_ROUTING_HOST";
export const RAPIDAPI_FAST_ROUTING_KEY_ENV_VAR = "RAPIDAPI_FAST_ROUTING_KEY";

// Cache Configuration
export const CACHE_TTL_SECONDS = 24 * 60 * 60; // 24 hours in seconds for Redis TTL

// Default App Configuration
export const DEFAULT_POI_RADIUS = 1500; // Default POI search radius in meters
export const DEFAULT_USER_AGENT = `Meet-Me-Halfway/1.0 (${process.env.CONTACT_EMAIL || 'your-contact-email@example.com'})`;

// Default Values & Limits
export const DEBOUNCE_DELAY = 500; // milliseconds 