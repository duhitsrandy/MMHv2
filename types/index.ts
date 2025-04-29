/*
<ai_context>
Exports the types for the app.
</ai_context>
*/

export * from "./server-action-types"
export * from "./meet-me-halfway-types"
export * from "./poi-types"

export interface Location {
  id: string;
  userId: string;
  name: string;
  address: string;
  latitude: string; // Keep as string to match DB schema if needed
  longitude: string;
  createdAt: Date;
  updatedAt: Date;
}

// Add this new type
export interface GeocodedLocation {
  id: string; // Identifier for the input field this came from
  latitude: number;
  longitude: number;
  address: string; // Geocoded display address
  originalAddress: string; // The address the user originally typed
}
