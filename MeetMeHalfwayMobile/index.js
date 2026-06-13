/**
 * Custom entry: polyfill + auth session before router; swallow fatal JS errors in
 * production so TestFlight shows FatalStartupErrorScreen instead of instant abort.
 */
'use strict';

const fatal = require('./src/lib/fatalStartupError');
const { debugBootLog } = require('./src/lib/debugBootLog');
const { setIosBootPhase } = require('./src/lib/iosBootPhase');

setIosBootPhase('index-entry');

// #region agent log
debugBootLog('G', 'index.js:entry', 'custom entry started', {
  minimalBoot: process.env.EXPO_PUBLIC_IOS_MINIMAL_BOOT === '1',
});
// #endregion

if (process.env.EXPO_PUBLIC_IOS_MINIMAL_BOOT === '1') {
  require('./minimal-entry');
} else {
  fatal.installEarlyFatalCapture();

  const { startIosSplashFallbackHide } = require('./src/lib/iosSplash');
  startIosSplashFallbackHide();

  require('react-native-reanimated');
  require('react-native-url-polyfill/auto');

  const WebBrowser = require('expo-web-browser');
  if (typeof WebBrowser.maybeCompleteAuthSession === 'function') {
    WebBrowser.maybeCompleteAuthSession();
  }

  require('expo-router/entry');
  fatal.installProductionFatalHandler();
  setIosBootPhase('router-entry-loaded');
  // #region agent log
  debugBootLog('G', 'index.js:after-router-entry', 'expo-router entry loaded');
  // #endregion
}
