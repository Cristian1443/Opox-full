import React, { useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import OnboardingNavigator from './src/navigation/OnboardingNavigator';
import { navigationRef } from './src/navigation/navigationRef';
import useNetworkWatcher from './src/hooks/useNetworkWatcher';

// Tipografía de marca OPOX (Figma: familia Poppins en todas las pantallas).
// Se mantiene la splash nativa visible hasta que las fuentes cargan para
// evitar el parpadeo con la tipografía del sistema.
SplashScreen.preventAutoHideAsync().catch(() => {});

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
  const [fontsLoaded] = useFonts({
    'Poppins-Light': Poppins_300Light,
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <NavigationContainer ref={navigationRef} linking={linking}>
        <NetworkWatcher />
        <OnboardingNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
