// Polyfill de Web Crypto para React Native. DEBE ir antes que cualquier
// otro import: React Native 0.86 llama a performance.mark() (que usa
// crypto.randomUUID) muy temprano, y @noble/curves necesita
// crypto.getRandomValues para generar keys.
//
// Usamos expo-standard-web-crypto (no react-native-get-random-values)
// porque ese ultimo es modulo nativo que Expo Go NO trae empaquetado.
import { polyfillWebCrypto } from 'expo-standard-web-crypto';
polyfillWebCrypto();

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
