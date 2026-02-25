import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import MapView, { Marker, Polyline, LatLng, Callout } from "react-native-maps";
import { useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import { Text, View } from "@/components/Themed";
import {
  geocodeAddress,
  getTravelTimeMatrix,
  calculateDistanceKm,
  fetchMobileRoute,
} from "../../src/services/api";
import { getNearbyPois } from "../../src/services/poi";
import { saveLocation, saveSearch } from "../../src/services/storage";
import { usePlan } from "../../src/hooks/usePlan";
import { usePoi } from "../contexts/PoiContext";

type OriginInput = { id: string; address: string };
type OriginCoord = { address: string; lat: number; lng: number };

export default function TabOneScreen() {
  const {
    pois,
    setPois,
    midpoint,
    setMidpoint,
    alternateMidpoint,
    setAlternateMidpoint,
    selectedPoi,
    setSelectedPoi,
    pendingSearch,
    setPendingSearch,
  } = usePoi();
  const { tier, maxLocations } = usePlan();
  const [initialRegion, setInitialRegion] = useState<any | null>(null);
  const [userCoord, setUserCoord] = useState<{ latitude: number; longitude: number } | null>(null);
  const [origins, setOrigins] = useState<OriginInput[]>([
    { id: "origin-0", address: "" },
    { id: "origin-1", address: "" },
  ]);
  const [originCoords, setOriginCoords] = useState<OriginCoord[]>([]);
  const [loading, setLoading] = useState(false);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [alternateRouteCoords, setAlternateRouteCoords] = useState<LatLng[]>([]);
  const mapRef = useRef<MapView | null>(null);
  const [currentRegion, setCurrentRegion] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({});
      const current = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      setInitialRegion(current);
      setUserCoord({ latitude: current.latitude, longitude: current.longitude });
    })();
  }, []);

  useEffect(() => {
    if (selectedPoi && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: selectedPoi.lat,
          longitude: selectedPoi.lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000
      );
    }
  }, [selectedPoi]);

  useEffect(() => {
    if (!pendingSearch?.locations?.length) return;
    const bounded = pendingSearch.locations.slice(0, maxLocations);
    if (pendingSearch.locations.length > maxLocations) {
      Alert.alert("Plan limit", `Only the first ${maxLocations} locations were restored for your current plan.`);
    }
    setOrigins(
      bounded.map((loc, index) => ({
        id: `origin-${Date.now()}-${index}`,
        address: loc.address,
      }))
    );
    setPendingSearch(null);
  }, [pendingSearch, setPendingSearch, maxLocations]);

  const addOrigin = () => {
    if (origins.length >= maxLocations) {
      Alert.alert(
        "Upgrade required",
        `Your ${tier} plan supports up to ${maxLocations} locations.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "View Plans",
            onPress: () => Linking.openURL("https://meetmehalfway.co/pricing"),
          },
        ]
      );
      return;
    }
    setOrigins((prev) => [...prev, { id: `origin-${Date.now()}-${prev.length}`, address: "" }]);
  };

  const removeOrigin = (id: string) => {
    if (origins.length <= 2) return;
    setOrigins((prev) => prev.filter((item) => item.id !== id));
  };

  const runSearch = async () => {
    if (loading) return;
    const trimmed = origins.map((item) => item.address.trim());
    if (trimmed.length < 2 || trimmed.some((item) => !item)) {
      Alert.alert("Missing input", "Please fill all location fields.");
      return;
    }

    try {
      setLoading(true);
      const geocoded = await Promise.all(trimmed.map((address) => geocodeAddress(address)));
      if (geocoded.some((item) => !item)) {
        Alert.alert("Geocoding failed", "Please check your locations and try again.");
        return;
      }

      const resolved = geocoded.map((item, index) => ({
        address: trimmed[index],
        lat: item!.lat,
        lng: item!.lng,
      }));
      setOriginCoords(resolved);

      await Promise.all(
        resolved.map((item, index) =>
          saveLocation({
            label: item.address.split(",")[0] || `Location ${index + 1}`,
            address: item.address,
            lat: item.lat,
            lng: item.lng,
          })
        )
      );
      await saveSearch(resolved);

      let mainMid: { lat: number; lng: number } | null = null;
      let altMid: { lat: number; lng: number } | null = null;
      let mainRoute: LatLng[] = [];
      let altRoute: LatLng[] = [];

      if (resolved.length === 2) {
        const routeData = await fetchRouteData(resolved[0], resolved[1]);
        mainRoute = routeData.mainRoute;
        altRoute = routeData.alternateRoute;
        mainMid = routeData.mainMidpoint || getSimpleMidpoint(resolved[0], resolved[1]);
        altMid = routeData.alternateMidpoint;
      } else {
        mainMid = getCentroid(resolved);
      }

      setRouteCoords(mainRoute);
      setAlternateRouteCoords(altRoute);
      setMidpoint(mainMid);
      setAlternateMidpoint(altMid);

      let allPois = mainMid ? await getNearbyPois(mainMid.lat, mainMid.lng, 5000) : [];
      if (altMid) {
        const alternatePois = await getNearbyPois(altMid.lat, altMid.lng, 5000);
        allPois = mergePois(allPois, alternatePois);
      }

      if (allPois.length > 0) {
        const matrixResult = await getTravelTimeMatrix(
          resolved.map(({ lat, lng }) => ({ lat, lng })),
          allPois.map((poi) => ({ lat: poi.lat, lng: poi.lng }))
        );
        allPois = allPois.map((poi, poiIndex) => ({
          ...poi,
          travelInfo: resolved.map((origin, originIndex) => ({
            sourceIndex: originIndex,
            duration: matrixResult?.travelTimes?.[originIndex]?.[poiIndex] ?? null,
            distance:
              matrixResult?.distances?.[originIndex]?.[poiIndex] ??
              Math.round(calculateDistanceKm(origin.lat, origin.lng, poi.lat, poi.lng) * 1000),
          })),
        }));
      }
      setPois(allPois);

      const target = mainMid || (resolved.length > 0 ? { lat: resolved[0].lat, lng: resolved[0].lng } : null);
      if (target) {
        mapRef.current?.animateToRegion(
          {
            latitude: target.lat,
            longitude: target.lng,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          },
          400
        );
      }
      const fitPoints = [
        ...resolved.map((item) => ({ latitude: item.lat, longitude: item.lng })),
        ...(mainMid ? [{ latitude: mainMid.lat, longitude: mainMid.lng }] : []),
        ...(altMid ? [{ latitude: altMid.lat, longitude: altMid.lng }] : []),
        ...allPois.map((p) => ({ latitude: p.lat, longitude: p.lng })),
      ];
      if (fitPoints.length > 1) {
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(fitPoints, {
            edgePadding: { top: 100, left: 50, right: 50, bottom: 300 },
            animated: true,
          });
        }, 100);
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text className="text-xl font-semibold">Meet Me Halfway</Text>
      <Text style={styles.planText}>Plan: {tier} · Max locations: {maxLocations}</Text>
      <View style={styles.formRow}>
        {origins.map((item, index) => (
          <View key={item.id} style={styles.originRow}>
            <TextInput
              placeholder={`Location ${index + 1}`}
              value={item.address}
              onChangeText={(value) =>
                setOrigins((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, address: value } : entry)))
              }
              style={[styles.input, { flex: 1 }]}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {origins.length > 2 && (
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeOrigin(item.id)}>
                <Text style={styles.removeBtnText}>-</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        <View style={styles.row}>
          <TouchableOpacity style={styles.secondaryButton} onPress={addOrigin}>
            <Text style={styles.secondaryText}>Add Location</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={runSearch} style={[styles.button, { flex: 1 }]}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Find Midpoint</Text>}
          </TouchableOpacity>
        </View>
      </View>

      <Text style={{ paddingHorizontal: 16, alignSelf: "flex-start" }}>POIs: {pois.length}</Text>
      <View style={styles.zoomControls} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.zoomBtn}
          onPress={() => {
            const r = currentRegion || initialRegion;
            if (!r || !mapRef.current) return;
            mapRef.current.animateToRegion(
              { ...r, latitudeDelta: Math.max((r.latitudeDelta || 0.05) * 0.7, 0.002), longitudeDelta: Math.max((r.longitudeDelta || 0.05) * 0.7, 0.002) },
              200
            );
          }}
        >
          <Text style={styles.zoomText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.zoomBtn}
          onPress={() => {
            const r = currentRegion || initialRegion;
            if (!r || !mapRef.current) return;
            mapRef.current.animateToRegion(
              { ...r, latitudeDelta: (r.latitudeDelta || 0.05) / 0.7, longitudeDelta: (r.longitudeDelta || 0.05) / 0.7 },
              200
            );
          }}
        >
          <Text style={styles.zoomText}>-</Text>
        </TouchableOpacity>
      </View>

      {initialRegion && (
        <MapView
          ref={mapRef}
          style={{ flex: 1, width: "100%" }}
          region={currentRegion || initialRegion}
          onRegionChangeComplete={(r) => setCurrentRegion(r)}
          onMapReady={() => setCurrentRegion(initialRegion)}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass
          rotateEnabled
          pitchEnabled
          toolbarEnabled={false}
        >
          {userCoord && <Marker coordinate={userCoord} title="You" pinColor="#64748B" />}
          {originCoords.map((coord, index) => (
            <Marker
              key={`${coord.lat}-${coord.lng}-${index}`}
              coordinate={{ latitude: coord.lat, longitude: coord.lng }}
              title={`Location ${index + 1}`}
              pinColor="#22C55E"
            />
          ))}
          {midpoint && (
            <Marker coordinate={{ latitude: midpoint.lat, longitude: midpoint.lng }} title="Main Midpoint" pinColor="purple" />
          )}
          {alternateMidpoint && (
            <Marker coordinate={{ latitude: alternateMidpoint.lat, longitude: alternateMidpoint.lng }} title="Alternate Midpoint" pinColor="orange" />
          )}
          {routeCoords.length > 1 && <Polyline coordinates={routeCoords} strokeColor="#2563EB" strokeWidth={4} />}
          {alternateRouteCoords.length > 1 && <Polyline coordinates={alternateRouteCoords} strokeColor="#8B5CF6" strokeWidth={4} />}
          {pois.map((p, idx) => (
            <Marker
              key={`poi-${idx}`}
              coordinate={{ latitude: p.lat, longitude: p.lng }}
              pinColor={getPoiPinColor(p.type)}
              onPress={() => setSelectedPoi(p)}
            >
              <Callout style={styles.callout}>
                <View style={styles.calloutContent}>
                  <Text style={styles.calloutTitle}>{p.name || "Unknown Location"}</Text>
                  <Text style={styles.calloutType}>{p.type || "Location"}</Text>
                  {p.address && (
                    <Text style={styles.calloutAddress} numberOfLines={2}>
                      {p.address}
                    </Text>
                  )}
                  {p.travelInfo && p.travelInfo.length > 0 && (
                    <View style={styles.travelInfoContainer}>
                      <Text style={styles.travelInfoTitle}>Travel Times:</Text>
                      {p.travelInfo.map((travel, tIndex) => (
                        <View key={tIndex} style={styles.travelInfoRow}>
                          <Text style={styles.travelInfoLabel}>From {String.fromCharCode(65 + tIndex)}:</Text>
                          <Text style={styles.travelInfoValue}>
                            {formatDuration(travel.duration)} • {formatDistance(travel.distance)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                  <View style={styles.calloutButtons}>
                    <TouchableOpacity
                      style={styles.calloutBtn}
                      onPress={() => safeOpenURL(`maps://?q=${p.name || "Location"}&ll=${p.lat},${p.lng}`)}
                    >
                      <Text style={styles.calloutBtnText}>Apple</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.calloutBtn}
                      onPress={() => safeOpenURL(`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`)}
                    >
                      <Text style={styles.calloutBtnText}>Google</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.calloutBtn}
                      onPress={() => safeOpenURL(`https://waze.com/ul?ll=${p.lat},${p.lng}&navigate=yes`)}
                    >
                      <Text style={styles.calloutBtnText}>Waze</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      )}
    </View>
  );
}

