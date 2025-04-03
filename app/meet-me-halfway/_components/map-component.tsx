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
  showPois = false,
  selectedPoiId,
  onPoiSelect
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

  // Zoom and pan to selected POI when it changes
  useEffect(() => {
    if (!mapRef.current || !selectedPoiId) return;

    const selectedMarker = poiMarkers.current.get(selectedPoiId);
    if (selectedMarker) {
      const map = mapRef.current;
      const targetLatLng = selectedMarker.getLatLng();
      const targetZoom = 15; // Reduced zoom level

      console.log('[Map] Focusing on selected POI:', selectedPoiId);

      // Use flyTo for a smoother transition
      map.flyTo(targetLatLng, targetZoom, {
        duration: 0.8 // Adjust duration as needed
      });

      // Open popup after flyTo animation completes
      const openPopupOnMoveEnd = () => {
        // Ensure the marker still exists and is the currently selected one
        const currentMarker = poiMarkers.current.get(selectedPoiId);
        if (currentMarker === selectedMarker) {
           // Pan map slightly down to give popup space before opening
           map.panBy([0, -100], { animate: true, duration: 0.3 }); // Pan down 100px

           // Open popup after panning
           map.once('moveend', () => { // Use 'once' to avoid infinite loops if pan triggers moveend
              if (poiMarkers.current.get(selectedPoiId) === selectedMarker) { // Double check selection
                 selectedMarker.openPopup();
              }
           });
        }
        map.off('moveend', openPopupOnMoveEnd); // Clean up the initial flyTo listener
      };
      map.on('moveend', openPopupOnMoveEnd);
    }
  }, [selectedPoiId]);

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
      
      // Create a unique key using the POI ID or coordinates
      const uniqueKey = poi.osm_id || poi.id || `${poi.lat}-${poi.lon}`;
      const isSelected = selectedPoiId === uniqueKey;
      
      console.log('[Map] Adding POI marker:', {
        key: uniqueKey,
        name: poi.name,
        type: poi.type,
        lat: poiLat,
        lon: poiLon,
        isSelected
      });
      
      const marker = L.marker([poiLat, poiLon], {
        icon: isSelected ? selectedPoiIcon : defaultIcons.poiIcon
      }).addTo(mapRef.current!);

      // Add click handler to the marker
      marker.on('click', () => {
        if (onPoiSelect) {
          onPoiSelect(uniqueKey);
        }
      });

      // Create popup content with more details
      const popupContent = `
        <div class="max-w-[330px]">
          <div class="font-medium text-lg">${poi.name || (poi.tags && poi.tags.name) || 'Unnamed Location'}</div>
          <div class="text-muted-foreground text-sm">
            ${poi.type || (poi.tags && (poi.tags.amenity || poi.tags.leisure || poi.tags.tourism)) || 'Unknown Type'}
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
          ${poi.travelTimeFromStart && poi.travelTimeFromEnd ? `
            <div class="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div>
                <div class="font-medium">From Loc 1:</div>
                <div>${Math.round(poi.travelTimeFromStart / 60)} min</div>
                <div>${Math.round((poi.distanceFromStart / 1000) * 0.621371)} mi</div>
              </div>
              <div>
                <div class="font-medium">From Loc 2:</div>
                <div>${Math.round(poi.travelTimeFromEnd / 60)} min</div>
                <div>${Math.round((poi.distanceFromEnd / 1000) * 0.621371)} mi</div>
              </div>
            </div>
          ` : ''}
          ${poi.travelTimeDifference ? `
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
      
      // If this is the selected POI, open its popup
      if (isSelected && mapRef.current) {
        setTimeout(() => {
          mapRef.current?.setView([poiLat, poiLon], 16);
          marker.openPopup();
        }, 100);
      }
    });

    return () => {
      // Clean up markers on unmount
      poiMarkers.current.forEach(marker => marker.remove());
      poiMarkers.current.clear();
    };
  }, [pois, showPois, selectedPoiId, onPoiSelect]);

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
            <div className="font-medium">Location 1</div>
            <div className="text-sm text-muted-foreground">{startAddress}</div>
          </Popup>
        </Marker>

        {/* End Marker */}
        <Marker position={[eLat, eLng]} icon={defaultIcons.endIcon}>
          <Popup>
            <div className="font-medium">Location 2</div>
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
          <Marker position={[amLat, amLng]} icon={defaultIcons.alternateMidpointIcon}>
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
