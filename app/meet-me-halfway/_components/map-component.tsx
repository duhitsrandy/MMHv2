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

interface Icons {
  startIcon: L.Icon.Default
  endIcon: L.Icon.Default
  midpointIcon: L.Icon.Default
  poiIcon: L.Icon.Default
}

const defaultIcons: Icons = {
  startIcon: new L.Icon.Default(),
  endIcon: new L.Icon.Default(),
  midpointIcon: new L.Icon.Default(),
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
}

// Component to fit bounds when route changes
function FitBounds({ route }: { route: any }) {
  const map = useMap()

  useEffect(() => {
    if (!route) return

    const bounds = L.latLngBounds([])
    route.geometry.coordinates.forEach((coord: [number, number]) => {
      bounds.extend([coord[1], coord[0]])
    })
    map.fitBounds(bounds, { padding: [50, 50] })
  }, [map, route])

  return null
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
  showPois = false
}: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const poiMarkers = useRef<Map<string, L.Marker>>(new Map());

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

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

  // Render POIs if enabled
  useEffect(() => {
    if (!mapRef.current || !showPois) return;

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
    pois.forEach((poi: any, index: number) => {
      // Ensure we have valid coordinates
      const poiLat = Number(poi.lat);
      const poiLon = Number(poi.lon);
      
      // Skip invalid POIs
      if (isNaN(poiLat) || isNaN(poiLon)) {
        console.warn("[Map] Invalid POI coordinates:", poi);
        return;
      }
      
      // Create a unique key using just the POI ID
      const uniqueKey = poi.id;
      
      console.log('[Map] Adding POI marker:', {
        key: uniqueKey,
        name: poi.name,
        type: poi.type,
        lat: poiLat,
        lon: poiLon
      });
      
      const marker = L.marker([poiLat, poiLon], {
        icon: defaultIcons.poiIcon
      }).addTo(mapRef.current!);

      // Create popup content with more details
      const popupContent = `
        <div class="max-w-[200px]">
          <div class="font-medium">${poi.name || (poi.tags && poi.tags.name) || 'Unnamed Location'}</div>
          <div class="text-muted-foreground text-sm">
            ${poi.type || (poi.tags && (poi.tags.amenity || poi.tags.leisure || poi.tags.tourism)) || 'Unknown Type'}
          </div>
          ${poi.address ? `
            <div class="text-muted-foreground mt-1 text-sm">
              ${[
                poi.address.road,
                poi.address.house_number,
                poi.address.city
              ]
                .filter(Boolean)
                .join(", ")}
            </div>
          ` : ''}
          ${poi.travelTimeFromStart && poi.travelTimeFromEnd ? `
            <div class="mt-2 text-sm">
              <div>From Start: ${Math.round(poi.travelTimeFromStart / 60)}min</div>
              <div>From End: ${Math.round(poi.travelTimeFromEnd / 60)}min</div>
            </div>
          ` : ''}
        </div>
      `;

      marker.bindPopup(popupContent);
      poiMarkers.current.set(uniqueKey, marker);
    });

    return () => {
      // Clean up markers on unmount
      poiMarkers.current.forEach(marker => marker.remove());
      poiMarkers.current.clear();
    };
  }, [pois, showPois]);

  return (
    <div className="relative h-[520px] w-full rounded-lg overflow-hidden">
      <MapContainer
        center={[mLat, mLng]}
        zoom={13}
        className="h-full w-full"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Main Route */}
        {mainRoute && (
          <Polyline
            positions={mainRouteCoords}
            color="#3b82f6"
            weight={6}
            opacity={1}
          />
        )}

        {/* Alternate Route */}
        {alternateRoute && showAlternateRoute && (
          <Polyline
            positions={alternateRouteCoords}
            color="#9333ea"
            weight={6}
            opacity={1}
          />
        )}

        {/* Start Marker */}
        <Marker position={[sLat, sLng]} icon={defaultIcons.startIcon}>
          <Popup>
            <div className="font-medium">Start</div>
            <div className="text-sm text-muted-foreground">{startAddress}</div>
          </Popup>
        </Marker>

        {/* End Marker */}
        <Marker position={[eLat, eLng]} icon={defaultIcons.endIcon}>
          <Popup>
            <div className="font-medium">End</div>
            <div className="text-sm text-muted-foreground">{endAddress}</div>
          </Popup>
        </Marker>

        {/* Main Midpoint Marker */}
        <Marker position={[mLat, mLng]} icon={defaultIcons.midpointIcon}>
          <Popup>
            <div className="font-medium">Main Midpoint</div>
            <div className="text-sm text-muted-foreground">
              {startAddress} ↔ {endAddress}
            </div>
          </Popup>
        </Marker>

        {/* Alternate Midpoint Marker */}
        {showAlternateRoute && (
          <Marker position={[amLat, amLng]} icon={defaultIcons.midpointIcon}>
            <Popup>
              <div className="font-medium">Alternate Midpoint</div>
              <div className="text-sm text-muted-foreground">
                {startAddress} ↔ {endAddress}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Fit bounds to route */}
        <FitBounds route={mainRoute} />
      </MapContainer>
    </div>
  )
}
