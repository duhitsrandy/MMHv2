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
  mainRoute?: any
  alternateRoute?: any
  showAlternateRoute?: boolean
  pois?: any[]
  showPois?: boolean
  selectedPoiId?: string
  onPoiSelect?: (poiId: string) => void
}

// Component to fit bounds - leave commented out for now
// function FitBounds({ route }: { route: any }) { ... }

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
      poiMarkers.current.forEach(marker => marker.remove());
      poiMarkers.current.clear();
      return;
    }

    console.log('[Map] Rendering POIs:', {
      total: pois.length,
      types: pois.reduce((acc: any, poi: any) => {
        acc[poi.type] = (acc[poi.type] || 0) + 1;
        return acc;
      }, {})
    });

    // Clear existing POI markers
    poiMarkers.current.forEach(marker => marker.remove());
    poiMarkers.current.clear();

    // Add new POI markers
    pois.forEach((poi: any) => {
      const poiLat = Number(poi.lat);
      const poiLon = Number(poi.lon);
      
      if (isNaN(poiLat) || isNaN(poiLon)) {
        console.warn("[Map] Invalid POI coordinates:", poi);
        return;
      }
      
      const uniqueKey = poi.osm_id || poi.id || `${poi.lat}-${poi.lon}`;
      const isSelected = selectedPoiId === uniqueKey;
      
      const marker = L.marker([poiLat, poiLon], {
        icon: isSelected ? selectedPoiIcon : defaultIcons.poiIcon
      }).addTo(map);

      // --- Updated Click Handler --- 
      marker.on('click', () => {
        if (!map) return; 

        if (onPoiSelect) {
          onPoiSelect(uniqueKey);
        }

        const targetLatLng = L.latLng(poiLat, poiLon);
        const targetZoom = 15;
        const currentCenter = map.getCenter();
        const currentZoom = map.getZoom();

        // Check if already focused & popup is open or opening
        if (currentZoom === targetZoom && currentCenter.distanceTo(targetLatLng) < 10) { 
          if (!marker.isPopupOpen()) {
            marker.openPopup(); // Ensure popup is open if already focused
          }
          return; 
        }

        // Fly to the marker
        map.flyTo(targetLatLng, targetZoom, { duration: 0.8 });

        // On flyTo end, simply open the popup
        // Leaflet's default autoPan should handle visibility
        map.once('moveend', () => {
            // Retrieve marker again in case it was removed/re-added during flyTo
            const currentMarker = poiMarkers.current.get(uniqueKey);
            if (currentMarker && !currentMarker.isPopupOpen()) {
                currentMarker.openPopup();
            }
            // REMOVED nested panBy and second moveend listener
        });
      });
      // --- End Updated Click Handler ---

      // Create popup content
      const popupContent = `
        <div class="max-w-[330px]">
          <div class="font-medium text-lg">${poi.name || (poi.tags && poi.tags.name) || 'Unnamed Location'}</div>
          <div class="text-muted-foreground text-sm">
            ${poi.type || (poi.tags && (poi.tags.amenity || poi.tags.leisure || poi.tags.tourism || poi.tags.shop)) || 'Unknown Type'}
          </div>
          ${poi.address ? `
            <div class="text-muted-foreground mt-1 text-sm">
              ${[
                poi.address.road,
                poi.address.house_number,
                poi.address.city,
                poi.address.state,
                poi.address.postal_code
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

      marker.bindPopup(popupContent);
      poiMarkers.current.set(uniqueKey, marker);
    });

    // Cleanup function for this POI effect
    return () => {
      if (mapRef.current) {
        poiMarkers.current.forEach(marker => marker.remove());
        poiMarkers.current.clear();
      }
    };
  }, [pois, showPois, selectedPoiId, onPoiSelect]); // Dependencies

  return (
    <div className="relative h-[520px] w-full rounded-lg overflow-hidden">
      <MapContainer
        ref={mapRef}
        center={sLat !== 0 && sLng !== 0 ? [sLat, sLng] : [40.5, -74.5]}
        zoom={10}
        style={{ height: "600px", width: "100%" }}
        whenReady={() => { /* Map is ready, ref is set */ }}
        className="rounded-lg z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Render Main Route */}
        {mainRouteCoords.length > 0 && (
          <Polyline
            positions={mainRouteCoords}
            color="blue"
            weight={5}
            opacity={0.7}
          />
        )}

        {/* Render Start Marker */}
        {sLat !== 0 && sLng !== 0 && (
          <Marker position={[sLat, sLng]} icon={defaultIcons.startIcon}>
            <Popup>{startAddress || 'Start'}</Popup>
          </Marker>
        )}

        {/* Render End Marker */}
        {eLat !== 0 && eLng !== 0 && (
          <Marker position={[eLat, eLng]} icon={defaultIcons.endIcon}>
            <Popup>{endAddress || 'End'}</Popup>
          </Marker>
        )}

        {/* Render Midpoint Marker */}
        {mLat !== 0 && mLng !== 0 && (
          <Marker position={[mLat, mLng]} icon={defaultIcons.midpointIcon}>
            <Popup>Midpoint</Popup>
          </Marker>
        )}

        {/* ---- Re-added Alternate Route Elements ---- */} 
        {/* Render Alternate Midpoint Marker */}
        {showAlternateRoute && amLat !== 0 && amLng !== 0 && (
          <Marker position={[amLat, amLng]} icon={defaultIcons.alternateMidpointIcon}>
            <Popup>Alternate Midpoint</Popup>
          </Marker>
        )}

        {/* Render Alternate Route */}
        {showAlternateRoute && alternateRouteCoords.length > 0 && (
          <Polyline
            positions={alternateRouteCoords}
            color="purple"
            weight={5}
            opacity={0.7}
          />
        )}
        {/* ---- End Re-added Elements ---- */}

        {/* {mainRoute && <FitBounds route={mainRoute} />} */}
      </MapContainer>
    </div>
  );
}
