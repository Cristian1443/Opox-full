import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import OnboardingNavigator from './src/navigation/OnboardingNavigator';
import { navigationRef } from './src/navigation/navigationRef';
import useNetworkWatcher from './src/hooks/useNetworkWatcher';

function NetworkWatcher() {
  useNetworkWatcher();
  return null;
}

// Deep link de recuperación de contraseña: opox://reset-password?token_hash=...&type=recovery
// (o el equivalente exp://.../--/reset-password en Expo Go durante desarrollo).
// El token_hash llega como query param y React Navigation lo vuelca tal
// cual en route.params — RecuperarPasswordNuevaScreen lo lee de ahí.
const linking = {
  prefixes: [Linking.createURL('/'), 'opox://'],
  config: {
    screens: {
      RecuperarPasswordNueva: 'reset-password',
    },
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef} linking={linking}>
        <NetworkWatcher />
        <OnboardingNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
