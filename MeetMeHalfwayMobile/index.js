/**
 * Custom entry: polyfill + auth session before router; swallow fatal JS errors in
 * production so TestFlight shows FatalStartupErrorScreen instead of instant abort.
 */
'use strict';

const fatal = require('./src/lib/fatalStartupError');

if (process.env.EXPO_PUBLIC_IOS_MINIMAL_BOOT === '1') {
  require('./minimal-entry');
} else {
  fatal.installEarlyFatalCapture();

  require('react-native-reanimated');
  require('react-native-url-polyfill/auto');

  const WebBrowser = require('expo-web-browser');
  if (typeof WebBrowser.maybeCompleteAuthSession === 'function') {
    WebBrowser.maybeCompleteAuthSession();
  }

  require('expo-router/entry');
  fatal.installProductionFatalHandler();
}
