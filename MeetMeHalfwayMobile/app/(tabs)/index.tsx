import React, { Suspense, useEffect, useState } from 'react';
import { ActivityIndicator, InteractionManager, StyleSheet, View } from 'react-native';
import { iosDeferMap } from '@/src/lib/iosLaunchDiagnostics';

const MapTabScreenLazy = React.lazy(() => import('./MapTabScreen'));

function MapLaunchPlaceholder() {
  return (
    <View style={styles.placeholder}>
      <ActivityIndicator size="large" />
    </View>
  );
}

export default function MapTabRoute() {
  const [mapModuleReady, setMapModuleReady] = useState(!iosDeferMap);

  useEffect(() => {
    if (!iosDeferMap) return;
    const task = InteractionManager.runAfterInteractions(() => {
      setMapModuleReady(true);
    });
    return () => task.cancel();
  }, []);

  if (!iosDeferMap) {
    const MapTabScreen = require('./MapTabScreen').default as React.ComponentType;
    return <MapTabScreen />;
  }

  if (!mapModuleReady) {
    return <MapLaunchPlaceholder />;
  }

  return (
    <Suspense fallback={<MapLaunchPlaceholder />}>
      <MapTabScreenLazy />
    </Suspense>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
