import { StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import MapView, { Marker, Polyline, LatLng, Callout } from 'react-native-maps';
import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { geocodeAddress, getTravelTimeMatrix, calculateDistanceKm } from '../../src/services/api';
import { getNearbyPois } from '../../src/services/poi';

import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/Themed';
import { usePoi } from '../contexts/PoiContext';

export default function TabOneScreen() {
  const { pois, setPois, midpoint, setMidpoint, alternateMidpoint, setAlternateMidpoint, selectedPoi, setSelectedPoi } = usePoi();
  const [initialRegion, setInitialRegion] = useState<any | null>(null);
  const [userCoord, setUserCoord] = useState<{ latitude: number; longitude: number } | null>(null);
  const [addrA, setAddrA] = useState('');
  const [addrB, setAddrB] = useState('');
  const [loading, setLoading] = useState(false);
  const [addrACoord, setAddrACoord] = useState<{ lat: number; lng: number } | null>(null);
  const [addrBCoord, setAddrBCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [alternateRouteCoords, setAlternateRouteCoords] = useState<LatLng[]>([]);
  const mapRef = useRef<MapView | null>(null);
  const [currentRegion, setCurrentRegion] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
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

  // Center map on selected POI when coming from POI list
  useEffect(() => {
    if (selectedPoi && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: selectedPoi.lat,
        longitude: selectedPoi.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  }, [selectedPoi]);

  return (
    <View style={styles.container}>
      <Text className="text-xl font-semibold">Meet Me Halfway</Text>
      <View style={styles.formRow}>
        <TextInput
          placeholder="Address A"
          value={addrA}
          onChangeText={setAddrA}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          placeholder="Address B"
          value={addrB}
          onChangeText={setAddrB}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          onPress={async () => {
            if (!addrA || !addrB) return;
            try {
              setLoading(true);
              const a = await geocodeAddress(addrA);
              const b = await geocodeAddress(addrB);
              if (!a || !b) {
                Alert.alert('Geocoding failed', 'Please check the addresses and try again.');
                return;
              }
              setAddrACoord(a);
              setAddrBCoord(b);
              
              // Fetch route data with dual routes and midpoints
              try {
                const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL as string;
                const routeData = await fetchRouteData(apiBase, a, b);
                
                // Set routes
                setRouteCoords(routeData.mainRoute);
                setAlternateRouteCoords(routeData.alternateRoute);
                
                // Set midpoints (use route midpoints if available, fallback to simple midpoint)
                const mainMid = routeData.mainMidpoint || {
                  lat: (a.lat + b.lat) / 2,
                  lng: (a.lng + b.lng) / 2,
                };
                setMidpoint(mainMid);
                
                if (routeData.alternateMidpoint) {
                  setAlternateMidpoint(routeData.alternateMidpoint);
                }
                
                // Load POIs near both midpoints
                let allPois: any[] = [];
                
                // Load POIs around main midpoint
                const mainPois = await getNearbyPois(mainMid.lat, mainMid.lng, 5000);
                allPois = [...mainPois];
                
                // Load POIs around alternate midpoint if it exists
                if (routeData.alternateMidpoint) {
                  const altPois = await getNearbyPois(routeData.alternateMidpoint.lat, routeData.alternateMidpoint.lng, 5000);
                  // Merge and deduplicate POIs (avoid duplicates within ~100m)
                  altPois.forEach(poi => {
                    const isDuplicate = allPois.some(existing => {
                      const distance = Math.sqrt(
                        Math.pow(existing.lat - poi.lat, 2) + Math.pow(existing.lng - poi.lng, 2)
                      );
                      return distance < 0.001; // ~100m threshold
                    });
                    if (!isDuplicate) {
                      allPois.push(poi);
                    }
                  });
                }
                
                // Calculate travel times and distances from origins to POIs
                if (allPois.length > 0) {
                  try {
                    console.log('Calculating travel times for', allPois.length, 'POIs...');
                    const origins = [a, b]; // Two origins for now
                    const destinations = allPois.map(poi => ({ lat: poi.lat, lng: poi.lng }));
                    
                    const matrixResult = await getTravelTimeMatrix(origins, destinations);
                    
                    if (matrixResult && matrixResult.travelTimes && matrixResult.distances) {
                      // Enrich POIs with travel information
                      const enrichedPois = allPois.map((poi, poiIndex) => {
                        const travelInfo = origins.map((origin, originIndex) => ({
                          sourceIndex: originIndex,
                          duration: matrixResult.travelTimes?.[originIndex]?.[poiIndex] || null,
                          distance: matrixResult.distances?.[originIndex]?.[poiIndex] || null,
                        }));
                        
                        return { ...poi, travelInfo };
                      });
                      
                      allPois = enrichedPois;
                      console.log('Successfully enriched POIs with travel times');
                    } else {
                      console.warn('Travel time matrix calculation failed, using fallback distances');
                      // Fallback to simple distance calculations
                      const enrichedPois = allPois.map(poi => {
                        const travelInfo = origins.map((origin, originIndex) => ({
                          sourceIndex: originIndex,
                          duration: null, // No duration without routing
                          distance: Math.round(calculateDistanceKm(origin.lat, origin.lng, poi.lat, poi.lng) * 1000), // Convert km to meters
                        }));
                        
                        return { ...poi, travelInfo };
                      });
                      
                      allPois = enrichedPois;
                    }
                  } catch (error) {
                    console.error('Error calculating travel times:', error);
                  }
                }
                
                setPois(allPois);
              } catch (error) {
                console.error('Route fetching error:', error);
                // Fallback to simple midpoint and straight line
                const mid = {
                  lat: (a.lat + b.lat) / 2,
                  lng: (a.lng + b.lng) / 2,
                };
                setMidpoint(mid);
                setAlternateMidpoint(null);
                setRouteCoords([
                  { latitude: a.lat, longitude: a.lng },
                  { latitude: b.lat, longitude: b.lng },
                ]);
                setAlternateRouteCoords([]);
                
                const nearby = await getNearbyPois(mid.lat, mid.lng, 5000);
                setPois(nearby);
              }
              
              // Get final midpoint for centering
              const finalMidpoint = midpoint || {
                lat: (a.lat + b.lat) / 2,
                lng: (a.lng + b.lng) / 2,
              };
              
              // Center to midpoint
              mapRef.current?.animateToRegion({
                latitude: finalMidpoint.lat,
                longitude: finalMidpoint.lng,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }, 500);
              
              // Fit to show A, B, and midpoints
              const coords = [
                { latitude: a.lat, longitude: a.lng },
                { latitude: b.lat, longitude: b.lng },
                { latitude: finalMidpoint.lat, longitude: finalMidpoint.lng },
                ...(alternateMidpoint ? [{ latitude: alternateMidpoint.lat, longitude: alternateMidpoint.lng }] : []),
                ...pois.map((p) => ({ latitude: p.lat, longitude: p.lng })),
              ];
              setTimeout(() => {
                mapRef.current?.fitToCoordinates(coords, {
                  edgePadding: { top: 100, left: 50, right: 50, bottom: 300 },
                  animated: true,
                });
              }, 50);
            } catch (e: any) {
              Alert.alert('Error', e?.message ?? 'Unknown error');
            } finally {
              setLoading(false);
            }
          }}
          style={styles.button}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Find Midpoint</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={{ paddingHorizontal: 16, alignSelf: 'flex-start' }}>POIs: {pois.length}</Text>
      {/* Simple Zoom Controls for Simulator */}
      <View style={styles.zoomControls} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.zoomBtn}
          onPress={() => {
            const r = currentRegion || initialRegion;
            if (!r || !mapRef.current) return;
            const nd = Math.max((r.latitudeDelta || 0.05) * 0.7, 0.002);
            const md = Math.max((r.longitudeDelta || 0.05) * 0.7, 0.002);
            mapRef.current.animateToRegion({ ...r, latitudeDelta: nd, longitudeDelta: md }, 200);
          }}
        >
          <Text style={styles.zoomText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.zoomBtn}
          onPress={() => {
            const r = currentRegion || initialRegion;
            if (!r || !mapRef.current) return;
            const nd = (r.latitudeDelta || 0.05) / 0.7;
            const md = (r.longitudeDelta || 0.05) / 0.7;
            mapRef.current.animateToRegion({ ...r, latitudeDelta: nd, longitudeDelta: md }, 200);
          }}
        >
          <Text style={styles.zoomText}>-</Text>
        </TouchableOpacity>
      </View>
      {initialRegion && (
        <MapView
          ref={mapRef}
          style={{ flex: 1, width: '100%' }}
          region={currentRegion || initialRegion}
          onRegionChangeComplete={(r) => setCurrentRegion(r)}
          onMapReady={() => {
            // Force map to render properly on mount
            if (mapRef.current && initialRegion) {
              setCurrentRegion(initialRegion);
              setTimeout(() => {
                mapRef.current?.animateToRegion(initialRegion, 300);
              }, 500);
            }
          }}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={true}
          rotateEnabled={true}
          pitchEnabled={true}
          toolbarEnabled={false}
        >
          {userCoord && (
            <Marker coordinate={userCoord} title="You" pinColor="#64748B" />
          )}
          {addrACoord && (
            <Marker coordinate={{ latitude: addrACoord.lat, longitude: addrACoord.lng }} title="A" pinColor="#22C55E" />
          )}
          {addrBCoord && (
            <Marker coordinate={{ latitude: addrBCoord.lat, longitude: addrBCoord.lng }} title="B" pinColor="#22C55E" />
          )}
          {midpoint && (
            <Marker
              coordinate={{ latitude: midpoint.lat, longitude: midpoint.lng }}
              title="Main Route Midpoint"
              pinColor="purple"
            />
          )}
          {alternateMidpoint && (
            <Marker
              coordinate={{ latitude: alternateMidpoint.lat, longitude: alternateMidpoint.lng }}
              title="Alternate Route Midpoint"
              pinColor="orange"
            />
          )}
          {routeCoords.length > 1 && (
            <Polyline
              coordinates={routeCoords}
              strokeColor="#2563EB"
              strokeWidth={4}
            />
          )}
          {alternateRouteCoords.length > 1 && (
            <Polyline
              coordinates={alternateRouteCoords}
              strokeColor="#8B5CF6"
              strokeWidth={4}
            />
          )}
          {pois.map((p, idx) => (
            <Marker
              key={`poi-${idx}`}
              coordinate={{ latitude: p.lat, longitude: p.lng }}
              pinColor={getPoiPinColor(p.type)}
              onPress={() => setSelectedPoi(p)}
            >
              <Callout style={styles.callout}>
                <View style={styles.calloutContent}>
                  <Text style={styles.calloutTitle}>{p.name || 'Unknown Location'}</Text>
                  <Text style={styles.calloutType}>{p.type || 'Location'}</Text>
                  {p.address && (
                    <Text style={styles.calloutAddress} numberOfLines={2}>
                      {p.address}
                    </Text>
                  )}
                  
                  {/* Travel Time Information */}
                  {p.travelInfo && p.travelInfo.length > 0 && (
                    <View style={styles.travelInfoContainer}>
                      <Text style={styles.travelInfoTitle}>Travel Times:</Text>
                      {p.travelInfo.map((travel, idx) => (
                        <View key={idx} style={styles.travelInfoRow}>
                          <Text style={styles.travelInfoLabel}>From {String.fromCharCode(65 + idx)}:</Text>
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
                      onPress={() => {
                        const url = `maps://?q=${p.name || 'Location'}&ll=${p.lat},${p.lng}`;
                        Linking.openURL(url);
                      }}
                    >
                      <Text style={styles.calloutBtnText}>Apple</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.calloutBtn}
                      onPress={() => {
                        const url = `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`;
                        Linking.openURL(url);
                      }}
                    >
                      <Text style={styles.calloutBtnText}>Google</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.calloutBtn}
                      onPress={() => {
                        const url = `https://waze.com/ul?ll=${p.lat},${p.lng}&navigate=yes`;
                        Linking.openURL(url);
                      }}
                    >
                      <Text style={styles.calloutBtnText}>Waze</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.calloutHint}>Tap outside to close</Text>
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
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'white',
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
  apiBase: string,
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): Promise<{
  mainRoute: LatLng[];
  alternateRoute: LatLng[];
  mainMidpoint: { lat: number; lng: number } | null;
  alternateMidpoint: { lat: number; lng: number } | null;
}> {
  try {
    const res = await fetch(`${apiBase}/api/ors/test-route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startLat: a.lat, startLon: a.lng, endLat: b.lat, endLon: b.lng }),
    });
    if (!res.ok) throw new Error(`route ${res.status}`);
    const json = await res.json();
    
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
