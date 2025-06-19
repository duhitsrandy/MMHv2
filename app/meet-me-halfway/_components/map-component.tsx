"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import L, { Icon, Map as LeafletMap } from "leaflet"
import "leaflet/dist/leaflet.css"
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  useMap,
  Popup
} from "react-leaflet"
import { EnrichedPoi, TravelInfo } from "@/types/poi-types"
import { OsrmRoute, GeocodedOrigin, UserPlan } from "@/types"
import { Loader2 } from "lucide-react"

// Use default Leaflet markers for now
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  iconUrl: "/leaflet/marker-icon.png",
  shadowUrl: "/leaflet/marker-shadow.png"
})

// Create a custom red icon for the midpoint/central midpoint
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

// Create a custom green icon for origin locations (example)
// const greenIcon = new L.Icon({
//   iconUrl: "/leaflet/marker-icon-green.png",
//   iconRetinaUrl: "/leaflet/marker-icon-2x-green.png",
//   shadowUrl: "/leaflet/marker-shadow.png",
//   iconSize: [25, 41],
//   iconAnchor: [12, 41],
//   popupAnchor: [1, -34],
//   shadowSize: [41, 41]
// })

interface Icons {
  midpointIcon: L.Icon
  alternateMidpointIcon: L.Icon
  poiIcon: L.Icon.Default
  originIcon: L.Icon
}

const icons: Icons = {
  midpointIcon: redIcon,
  alternateMidpointIcon: purpleIcon,
  poiIcon: new L.Icon.Default(),
  originIcon: new L.Icon.Default() as L.Icon,
}

interface MapComponentProps {
  origins: GeocodedOrigin[]
  midpoint: { lat: number; lng: number } | null
  alternateMidpoint: { lat: number; lng: number } | null
  centralMidpoint: { lat: number; lng: number } | null
  mainRoute?: OsrmRoute | null
  alternateRoute?: OsrmRoute | null
  showAlternateRoute?: boolean
  pois?: EnrichedPoi[]
  showPois?: boolean
  selectedPoiId?: string
  onPoiSelect?: (poiId: string) => void
  isLoading?: boolean
  plan: UserPlan | null
}

function FitBounds({
  boundsElements
}: {
  boundsElements: { routes?: (OsrmRoute | null | undefined)[], origins?: GeocodedOrigin[], centralMidpoint?: {lat: number, lng: number} | null }
}) {
  const map = useMap()

  useEffect(() => {
    if (!map) return

    const bounds = L.latLngBounds([])
    let hasElements = false

    boundsElements.routes?.forEach(route => {
      if (route?.geometry?.coordinates) {
        route.geometry.coordinates.forEach((coord: [number, number]) => {
          bounds.extend([coord[1], coord[0]] as L.LatLngTuple)
          hasElements = true
        })
      }
    })

    boundsElements.origins?.forEach(origin => {
      try {
        const lat = parseFloat(origin.lat)
        const lng = parseFloat(origin.lng)
        if (!isNaN(lat) && !isNaN(lng)) {
          bounds.extend([lat, lng] as L.LatLngTuple)
          hasElements = true
        }
      } catch (e) { console.error("Error parsing origin coords for bounds:", e) }
    })

    if (boundsElements.centralMidpoint) {
      bounds.extend([boundsElements.centralMidpoint.lat, boundsElements.centralMidpoint.lng] as L.LatLngTuple)
      hasElements = true
    }

    if (hasElements && bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 14
      })
    } else if (boundsElements.origins && boundsElements.origins.length === 1) {
      try {
        const lat = parseFloat(boundsElements.origins[0].lat)
        const lng = parseFloat(boundsElements.origins[0].lng)
        if (!isNaN(lat) && !isNaN(lng)) {
          map.setView([lat, lng], 13)
        }
      } catch (e) { console.error("Error parsing single origin coords:", e) }
    }

  }, [map, boundsElements])

  return null
}

