import React, { useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
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
import { pushApi } from './src/api';

// Tipografía de marca OPOX (Figma: familia Poppins en todas las pantallas).
// Se mantiene la splash nativa visible hasta que las fuentes cargan para
// evitar el parpadeo con la tipografía del sistema.
SplashScreen.preventAutoHideAsync().catch(() => {});

// Comportamiento de notificaciones cuando la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false, // el InAppNotificationBanner lo gestiona
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

/**
 * Solicita permiso push y registra el token Expo en el backend.
 * Llama a esta función después de que el usuario inicia sesión.
 */
export async function registerForPushNotifications() {
  // expo-notifications solo funciona en dispositivo físico (o emulador con servicios FCM)
  if (!Device.isDevice) return;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return;

  const { data: token } = await Notifications.getExpoPushTokenAsync();
  if (!token) return;

  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  // deviceId: usamos el token inicial como ID de dispositivo estable durante la sesión
  const deviceId = token.replace('ExponentPushToken[', '').replace(']', '').slice(0, 32);

  await pushApi.registerToken(token, platform, deviceId).catch(() => {});
}

function NetworkWatcher() {
  useNetworkWatcher();
  return null;
}

/**
 * Escucha el tap en una notificación push y navega a la pantalla correcta.
 * data.screen debe coincidir con los nombres registrados en OnboardingNavigator.
 */
function PushNotificationHandler() {
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data ?? {};
      const screen = data.screen;
      if (screen && navigationRef.isReady()) {
        navigationRef.navigate(screen, data.params ?? {});
      }
    });
    return () => sub.remove();
  }, []);
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
        <PushNotificationHandler />
        <OnboardingNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
