import React, { useEffect, useState } from 'react';
import { ActivityIndicator, InteractionManager, StyleSheet, View } from 'react-native';
import { shouldDeferMapOnIos } from '@/src/lib/iosLaunchDiagnostics';

function MapLaunchPlaceholder() {
  return (
    <View style={styles.placeholder}>
      <ActivityIndicator size="large" />
    </View>
  );
}

export default function MapTabRoute() {
  const [MapTabScreen, setMapTabScreen] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    if (!shouldDeferMapOnIos) return;
    const task = InteractionManager.runAfterInteractions(() => {
      import('./MapTabScreen').then((mod) => {
        setMapTabScreen(() => mod.default);
      });
    });
    return () => task.cancel();
  }, []);

  if (!shouldDeferMapOnIos) {
    const Screen = require('./MapTabScreen').default as React.ComponentType;
    return <Screen />;
  }

  if (!MapTabScreen) {
    return <MapLaunchPlaceholder />;
  }

  const Screen = MapTabScreen;
  return <Screen />;
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
