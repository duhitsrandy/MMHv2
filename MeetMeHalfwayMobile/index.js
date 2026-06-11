/**
 * Custom entry: polyfill URL before Clerk/router, load expo-router, then capture fatal JS errors.
 * Use require() (not import) so handler chaining runs after RN installs its default handler.
 */
'use strict';

require('react-native-url-polyfill/auto');

const WebBrowser = require('expo-web-browser');
if (typeof WebBrowser.maybeCompleteAuthSession === 'function') {
  WebBrowser.maybeCompleteAuthSession();
}

const { wrapGlobalErrorHandler } = require('./src/lib/fatalStartupError');

require('expo-router/entry');

wrapGlobalErrorHandler();
