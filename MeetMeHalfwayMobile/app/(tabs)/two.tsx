import { StyleSheet, FlatList, TouchableOpacity, Linking, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';

import { Text, View } from '@/components/Themed';
import { usePoi } from '../contexts/PoiContext';

type TravelInfo = {
  duration: number | null; // seconds
  distance: number | null; // meters
  sourceIndex: number;
};

type PoiType = {
  lat: number;
  lng: number;
  name?: string;
  address?: string;
  type?: string;
  travelInfo?: TravelInfo[];
};

export default function TabTwoScreen() {
  const { pois, midpoint, selectedPoi, setSelectedPoi } = usePoi();
  const [filter, setFilter] = useState<string>('all');
  const router = useRouter();

  const filteredPois = pois.filter(poi => {
    if (filter === 'all') return true;
    return (poi.type || '').toLowerCase().includes(filter.toLowerCase());
  });

  const openInAppleMaps = (poi: PoiType) => {
    const url = `maps://?q=${poi.name || 'Location'}&ll=${poi.lat},${poi.lng}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open Apple Maps');
    });
  };

  const openInGoogleMaps = (poi: PoiType) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${poi.lat},${poi.lng}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open Google Maps');
    });
  };

  const openInWaze = (poi: PoiType) => {
    const url = `https://waze.com/ul?ll=${poi.lat},${poi.lng}&navigate=yes`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open Waze');
    });
  };

  const viewOnMap = (poi: PoiType) => {
    setSelectedPoi(poi);
    router.push('/(tabs)/'); // Navigate to Tab One (Map)
  };

  const getPoiColor = (type?: string): string => {
    const t = (type || '').toLowerCase();
    if (t.includes('restaurant')) return '#EF4444'; // red
    if (t.includes('cafe')) return '#F59E0B'; // amber
    if (t.includes('park')) return '#22D3EE'; // cyan
    if (t.includes('hotel') || t.includes('lodg')) return '#8B5CF6'; // violet
    if (t.includes('museum') || t.includes('library')) return '#10B981'; // emerald
    return '#3B82F6'; // blue default
  };

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return "N/A";
    const minutes = Math.round(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDistance = (meters: number | null): string => {
    if (!meters) return "N/A";
    const miles = meters * 0.000621371;
    if (miles >= 1) {
      return `${miles.toFixed(1)} mi`;
    } else {
      const feet = Math.round(miles * 5280);
      return `${feet} ft`;
    }
  };

  const renderPoiItem = ({ item }: { item: PoiType }) => (
    <View style={styles.poiItem}>
      <View style={styles.poiHeader}>
        <View style={[styles.poiDot, { backgroundColor: getPoiColor(item.type) }]} />
        <View style={styles.poiInfo}>
          <Text style={styles.poiName}>{item.name || 'Unknown Location'}</Text>
          <Text style={styles.poiType}>{item.type || 'Location'}</Text>
          {item.address && (
            <Text style={styles.poiAddress} numberOfLines={2}>
              {item.address}
            </Text>
          )}
        </View>
      </View>

      {/* Travel Time Information */}
      {item.travelInfo && item.travelInfo.length > 0 && (
        <View style={styles.travelInfoContainer}>
          <Text style={styles.travelInfoTitle}>Travel Times:</Text>
          {item.travelInfo.map((travel, idx) => (
            <View key={idx} style={styles.travelInfoRow}>
              <Text style={styles.travelInfoLabel}>From {String.fromCharCode(65 + idx)}:</Text>
              <Text style={styles.travelInfoValue}>
                {formatDuration(travel.duration)} • {formatDistance(travel.distance)}
              </Text>
            </View>
          ))}
        </View>
      )}
      
      <View style={styles.viewMapContainer}>
        <TouchableOpacity 
          style={styles.viewMapBtn} 
          onPress={() => viewOnMap(item)}
        >
          <FontAwesome name="map-marker" size={16} color="#3B82F6" />
          <Text style={styles.viewMapText}>View on Map</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.appleMapsBtn]} 
          onPress={() => openInAppleMaps(item)}
        >
          <FontAwesome name="map" size={14} color="white" />
          <Text style={styles.actionBtnText}>Apple</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionBtn, styles.googleMapsBtn]} 
          onPress={() => openInGoogleMaps(item)}
        >
          <FontAwesome name="globe" size={14} color="white" />
          <Text style={styles.actionBtnText}>Google</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionBtn, styles.wazeBtn]} 
          onPress={() => openInWaze(item)}
        >
          <FontAwesome name="car" size={14} color="white" />
          <Text style={styles.actionBtnText}>Waze</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Points of Interest</Text>
        <Text style={styles.subtitle}>{filteredPois.length} locations found</Text>
      </View>

      {pois.length === 0 ? (
        <View style={styles.emptyState}>
          <FontAwesome name="map-marker" size={48} color="#9CA3AF" />
          <Text style={styles.emptyText}>No POIs found</Text>
          <Text style={styles.emptySubtext}>Search for locations on the Map tab</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPois}
          renderItem={renderPoiItem}
          keyExtractor={(item, index) => `poi-${index}`}
          style={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  list: {
    flex: 1,
  },
  poiItem: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  poiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  poiDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  poiInfo: {
    flex: 1,
  },
  poiName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  poiType: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  poiAddress: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    lineHeight: 16,
  },
  travelInfoContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
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
  viewMapContainer: {
    marginBottom: 12,
  },
  viewMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    gap: 6,
  },
  viewMapText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
  },
  actionBtnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  appleMapsBtn: {
    backgroundColor: '#000000',
  },
  googleMapsBtn: {
    backgroundColor: '#4285f4',
  },
  wazeBtn: {
    backgroundColor: '#00d4ff',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
});