function getPoiPinColor(type?: string): string {
  const t = (type || '').toLowerCase();
  if (t.includes('restaurant')) return '#EF4444'; // red
  if (t.includes('cafe')) return '#F59E0B'; // amber
  if (t.includes('park')) return '#22D3EE'; // cyan
  if (t.includes('hotel') || t.includes('lodg')) return '#8B5CF6'; // violet
  if (t.includes('museum') || t.includes('library')) return '#10B981'; // emerald
  return '#3B82F6'; // blue default
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "N/A";
  const minutes = Math.round(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

function formatDistance(meters: number | null): string {
  if (!meters) return "N/A";
  const miles = meters * 0.000621371;
  if (miles >= 1) {
    return `${miles.toFixed(1)} mi`;
  } else {
    const feet = Math.round(miles * 5280);
    return `${feet} ft`;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
  formRow: {
    width: '100%',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  planText: {
    color: "#6b7280",
    marginBottom: 4,
    fontSize: 12,
  },
  originRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'white',
  },
  secondaryButton: {
    borderColor: "#111827",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  secondaryText: {
    color: "#111827",
    fontWeight: "600",
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
  },
  removeBtnText: {
    color: "white",
    fontWeight: "700",
    fontSize: 18,
    lineHeight: 19,
  },
  button: {
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  zoomControls: {
    position: 'absolute',
    right: 16,
    top: 180,
    zIndex: 10,
    gap: 8,
  },
  zoomBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(17,24,39,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 22,
  },
  callout: {
    width: 280,
    minHeight: 140,
  },
  calloutContent: {
    padding: 12,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  calloutType: {
    fontSize: 14,
    color: '#6b7280',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  calloutAddress: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
    lineHeight: 16,
  },
  travelInfoContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  travelInfoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  travelInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  travelInfoLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
  },
  travelInfoValue: {
    fontSize: 11,
    color: '#111827',
    fontWeight: '600',
  },
  calloutButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  calloutBtn: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  calloutBtnText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  calloutHint: {
    fontSize: 10,
    color: '#6b7280',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

async function fetchRouteData(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): Promise<{
  mainRoute: LatLng[];
  alternateRoute: LatLng[];
  mainMidpoint: { lat: number; lng: number } | null;
  alternateMidpoint: { lat: number; lng: number } | null;
}> {
  try {
    const json = await fetchMobileRoute(a, b);
    
    // Convert coordinate arrays to LatLng format
    const mainRoute = json?.mainRoute && Array.isArray(json.mainRoute) && json.mainRoute.length > 1
      ? json.mainRoute.map((c: [number, number]) => ({ latitude: c[1], longitude: c[0] }))
      : [{ latitude: a.lat, longitude: a.lng }, { latitude: b.lat, longitude: b.lng }];
    
    const alternateRoute = json?.alternateRoute && Array.isArray(json.alternateRoute) && json.alternateRoute.length > 1
      ? json.alternateRoute.map((c: [number, number]) => ({ latitude: c[1], longitude: c[0] }))
      : [];
    
    return {
      mainRoute,
      alternateRoute,
      mainMidpoint: json?.mainMidpoint || null,
      alternateMidpoint: json?.alternateMidpoint || null,
    };
  } catch {
    // Fallback: straight line
    return {
      mainRoute: [
        { latitude: a.lat, longitude: a.lng },
        { latitude: b.lat, longitude: b.lng },
      ],
      alternateRoute: [],
      mainMidpoint: null,
      alternateMidpoint: null,
    };
  }
}

function getSimpleMidpoint(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  return {
    lat: (a.lat + b.lat) / 2,
    lng: (a.lng + b.lng) / 2,
  };
}

function getCentroid(points: Array<{ lat: number; lng: number }>) {
  const total = points.reduce(
    (acc, point) => ({ lat: acc.lat + point.lat, lng: acc.lng + point.lng }),
    { lat: 0, lng: 0 }
  );
  return { lat: total.lat / points.length, lng: total.lng / points.length };
}

function mergePois(base: any[], next: any[]) {
  const merged = [...base];
  next.forEach((poi) => {
    const duplicate = merged.some(
      (existing) => Math.abs(existing.lat - poi.lat) < 0.0001 && Math.abs(existing.lng - poi.lng) < 0.0001
    );
    if (!duplicate) merged.push(poi);
  });
  return merged;
}

function safeOpenURL(url: string) {
  Linking.openURL(url).catch(() => {
    Alert.alert("Navigation Error", "Could not open the selected map app.");
  });
}
