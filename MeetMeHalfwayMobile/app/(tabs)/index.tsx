import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { debugBootLog } from '@/src/lib/debugBootLog';
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
    let cancelled = false;
    import('./MapTabScreen')
      .then((mod) => {
        // #region agent log
        debugBootLog('E', '(tabs)/index.tsx:map-import', 'MapTabScreen import resolved');
        // #endregion
        if (!cancelled) setMapTabScreen(() => mod.default);
      })
      .catch((err: unknown) => {
        // #region agent log
        debugBootLog('E', '(tabs)/index.tsx:map-import', 'MapTabScreen import failed', {
          message: err instanceof Error ? err.message : String(err),
        });
        // #endregion
      });
    return () => {
      cancelled = true;
    };
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
