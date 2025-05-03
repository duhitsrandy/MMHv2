"use client"

import { useEffect, useRef, useState, useMemo } from "react"
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
import { EnrichedPoi, TravelInfo } from "@/types/poi-types"
import { OsrmRoute, GeocodedOrigin } from "@/types"
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
const greenIcon = new L.Icon({
  iconUrl: "/leaflet/marker-icon-green.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x-green.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

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
  originIcon: greenIcon,
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

export default function MapComponent({
  origins,
  midpoint,
  alternateMidpoint,
  centralMidpoint,
  mainRoute,
  alternateRoute,
  showAlternateRoute = false,
  pois = [],
  showPois = false,
  selectedPoiId,
  onPoiSelect,
  isLoading
}: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null)
  const poiMarkers = useRef<Map<string, L.Marker>>(new Map())
  const prevPoisRef = useRef<EnrichedPoi[]>([])
  const prevSelectedPoiIdRef = useRef<string | undefined>(undefined)

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

  useEffect(() => {
    const map = mapRef.current
    if (!map || !showPois) {
      poiMarkers.current.forEach(marker => marker.remove())
      poiMarkers.current.clear()
      prevPoisRef.current = []
      return
    }

    const prevPois = prevPoisRef.current
    const prevSelectedPoiId = prevSelectedPoiIdRef.current
    const getKey = (poi: EnrichedPoi) => poi.osm_id || `${poi.lat}-${poi.lon}`
    const currentPoisMap = new Map(pois.map(poi => [getKey(poi), poi]))
    const prevPoisMap = new Map(prevPois.map(poi => [getKey(poi), poi]))

    console.log('[Map] Updating POIs:', {
      currentCount: pois.length,
      prevCount: prevPois.length,
      selectedId: selectedPoiId,
      prevSelectedId: prevSelectedPoiId,
    })

    prevPoisMap.forEach((_, key) => {
      if (!currentPoisMap.has(key)) {
        const markerToRemove = poiMarkers.current.get(key)
        if (markerToRemove) {
          markerToRemove.remove()
          poiMarkers.current.delete(key)
          console.log(`[Map] Removed POI marker: ${key}`)
        }
      }
    })

    currentPoisMap.forEach((poi, key) => {
      const poiLat = Number(poi.lat)
      const poiLon = Number(poi.lon)

      if (isNaN(poiLat) || isNaN(poiLon)) {
        console.warn("[Map] Invalid POI coordinates:", poi)
        return
      }

      const isSelected = selectedPoiId === key
      const wasSelected = prevSelectedPoiId === key
      const existingMarker = poiMarkers.current.get(key)

      if (existingMarker) {
        if (isSelected !== wasSelected) {
          existingMarker.setIcon(isSelected ? selectedPoiIcon : icons.poiIcon)
          console.log(`[Map] Updated POI marker icon: ${key}, selected: ${isSelected}`)
        }
      } else {
        const markerElement = L.marker([poiLat, poiLon], {
          icon: isSelected ? selectedPoiIcon : icons.poiIcon,
          alt: `POI: ${poi.name || 'Unnamed Location'}`,
          keyboard: true,
        }).addTo(map)

        const element = markerElement.getElement()
        if (element) {
          element.setAttribute('tabindex', '0')
          element.setAttribute('role', 'button')
          element.setAttribute('aria-label', `Point of Interest: ${poi.name || 'Unnamed Location'}, Type: ${poi.type || 'Unknown Type'}. Press Enter or Space to view details.`)

          L.DomEvent.on(element, 'keydown', (e) => {
            const keyboardEvent = e as unknown as KeyboardEvent
            if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
              keyboardEvent.preventDefault()
              handleMarkerInteraction(key, poiLat, poiLon, markerElement)
            }
          })
        }

        markerElement.on('click', () => {
          handleMarkerInteraction(key, poiLat, poiLon, markerElement)
        })

        markerElement.bindPopup(createPopupContent(poi, origins))
        poiMarkers.current.set(key, markerElement)
        console.log(`[Map] Added POI marker: ${key}`)
      }
    })

    prevPoisRef.current = pois
    prevSelectedPoiIdRef.current = selectedPoiId

    return () => {
      if (mapRef.current && showPois) {
        console.log('[Map] Cleaning up POI markers on unmount/hide')
        poiMarkers.current.forEach(marker => marker.remove())
        poiMarkers.current.clear()
        prevPoisRef.current = []
        prevSelectedPoiIdRef.current = undefined
      }
    }
  }, [pois, showPois, selectedPoiId, onPoiSelect, selectedPoiIcon, mapRef, origins])

  function handleMarkerInteraction(key: string, poiLat: number, poiLon: number, marker: L.Marker) {
    const map = mapRef.current
    if (!map) return

    if (onPoiSelect) {
      onPoiSelect(key)
    }

    const targetLatLng = L.latLng(poiLat, poiLon)
    const targetZoom = 15
    const currentCenter = map.getCenter()
    const currentZoom = map.getZoom()

    if (currentZoom >= targetZoom - 1 && currentCenter.distanceTo(targetLatLng) < 50) {
      if (!marker.isPopupOpen()) {
        marker.openPopup()
      }
      return
    }

    map.flyTo(targetLatLng, targetZoom, { duration: 0.8 })

    let popupOpened = false
    const openPopupOnEnd = () => {
      if (!popupOpened) {
        const currentMarker = poiMarkers.current.get(key)
        if (currentMarker && !currentMarker.isPopupOpen()) {
          currentMarker.openPopup()
          popupOpened = true
        }
      }
      map.off('moveend', openPopupOnEnd)
      map.off('zoomend', openPopupOnEnd)
    }

    map.on('moveend', openPopupOnEnd)
    map.on('zoomend', openPopupOnEnd)
  }

  function createPopupContent(poi: EnrichedPoi, originLocations: GeocodedOrigin[]): string {
    let travelInfoHtml = ''
    if (poi.travelInfo && poi.travelInfo.length > 0) {
      travelInfoHtml = `<div class="mt-2 grid grid-cols-${Math.min(poi.travelInfo.length, 3)} gap-2 text-sm">`
      poi.travelInfo.forEach((info) => {
        const originName = originLocations[info.sourceIndex]?.display_name
        const originLabel = originName ? originName.substring(0, 15) + (originName.length > 15 ? '...' : '') : `Location ${info.sourceIndex + 1}`
        const durationText = info.duration != null ? `${Math.round(info.duration / 60)} min` : 'N/A'
        const distanceText = info.distance != null ? `${Math.round((info.distance / 1000) * 0.621371)} mi` : ''
        travelInfoHtml += `
          <div>
            <div class="font-medium">From ${originLabel}:</div>
            <div>${durationText}</div>
            <div>${distanceText}</div>
          </div>
        `
      })
      travelInfoHtml += `</div>`
    }

    return `
      <div class="max-w-[330px]">
        <div class="font-medium text-lg">${poi.name || 'Unnamed Location'}</div>
        <div class="text-muted-foreground text-sm">${poi.type || 'Unknown Type'}</div>
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
        ${travelInfoHtml}
        <div class="mt-2 text-sm text-center">
          <a href="https://www.google.com/maps/search/?api=1&query=${poi.lat},${poi.lon}" target="_blank" class="text-blue-600 hover:underline">Google Maps</a>
          <span class="mx-1 text-gray-400">|</span>
          <a href="http://maps.apple.com/?ll=${poi.lat},${poi.lon}" target="_blank" class="text-blue-600 hover:underline">Apple Maps</a>
          <span class="mx-1 text-gray-400">|</span>
          <a href="https://www.waze.com/ul?ll=${poi.lat},${poi.lon}&navigate=yes" target="_blank" class="text-blue-600 hover:underline">Waze</a>
        </div>
      </div>
    `
  }

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
      </MapContainer>
    </div>
  )
}
