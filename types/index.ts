/*
<ai_context>
Exports the types for the app.
</ai_context>
*/

export * from "./server-action-types"
export * from "./meet-me-halfway-types"
export * from "./poi-types"

// Define and export the user plan type
export type UserPlan = "free" | "pro"

// Define input structure for the form
export interface OriginInput {
  id: string; // Unique ID for React keys
  address: string;
  selectedLocationId: string; // 'custom' or Location['id']
  isSaving: boolean;
}

// Define structure for geocoded location data passed between components
export interface GeocodedOrigin {
  lat: string;
  lng: string;
  display_name: string;
  // Add original index or ID if needed later for correlation
}

// Define simple Point type
export interface Point {
  lat: number;
  lng: number;
}
