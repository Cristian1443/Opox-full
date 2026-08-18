import React, { useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
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

// Desde SDK 53, las push notifications remotas no funcionan en Expo Go.
// En development build (EAS) sí funcionan. Este flag lo detecta.
const IS_EXPO_GO = Constants.appOwnership === 'expo';

// Configurar el comportamiento de notificaciones en primer plano
// Solo cuando no estamos en Expo Go para evitar el crash al arrancar.
if (!IS_EXPO_GO) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: false, // InAppNotificationBanner lo gestiona
      shouldPlaySound: false,
      shouldSetBadge: true,
    }),
  });
}

/**
 * Solicita permiso push y registra el token Expo en el backend.
 * Llamar tras login exitoso. No-op en Expo Go (SDK 53+).
 */
export async function registerForPushNotifications() {
  if (IS_EXPO_GO || !Device.isDevice) return;

  try {
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
    const deviceId = token.replace('ExponentPushToken[', '').replace(']', '').slice(0, 32);

    await pushApi.registerToken(token, platform, deviceId).catch(() => {});
  } catch {
    // Silencioso: el registro de token no debe bloquear el flujo de login
  }
}

function NetworkWatcher() {
  useNetworkWatcher();
  return null;
}

/**
 * Escucha el tap en una notificación push y navega a la pantalla correcta.
 * data.screen debe coincidir con los nombres registrados en OnboardingNavigator.
 * No-op en Expo Go.
 */
function PushNotificationHandler() {
  useEffect(() => {
    if (IS_EXPO_GO) return;
    try {
      const sub = Notifications.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data ?? {};
        const screen = data.screen;
        if (screen && navigationRef.isReady()) {
          navigationRef.navigate(screen, data.params ?? {});
        }
      });
      return () => sub.remove();
    } catch {
      return undefined;
    }
  }, []);
  return null;
}

// Deep link de recuperación de contraseña: opox://reset-password?token_hash=...&type=recovery
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
