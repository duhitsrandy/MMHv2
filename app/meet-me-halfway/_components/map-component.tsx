"use client"

import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  useMap,
  Popup
} from "react-leaflet"
import { PoiResponse } from "@/types/poi-types"
import { OsrmRoute } from "@/types/meet-me-halfway-types"

// Use default Leaflet markers for now
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  iconUrl: "/leaflet/marker-icon.png",
  shadowUrl: "/leaflet/marker-shadow.png"
})

// Create a custom red icon for the midpoint
const redIcon = new L.Icon({
  iconUrl: "/leaflet/marker-icon-red.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x-red.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

// Create a custom purple icon for the alternate midpoint
const purpleIcon = new L.Icon({
  iconUrl: "/leaflet/marker-icon-violet.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x-violet.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

interface Icons {
  startIcon: L.Icon.Default
  endIcon: L.Icon.Default
  midpointIcon: L.Icon
  alternateMidpointIcon: L.Icon
  poiIcon: L.Icon.Default
}

const defaultIcons: Icons = {
  startIcon: new L.Icon.Default(),
  endIcon: new L.Icon.Default(),
  midpointIcon: redIcon,
  alternateMidpointIcon: purpleIcon,
  poiIcon: new L.Icon.Default()
}

interface MapComponentProps {
  startLat: string | number
  startLng: string | number
  endLat: string | number
  endLng: string | number
  startAddress: string
  endAddress: string
  midpointLat: string | number
  midpointLng: string | number
  alternateMidpointLat: string | number
  alternateMidpointLng: string | number
  mainRoute?: OsrmRoute | null
  alternateRoute?: OsrmRoute | null
  showAlternateRoute?: boolean
  pois?: PoiResponse[]
  showPois?: boolean
  selectedPoiId?: string
  onPoiSelect?: (poiId: string) => void
}

// Component to fit bounds
function FitBounds({
  routes,
  shouldFit
}: {
  routes: (OsrmRoute | null | undefined)[],
  shouldFit: boolean
}) {
  const map = useMap()

  useEffect(() => {
    if (!map || routes.length === 0 || !shouldFit) return;

    // Create a bounds object that will contain all routes
    const bounds = L.latLngBounds([]);

    // Add all route coordinates to the bounds
    routes.forEach(route => {
      if (route?.geometry?.coordinates) {
        // Assert each coordinate pair as a LatLngTuple
        route.geometry.coordinates.forEach((coord: [number, number]) => {
          bounds.extend([coord[1], coord[0]] as L.LatLngTuple);
        });
      }
    });

    // Fit the map to the bounds with padding
    map.fitBounds(bounds, {
      padding: [50, 50], // Add padding to ensure routes aren't at the edge
      maxZoom: 12 // Limit maximum zoom to ensure routes are visible
    });
  }, [map, routes, shouldFit]);

  return null;
}

export default function MapComponent({
  startLat,
  startLng,
  endLat,
  endLng,
  startAddress,
  endAddress,
  midpointLat,
  midpointLng,
  alternateMidpointLat,
  alternateMidpointLng,
  mainRoute,
  alternateRoute,
  showAlternateRoute = false,
  pois = [],
  showPois = false,
  selectedPoiId,
  onPoiSelect
}: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const poiMarkers = useRef<Map<string, L.Marker>>(new Map());
  const [shouldFitBounds, setShouldFitBounds] = useState(true);
  const prevPoisRef = useRef<PoiResponse[]>([]); // Keep track of previous POIs
  const prevSelectedPoiIdRef = useRef<string | undefined>(undefined); // Track previous selected ID

  // Convert string coordinates to numbers
  const sLat = Number(startLat) || 0
  const sLng = Number(startLng) || 0
  const eLat = Number(endLat) || 0
  const eLng = Number(endLng) || 0
  const mLat = Number(midpointLat) || 0
  const mLng = Number(midpointLng) || 0
  const amLat = Number(alternateMidpointLat) || 0
  const amLng = Number(alternateMidpointLng) || 0

  // Convert GeoJSON coordinates to LatLng arrays for Polyline
  const mainRouteCoords =
    mainRoute?.geometry?.coordinates?.map((coord: [number, number]) => [
      coord[1],
      coord[0]
    ]) || []

  const alternateRouteCoords =
    alternateRoute?.geometry?.coordinates?.map((coord: [number, number]) => [
      coord[1],
      coord[0]
    ]) || []

  // Create an icon for selected POIs
  const selectedPoiIcon = new L.Icon({
    iconUrl: "/leaflet/marker-icon-gold.png",
    iconRetinaUrl: "/leaflet/marker-icon-2x-gold.png",
    shadowUrl: "/leaflet/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  // Render POIs if enabled
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !showPois) {
      // If hiding POIs, remove all markers
      poiMarkers.current.forEach(marker => marker.remove());
      poiMarkers.current.clear();
      prevPoisRef.current = []; // Clear previous POIs as well
      return;
    }

    const prevPois = prevPoisRef.current;
    const prevSelectedPoiId = prevSelectedPoiIdRef.current;
    const currentPoisMap = new Map(pois.map(poi => [poi.osm_id || poi.id || `${poi.lat}-${poi.lon}`, poi]));
    const prevPoisMap = new Map(prevPois.map(poi => [poi.osm_id || poi.id || `${poi.lat}-${poi.lon}`, poi]));

    console.log('[Map] Updating POIs:', {
      currentCount: pois.length,
      prevCount: prevPois.length,
      selectedId: selectedPoiId,
      prevSelectedId: prevSelectedPoiId,
    });

    // --- Diffing Logic ---

    // 1. Remove markers for POIs that are no longer present
    prevPoisMap.forEach((_, key) => {
      if (!currentPoisMap.has(key)) {
        const markerToRemove = poiMarkers.current.get(key);
        if (markerToRemove) {
          markerToRemove.remove();
          poiMarkers.current.delete(key);
          console.log(`[Map] Removed POI marker: ${key}`);
        }
      }
    });

    // 2. Add markers for new POIs or update existing ones
    currentPoisMap.forEach((poi, key) => {
      const poiLat = Number(poi.lat);
      const poiLon = Number(poi.lon);

      if (isNaN(poiLat) || isNaN(poiLon)) {
        console.warn("[Map] Invalid POI coordinates:", poi);
        return; // Skip invalid POIs
      }

      const isSelected = selectedPoiId === key;
      const wasSelected = prevSelectedPoiId === key;
      const existingMarker = poiMarkers.current.get(key);

      if (existingMarker) {
        // POI exists, check if selection status changed
        if (isSelected !== wasSelected) {
          existingMarker.setIcon(isSelected ? selectedPoiIcon : defaultIcons.poiIcon);
          console.log(`[Map] Updated POI marker icon: ${key}, selected: ${isSelected}`);
        }
        // Update popup content if necessary (e.g., travel times change)
        // For now, we assume popup content doesn't need dynamic updates beyond initial creation
        // If it does, re-bind the popup here:
        // existingMarker.bindPopup(createPopupContent(poi));
      } else {
        // POI is new, create and add marker
        const markerElement = L.marker([poiLat, poiLon], {
          icon: isSelected ? selectedPoiIcon : defaultIcons.poiIcon,
          // --- Accessibility --- 
          alt: `POI: ${poi.name || 'Unnamed Location'}`, // Alt text for the icon
          keyboard: true, // Allow keyboard interaction (focus)
          // --- End Accessibility ---
        }).addTo(map);

        // --- Accessibility Enhancements ---
        const element = markerElement.getElement(); // Get the underlying HTML element
        if (element) {
          element.setAttribute('tabindex', '0'); // Make it focusable
          element.setAttribute('role', 'button'); // Identify as interactive button
          element.setAttribute('aria-label', `Point of Interest: ${poi.name || 'Unnamed Location'}, Type: ${poi.type || 'Unknown Type'}. Press Enter or Space to view details.`);

          // Add keyboard event listener for Enter/Space
          L.DomEvent.on(element, 'keydown', (e) => {
            const keyboardEvent = e as unknown as KeyboardEvent;
            if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
              keyboardEvent.preventDefault(); // Prevent default space scroll
              // Trigger the same logic as click
              handleMarkerInteraction(key, poiLat, poiLon, markerElement);
            }
          });
        }
        // --- End Accessibility Enhancements ---

        // Event listener for clicks
        markerElement.on('click', () => {
          handleMarkerInteraction(key, poiLat, poiLon, markerElement);
        });

        // Create and bind popup content
        const popupContent = createPopupContent(poi); // Extracted to a helper function
        markerElement.bindPopup(popupContent);
        poiMarkers.current.set(key, markerElement);
        console.log(`[Map] Added POI marker: ${key}`);
      }
    });

    // Update refs for the next render
    prevPoisRef.current = pois;
    prevSelectedPoiIdRef.current = selectedPoiId;

    // Cleanup function for this POI effect
    return () => {
      if (mapRef.current && showPois) {
        console.log('[Map] Cleaning up POI markers on unmount/hide');
        poiMarkers.current.forEach(marker => marker.remove());
        poiMarkers.current.clear();
        prevPoisRef.current = []; // Clear refs on cleanup
        prevSelectedPoiIdRef.current = undefined;
      }
    };
  }, [pois, showPois, selectedPoiId, onPoiSelect, selectedPoiIcon, mapRef]); // Added dependencies

  // Helper function to handle marker click/keyboard interaction logic
  function handleMarkerInteraction(key: string, poiLat: number, poiLon: number, marker: L.Marker) {
    const map = mapRef.current;
    if (!map) return;

    if (onPoiSelect) {
      onPoiSelect(key);
    }

    const targetLatLng = L.latLng(poiLat, poiLon);
    const targetZoom = 15;
    const currentCenter = map.getCenter();
    const currentZoom = map.getZoom();

    // If we're already close to the target location and zoom, just open the popup
    if (currentZoom >= targetZoom -1 && currentCenter.distanceTo(targetLatLng) < 50) { 
      if (!marker.isPopupOpen()) {
         marker.openPopup();
      }
      return; 
    }

    // Disable bounds fitting while we focus on the POI
    setShouldFitBounds(false);
    
    // Fly to the POI location
    map.flyTo(targetLatLng, targetZoom, { duration: 0.8 });

    // Use a flag to ensure popup opens only once after flyTo completes
    let popupOpened = false;
    const openPopupOnEnd = () => {
      if (!popupOpened) {
        const currentMarker = poiMarkers.current.get(key);
        if (currentMarker && !currentMarker.isPopupOpen()) {
          currentMarker.openPopup();
          popupOpened = true; // Mark as opened
        }
      }
      // Clean up listeners
      map.off('moveend', openPopupOnEnd);
      map.off('zoomend', openPopupOnEnd);
    };

    map.on('moveend', openPopupOnEnd);
    map.on('zoomend', openPopupOnEnd); // Also listen for zoomend as flyTo involves zoom
  }

  // Helper function to create popup content (avoids code duplication)
  function createPopupContent(poi: PoiResponse): string {
    return `
      <div class="max-w-[330px]">
        <div class="font-medium text-lg">${poi.name || (poi.tags && poi.tags.name) || 'Unnamed Location'}</div>
        <div class="text-muted-foreground text-sm">
          ${poi.type || (poi.tags && (poi.tags.amenity || poi.tags.leisure || poi.tags.tourism || poi.tags.shop)) || 'Unknown Type'}
        </div>
        ${poi.address ? `
          <div class="text-muted-foreground mt-1 text-sm">
            ${[
              poi.address?.street,
              poi.address?.city,
              poi.address?.state,
              poi.address?.postal_code
            ]
              .filter(Boolean)
              .join(", ")}
          </div>
        ` : ''}
        ${poi.travelTimeFromStart != null && poi.travelTimeFromEnd != null ? `
          <div class="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div>
              <div class="font-medium">From Loc 1:</div>
              <div>${Math.round(poi.travelTimeFromStart / 60)} min</div>
              <div>${poi.distanceFromStart != null ? `${Math.round((poi.distanceFromStart / 1000) * 0.621371)} mi` : ''}</div>
            </div>
            <div>
              <div class="font-medium">From Loc 2:</div>
              <div>${Math.round(poi.travelTimeFromEnd / 60)} min</div>
              <div>${poi.distanceFromEnd != null ? `${Math.round((poi.distanceFromEnd / 1000) * 0.621371)} mi` : ''}</div>
            </div>
          </div>
        ` : ''}
        ${poi.travelTimeDifference != null ? `
          <div class="mt-2 text-sm ${poi.travelTimeDifference / 60 <= 5 ? 'text-green-600' : 'text-amber-600'}">
            <div class="font-medium">Time Difference:</div>
            <div>${Math.round(poi.travelTimeDifference / 60)} min</div>
          </div>
        ` : ''}
        <div class="mt-2 text-sm text-center">
          <a href="https://www.google.com/maps/search/?api=1&query=${poi.lat},${poi.lon}" target="_blank" class="text-blue-600 hover:underline">Google Maps</a>
          <span class="mx-1 text-gray-400">|</span>
          <a href="http://maps.apple.com/?ll=${poi.lat},${poi.lon}" target="_blank" class="text-blue-600 hover:underline">Apple Maps</a>
          <span class="mx-1 text-gray-400">|</span>
          <a href="https://www.waze.com/ul?ll=${poi.lat},${poi.lon}&navigate=yes" target="_blank" class="text-blue-600 hover:underline">Waze</a>
        </div>
      </div>
    `;
  }

  // Handle POI selection
  useEffect(() => {
    if (!mapRef.current || !selectedPoiId || !pois.length) return;

    const selectedPoi = pois.find(poi => (poi.osm_id || poi.id) === selectedPoiId || `${poi.lat}-${poi.lon}` === selectedPoiId);
    if (!selectedPoi) return;

    const targetLatLng = L.latLng(Number(selectedPoi.lat), Number(selectedPoi.lon));
    const targetZoom = 15;

    // Disable bounds fitting while we focus on the POI
    setShouldFitBounds(false);
    
    // Fly to the POI location
    mapRef.current.flyTo(targetLatLng, targetZoom, { duration: 0.8 });

    // Open the popup after the animation
    mapRef.current.once('moveend', () => {
      const marker = poiMarkers.current.get(selectedPoiId);
      if (marker && !marker.isPopupOpen()) {
        marker.openPopup();
      }
    });
  }, [selectedPoiId, pois]);

  // Reset shouldFitBounds when routes change
  useEffect(() => {
    setShouldFitBounds(true);
  }, [mainRoute, alternateRoute]);

  // Determine the routes to pass to FitBounds
  const routesForBounds: (OsrmRoute | null | undefined)[] = [mainRoute];
  if (showAlternateRoute) {
    routesForBounds.push(alternateRoute);
  }

  return (
    <div className="relative h-[600px] w-full">
      <MapContainer
        center={[mLat, mLng]}
        zoom={10}
        style={{ height: "600px", width: "100%" }}
        ref={mapRef}
        className="rounded-lg z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds routes={routesForBounds.filter(Boolean)} shouldFit={shouldFitBounds} />
        
        {/* Render Main Route */}
        {mainRouteCoords.length > 0 && (
          <Polyline
            positions={mainRouteCoords as L.LatLngExpression[]}
            color="#3b82f6"
            weight={4}
            opacity={0.8}
          />
        )}

        {/* Render Start Marker -> Renamed to Location 1 */}
        {sLat !== 0 && sLng !== 0 && (
          <Marker position={[sLat, sLng]} icon={defaultIcons.startIcon}>
            <Popup>
              <div className="text-center">
                <div className="font-medium">Location 1</div>
                <div className="text-sm text-muted-foreground">{startAddress}</div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Render End Marker -> Renamed to Location 2 */}
        {eLat !== 0 && eLng !== 0 && (
          <Marker position={[eLat, eLng]} icon={defaultIcons.endIcon}>
            <Popup>
              <div className="text-center">
                <div className="font-medium">Location 2</div>
                <div className="text-sm text-muted-foreground">{endAddress}</div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Render Midpoint Marker */}
        {mLat !== 0 && mLng !== 0 && (
          <Marker position={[mLat, mLng]} icon={defaultIcons.midpointIcon}>
            <Popup>
              <div className="text-center">
                <div className="font-medium">Midpoint</div>
                <div className="text-sm text-muted-foreground">
                  {mainRoute?.duration ? `${Math.round(mainRoute.duration / 120)} min from each location` : 'Travel time unavailable'}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Render Alternate Route */}
        {showAlternateRoute && alternateRouteCoords.length > 0 && (
          <Polyline
            positions={alternateRouteCoords as L.LatLngExpression[]}
            color="#8b5cf6"
            weight={4}
            opacity={0.8}
          />
        )}

        {/* Render Alternate Midpoint Marker */}
        {showAlternateRoute && amLat !== 0 && amLng !== 0 && (
          <Marker
            position={[amLat, amLng]}
            icon={defaultIcons.alternateMidpointIcon}
          >
            <Popup>
              <div className="text-center">
                <div className="font-medium">Alternate Midpoint</div>
                <div className="text-sm text-muted-foreground">
                  {alternateRoute?.duration ? `${Math.round(alternateRoute.duration / 120)} min from each location` : 'Travel time unavailable'}
                </div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