// *** NEW COMPONENT for POI Markers ***
interface PoiMarkersLayerProps {
  pois: EnrichedPoi[];
  origins: GeocodedOrigin[];
  showPois: boolean;
  selectedPoiId?: string;
  onPoiSelect?: (poiId: string) => void;
  icons: { poiIcon: L.Icon.Default; selectedPoiIcon: L.Icon };
  handleMarkerInteraction: (key: string, poiLat: number, poiLon: number, marker: L.Marker) => void;
  plan: UserPlan | null;
}

function PoiMarkersLayer({
  pois,
  origins,
  showPois,
  selectedPoiId,
  onPoiSelect,
  icons,
  handleMarkerInteraction,
  plan
}: PoiMarkersLayerProps) {
  const map = useMap(); // Get map instance reliably
  const poiMarkers = useRef<Map<string, L.Marker>>(new Map());
  const prevPoisRef = useRef<EnrichedPoi[]>([]);
  const prevSelectedPoiIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!showPois) {
      poiMarkers.current.forEach(marker => marker.remove());
      poiMarkers.current.clear();
      prevPoisRef.current = [];
      prevSelectedPoiIdRef.current = undefined; // Also reset selection ref
      return;
    }

    const prevPois = prevPoisRef.current;
    const prevSelectedPoiId = prevSelectedPoiIdRef.current;
    const getKey = (poi: EnrichedPoi): string => poi.osm_id || `${poi.lat}-${poi.lon}`;
    const currentPoisMap = new Map<string, EnrichedPoi>(pois.map(poi => [getKey(poi), poi]));

    // --- Refined Update Logic --- 

    // 1. Remove markers that are no longer in the current list
    poiMarkers.current.forEach((marker, key) => {
      if (!currentPoisMap.has(key)) {
        marker.off('click');
        marker.off('keydown'); // Assuming keydown was also added
        marker.remove();
        poiMarkers.current.delete(key);
      }
    });

    // 2. Add new markers or update existing ones
    currentPoisMap.forEach((poi: EnrichedPoi, key: string) => {
      const poiLat = Number(poi.lat);
      const poiLon = Number(poi.lon);

      if (isNaN(poiLat) || isNaN(poiLon)) {
        return;
      }

      const isSelected = selectedPoiId === key;
      const existingMarker = poiMarkers.current.get(key);

      if (existingMarker) {
        // Marker exists, just update icon if selection changed
        const wasSelected = prevSelectedPoiIdRef.current === key; // Check previous selection
        if (isSelected !== wasSelected) {
          existingMarker.setIcon(isSelected ? icons.selectedPoiIcon : icons.poiIcon);
        }
      } else {
        // Marker doesn't exist, create it fully
        const markerElement = L.marker([poiLat, poiLon], {
          icon: isSelected ? icons.selectedPoiIcon : icons.poiIcon,
          alt: `POI: ${poi.name || 'Unnamed Location'}`,
          keyboard: true,
        }).addTo(map);

        // Add listeners and popup
        const element = markerElement.getElement();
        if (element) {
          element.setAttribute('tabindex', '0');
          element.setAttribute('role', 'button');
          element.setAttribute('aria-label', `Point of Interest: ${poi.name || 'Unnamed Location'}, Type: ${poi.type || 'Unknown Type'}. Press Enter or Space to view details.`);

          L.DomEvent.on(element, 'keydown', (e) => {
            const keyboardEvent = e as unknown as KeyboardEvent;
            if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
              keyboardEvent.preventDefault();
              handleMarkerInteraction(key, poiLat, poiLon, markerElement);
            }
          });
        }

        markerElement.on('click', () => {
          handleMarkerInteraction(key, poiLat, poiLon, markerElement);
        });

        markerElement.bindPopup(createPopupContent(poi, origins, plan));
        
        // Add to ref
        poiMarkers.current.set(key, markerElement);
      }
    });

    // Update refs for the next run
    prevPoisRef.current = pois;
    prevSelectedPoiIdRef.current = selectedPoiId;

    // Cleanup: Remove all markers managed by this layer on unmount
    return () => {
       if (poiMarkers.current) {
           poiMarkers.current.forEach((marker: L.Marker, key: string) => {
               marker.off('click');
               marker.off('keydown');
               marker.remove();
           });
           poiMarkers.current.clear();
       }
       prevPoisRef.current = [];
       prevSelectedPoiIdRef.current = undefined;
    };

  }, [map, pois, showPois, selectedPoiId, icons, origins, handleMarkerInteraction, plan]);

  return null;
}

