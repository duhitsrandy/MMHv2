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
  selectedRoute: "main" | "alternate"
  onRouteSelect: (route: "main" | "alternate") => void
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
  selectedRoute,
  onRouteSelect,
  pois = [],
  showPois = false
}: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);

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

  return (
    <div className="h-[600px] w-full">
      <MapContainer
        center={[mLat, mLng]}
        zoom={13}
        className="h-full w-full rounded-lg"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Main Route */}
        {mainRouteCoords.length > 0 && (
          <Polyline
            positions={mainRouteCoords}
            pathOptions={{
              color: selectedRoute === "main" ? "#3b82f6" : "#93c5fd",
              weight: selectedRoute === "main" ? 6 : 4,
              opacity: selectedRoute === "main" ? 1 : 0.7
            }}
            eventHandlers={{
              click: () => onRouteSelect("main")
            }}
          />
        )}

        {/* Alternate Route */}
        {alternateRouteCoords.length > 0 && showAlternateRoute && (
          <Polyline
            positions={alternateRouteCoords}
            pathOptions={{
              color: selectedRoute === "alternate" ? "#9333ea" : "#c084fc",
              weight: selectedRoute === "alternate" ? 6 : 5,
              opacity: selectedRoute === "alternate" ? 1 : 0.85
            }}
            eventHandlers={{
              click: () => onRouteSelect("alternate")
            }}
          />
        )}

        {/* Start Marker */}
        <Marker position={[sLat, sLng]} icon={defaultIcons.startIcon}>
          <Popup>
            <div className="font-medium">Start: {startAddress}</div>
          </Popup>
        </Marker>

        {/* End Marker */}
        <Marker position={[eLat, eLng]} icon={defaultIcons.endIcon}>
          <Popup>
            <div className="font-medium">End: {endAddress}</div>
          </Popup>
        </Marker>

        {/* Main Midpoint Marker */}
        <Marker
          position={[mLat, mLng]}
          icon={defaultIcons.midpointIcon}
          eventHandlers={{
            click: () => onRouteSelect("main")
          }}
        >
          <Popup>
            <div className="font-medium">Midpoint (Main Route)</div>
          </Popup>
        </Marker>

        {/* Alternate Midpoint Marker */}
        {showAlternateRoute && (
          <Marker
            position={[amLat, amLng]}
            icon={defaultIcons.midpointIcon}
            eventHandlers={{
              click: () => onRouteSelect("alternate")
            }}
          >
            <Popup>
              <div className="font-medium">Midpoint (Alternate Route)</div>
            </Popup>
          </Marker>
        )}

        {/* POI Markers */}
        {showPois &&
          pois.map((poi: any, index: number) => (
            <Marker
              key={`poi-${poi.osm_id || poi.id || `${poi.lat}-${poi.lon}-${index}`}`}
              position={[Number(poi.lat) || 0, Number(poi.lon) || 0]}
              icon={defaultIcons.poiIcon}
            >
              <Popup>
                <div className="max-w-[200px]">
                  <div className="font-medium">{poi.name || (poi.tags && poi.tags.name) || 'Unnamed Location'}</div>
                  <div className="text-muted-foreground text-sm">
                    {poi.type || (poi.tags && (poi.tags.amenity || poi.tags.leisure || poi.tags.tourism)) || 'Unknown Type'}
                  </div>
                  {poi.address && (
                    <div className="text-muted-foreground mt-1 text-sm">
                      {[
                        poi.address.road,
                        poi.address.house_number,
                        poi.address.city
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                  )}
                  {poi.travelTimeFromStart && poi.travelTimeFromEnd && (
                    <div className="mt-2 text-sm">
                      <div>From Start: {Math.round(poi.travelTimeFromStart / 60)}min</div>
                      <div>From End: {Math.round(poi.travelTimeFromEnd / 60)}min</div>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Fit bounds to route */}
        <FitBounds
          route={selectedRoute === "main" ? mainRoute : alternateRoute}
        />
      </MapContainer>
    </div>
  )
}
