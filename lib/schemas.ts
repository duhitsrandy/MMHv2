import { z } from 'zod';

// Basic string validation for addresses
export const AddressSchema = z.string().min(3, { message: "Address must be at least 3 characters long" }).max(255, { message: "Address cannot exceed 255 characters" });

// Validate string coordinates (ensure they can be parsed as numbers)
export const CoordinateStringSchema = z.string()
  .refine((val) => !isNaN(parseFloat(val)), {
    message: "Invalid coordinate format: must be a number",
  })
  .refine((val) => {
    const num = parseFloat(val);
    return num >= -90 && num <= 90 // Latitude check
        || num >= -180 && num <= 180; // Longitude check (basic)
  }, {
    message: "Coordinate out of valid range"
  });

// Schema for a single point with lat/lon
export const PointSchema = z.object({
  lat: CoordinateStringSchema,
  lon: CoordinateStringSchema,
});

// Schema for an array of points
export const PointsArraySchema = z.array(PointSchema).min(1, { message: "At least one point is required" });

// Schema for POI search parameters
export const PoiSearchSchema = z.object({
  lat: CoordinateStringSchema,
  lon: CoordinateStringSchema,
  radius: z.number().int().positive({ message: "Radius must be a positive integer" }).max(50000, { message: "Radius cannot exceed 50,000 meters" }), // OSRM Max is 50km
  types: z.array(z.string()).optional(), // Optional array of strings
});

// Schema for actions needing start and end coordinates
export const RouteCoordinatesSchema = z.object({
  startLat: CoordinateStringSchema,
  startLon: CoordinateStringSchema,
  endLat: CoordinateStringSchema,
  endLon: CoordinateStringSchema,
});

// Schema for the Travel Time Matrix action
export const TravelTimeMatrixSchema = z.object({
  locations: PointsArraySchema, // Requires at least one location
  pois: PointsArraySchema,      // Requires at least one POI
});

// Schema for OSRM Matrix action inputs
// Basic validation: ensures strings are non-empty. More complex regex could be added later if needed.
export const OsrmMatrixSchema = z.object({
  coordinates: z.string().min(1, { message: "Coordinates string cannot be empty" }),
  sources: z.string().min(1, { message: "Sources string cannot be empty" }),
  destinations: z.string().min(1, { message: "Destinations string cannot be empty" }),
}); 