// Helper function (moved here or ensure it's accessible globally/imported)
function createPopupContent(poi: EnrichedPoi, originLocations: GeocodedOrigin[], plan: UserPlan | null): string {
  let content = `<div style="min-width: 220px; max-width: 280px;">`; // Add min/max width for popup consistency
  content += `<div class="font-bold text-base mb-1">${poi.name}</div>`;
  content += `<div class="text-sm text-gray-600 mb-2">${poi.type}</div>`;

  if (poi.address) {
    const street = poi.address.street || "";
    const city = poi.address.city || "";
    const shortAddress = street ? `${street}, ${city}` : city;
    if (shortAddress) {
       content += `<div class="text-xs text-gray-500 mb-2 truncate" title="${street && city ? street + ', ' + city : street || city}">${shortAddress}</div>`;
    }
  }

  if (poi.travelInfo && poi.travelInfo.length > 0) {
    content += '<div class="mt-1 text-xs">';
    content += '<table class="w-full text-left">';
    content += '<thead><tr>';
    content += '<th class="pb-0.5 font-medium text-gray-500">Origin</th>';
    content += '<th class="pb-0.5 font-medium text-gray-500 text-right">Time</th>';
    content += '<th class="pb-0.5 font-medium text-gray-500 text-right">Distance</th>';
    content += '</tr></thead><tbody>';

    poi.travelInfo.forEach((info) => {
      const originName = originLocations[info.sourceIndex]?.display_name;
      // Reduce origin label length to make room for Live tag
      const originLabel = originName 
        ? (originName.length > 18 ? originName.substring(0, 18) + '...' : originName)
        : `Loc ${info.sourceIndex + 1}`;
      const durationText = info.duration != null ? `${Math.round(info.duration / 60)} min` : "N/A";
      const distanceText = info.distance != null ? `${Math.round((info.distance / 1000) * 0.621371)} mi` : "N/A";
      
      content += '<tr>';
      content += `<td class="py-0.5 truncate" title="${originName || `Location ${info.sourceIndex + 1}`}">${originLabel}</td>`;
      content += '<td class="py-0.5 text-right whitespace-nowrap">';
      if (plan && plan === 'pro' && info.duration !== null) {
        content += '<span class="text-green-500 text-xs font-semibold mr-1" title="Includes real-time traffic">(Live)</span>';
      }
      content += durationText;
      content += '</td>';
      content += `<td class="py-0.5 text-right whitespace-nowrap">${distanceText}</td>`;
      content += '</tr>';
    });
    content += "</tbody></table></div>";
  }
  content += `</div>`; // Close main wrapper
  return content;
}

