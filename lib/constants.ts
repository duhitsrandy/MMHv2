// lib/constants.ts

// API Base URLs
export const OSRM_API_BASE = "https://router.project-osrm.org";
export const OVERPASS_API_URL = "https://overpass-api.de/api/interpreter";
export const LOCATIONIQ_API_BASE = "https://us1.locationiq.com/v1";
export const NOMINATIM_API_BASE = "https://nominatim.openstreetmap.org";

// Cache Configuration
export const CACHE_TTL_SECONDS = 24 * 60 * 60; // 24 hours in seconds for Redis TTL

// Default App Configuration
export const DEFAULT_POI_RADIUS = 1500; // Default POI search radius in meters
export const DEFAULT_USER_AGENT = `Meet-Me-Halfway/1.0 (${process.env.CONTACT_EMAIL || 'your-contact-email@example.com'})`;

// Add other constants as needed... 