export default function MapComponent({
  origins,
  midpoint,
  alternateMidpoint,
  centralMidpoint,
  mainRoute,
  alternateRoute,
  showAlternateRoute = false,
  pois = [],
  showPois = true,
  selectedPoiId,
  onPoiSelect,
  isLoading,
  plan
}: MapComponentProps) {
  const mapRef = useRef<LeafletMap | null>(null)
  const poiMarkers = useRef<Map<string, L.Marker>>(new Map())
  const prevPoisRef = useRef<EnrichedPoi[]>([])
  const prevSelectedPoiIdRef = useRef<string | undefined>(selectedPoiId)

  const selectedPoiIcon = new L.Icon({
    iconUrl: "/leaflet/marker-icon-gold.png",
    iconRetinaUrl: "/leaflet/marker-icon-2x-gold.png",
    shadowUrl: "/leaflet/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  })

  const mainRouteCoords = useMemo(() =>
    mainRoute?.geometry?.coordinates?.map((coord: [number, number]) => [
      coord[1],
      coord[0]
    ]) || [], [mainRoute]
  )

  const alternateRouteCoords = useMemo(() =>
    alternateRoute?.geometry?.coordinates?.map((coord: [number, number]) => [
      coord[1],
      coord[0]
    ]) || [], [alternateRoute]
  )

  // Log received props
  console.log('[MapComponent] Render Props:', {
    originsCount: origins.length,
    midpoint: !!midpoint,
    alternateMidpoint: !!alternateMidpoint,
    centralMidpoint: centralMidpoint,
    mainRoute: !!mainRoute,
    alternateRoute: !!alternateRoute,
    showAlternateRoute,
    poisCount: pois.length,
    showPois,
    selectedPoiId,
    isLoading,
  });

  // Define handleMarkerInteraction - primarily updates state via onPoiSelect
  // Let the useEffect below handle map movement and popup opening
  function handleMarkerInteraction(key: string, poiLat: number, poiLon: number, marker: L.Marker) {
    const map = mapRef.current;
    if (!map) return;

    // Always update the selected state
    if (onPoiSelect) {
      onPoiSelect(key);
    }

    // OPTIONAL: Immediately open popup if already close/zoomed (can be removed if useEffect handles all cases)
    const targetLatLng = L.latLng(poiLat, poiLon);
    const targetZoom = 15;
    const currentCenter = map.getCenter();
    const currentZoom = map.getZoom();
    if (currentZoom >= targetZoom - 1 && currentCenter.distanceTo(targetLatLng) < 50) {
       if (!marker.isPopupOpen()) {
         marker.openPopup();
       }
    } else {
    }
  }

  // useEffect to react to selectedPoiId changes (e.g., from card clicks)
  useEffect(() => {
    const map = mapRef.current;

    if (!map || selectedPoiId === prevSelectedPoiIdRef.current) {
        prevSelectedPoiIdRef.current = selectedPoiId; // Update ref even if skipping
        return;
    }

    // Find the selected POI data
    const selectedPoiData = pois?.find(p => (p.osm_id || `${p.lat}-${p.lon}`) === selectedPoiId);

    if (selectedPoiData) {
      const poiLat = Number(selectedPoiData.lat);
      const poiLon = Number(selectedPoiData.lon);
      const targetLatLng = L.latLng(poiLat, poiLon);
      const targetZoom = 15;

      // Fly map to the location
      map.flyTo(targetLatLng, targetZoom, { duration: 0.8 });

      // Open standalone popup once fly-to completes
      const openPopupHandler = () => {
         const popupContent = createPopupContent(selectedPoiData, origins, plan);
         map.openPopup(popupContent, targetLatLng);
         // Clean up this specific listener
         map.off('moveend', openPopupHandler);
         map.off('zoomend', openPopupHandler);
      };

      // Add listeners for fly-to end
      map.on('moveend', openPopupHandler);
      map.on('zoomend', openPopupHandler);
      
    }

    // Update the ref for the next comparison
    prevSelectedPoiIdRef.current = selectedPoiId;

  }, [selectedPoiId, pois, origins, mapRef, plan]); // Depend on selectedPoiId, pois, origins, mapRef

  const boundsElements = useMemo(() => ({
    routes: centralMidpoint ? [] : [mainRoute, showAlternateRoute ? alternateRoute : null],
    origins: origins,
    centralMidpoint: centralMidpoint
  }), [origins, mainRoute, alternateRoute, showAlternateRoute, centralMidpoint])

  const defaultCenter: L.LatLngTuple = [39.8283, -98.5795]
  const defaultZoom = 4

  const mapCenter = useMemo(() => {
    if (centralMidpoint) return [centralMidpoint.lat, centralMidpoint.lng] as L.LatLngTuple
    if (midpoint) return [midpoint.lat, midpoint.lng] as L.LatLngTuple
    if (origins.length > 0) {
      try {
        const lat = parseFloat(origins[0].lat)
        const lng = parseFloat(origins[0].lng)
        if (!isNaN(lat) && !isNaN(lng)) return [lat, lng] as L.LatLngTuple
      } catch (e) {}
    }
    return defaultCenter
  }, [midpoint, centralMidpoint, origins])

  return (
    <div className="relative h-full w-full">
      {isLoading && (
        <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-muted-foreground">Loading Map Data...</p>
          </div>
        </div>
      )}
      <MapContainer
        center={mapCenter}
        zoom={defaultZoom}
        style={{ height: "100%", width: "100%" }}
        ref={mapRef}
        className="rounded-lg z-0"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds boundsElements={boundsElements} />

        {centralMidpoint ? (
          <>
            {origins.map((origin, index) => {
              try {
                const lat = parseFloat(origin.lat)
                const lng = parseFloat(origin.lng)
                if (isNaN(lat) || isNaN(lng)) return null
                return (
                  <Marker key={`origin-${index}`} position={[lat, lng]} icon={icons.originIcon}>
                    <Popup>
                      <div className="text-center">
                        <div className="font-medium">Location {index + 1}</div>
                        <div className="text-sm text-muted-foreground">{origin.display_name}</div>
                      </div>
                    </Popup>
                  </Marker>
                )
              } catch (e) { return null }
            })}
            <Marker position={[centralMidpoint.lat, centralMidpoint.lng]} icon={icons.midpointIcon}>
              <Popup>Central Meeting Point</Popup>
            </Marker>
          </>
        ) : (
          <>
            {mainRouteCoords.length > 0 && (
              <Polyline positions={mainRouteCoords as L.LatLngExpression[]} color="#3b82f6" weight={4} opacity={0.8} />
            )}
            {showAlternateRoute && alternateRouteCoords.length > 0 && (
              <Polyline positions={alternateRouteCoords as L.LatLngExpression[]} color="#8b5cf6" weight={4} opacity={0.8} />
            )}
            {origins.length > 0 && (() => {
              try {
                const lat = parseFloat(origins[0].lat)
                const lng = parseFloat(origins[0].lng)
                if (isNaN(lat) || isNaN(lng)) return null
                return (
                  <Marker position={[lat, lng]} icon={icons.originIcon}>
                    <Popup>
                      <div className="text-center">
                        <div className="font-medium">Location 1</div>
                        <div className="text-sm text-muted-foreground">{origins[0].display_name}</div>
                      </div>
                    </Popup>
                  </Marker>
                )
              } catch (e) { return null }
            })()}
            {origins.length > 1 && (() => {
              try {
                const lat = parseFloat(origins[1].lat)
                const lng = parseFloat(origins[1].lng)
                if (isNaN(lat) || isNaN(lng)) return null
                return (
                  <Marker position={[lat, lng]} icon={icons.originIcon}>
                    <Popup>
                      <div className="text-center">
                        <div className="font-medium">Location 2</div>
                        <div className="text-sm text-muted-foreground">{origins[1].display_name}</div>
                      </div>
                    </Popup>
                  </Marker>
                )
              } catch (e) { return null }
            })()}
            {midpoint && (
              <Marker position={[midpoint.lat, midpoint.lng]} icon={icons.midpointIcon}>
                <Popup>Midpoint</Popup>
              </Marker>
            )}
            {showAlternateRoute && alternateMidpoint && (
              <Marker position={[alternateMidpoint.lat, alternateMidpoint.lng]} icon={icons.alternateMidpointIcon}>
                <Popup>Alternate Midpoint</Popup>
              </Marker>
            )}
          </>
        )}

        {/* Render the new POI layer component */}
        <PoiMarkersLayer
          pois={pois || []}
          origins={origins}
          showPois={showPois}
          selectedPoiId={selectedPoiId}
          onPoiSelect={onPoiSelect}
          icons={{ poiIcon: icons.poiIcon, selectedPoiIcon: selectedPoiIcon }}
          handleMarkerInteraction={handleMarkerInteraction}
          plan={plan}
        />

      </MapContainer>
    </div>
  )
}
