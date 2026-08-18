import React, { useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
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

// Tipografía de marca OPOX
SplashScreen.preventAutoHideAsync().catch(() => {});

// Desde SDK 53, expo-notifications remoto NO funciona en Expo Go y lanza
// un error en su propia inicialización de módulo antes de que podamos
// interceptarlo. Por eso NO usamos import top-level — usamos require()
// condicional para que Metro no lo evalúe al cargar el bundle.
const IS_EXPO_GO = Constants.appOwnership === 'expo';

// Carga lazy: solo en development build / producción real
let Notifications = null;
if (!IS_EXPO_GO) {
  try {
    Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: false, // InAppNotificationBanner lo gestiona
        shouldPlaySound: false,
        shouldSetBadge: true,
      }),
    });
  } catch (_) {
    Notifications = null;
  }
}

/**
 * Solicita permiso push y registra el token Expo en el backend.
 * Llamar tras login exitoso. No-op en Expo Go (SDK 53+).
 */
export async function registerForPushNotifications() {
  if (!Notifications || !Device.isDevice) return;
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
  } catch (_) {}
}

function NetworkWatcher() {
  useNetworkWatcher();
  return null;
}

/**
 * Escucha el tap en una notificación push y navega a la pantalla correcta.
 * No-op en Expo Go.
 */
function PushNotificationHandler() {
  useEffect(() => {
    if (!Notifications) return;
    try {
      const sub = Notifications.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data ?? {};
        const screen = data.screen;
        if (screen && navigationRef.isReady()) {
          navigationRef.navigate(screen, data.params ?? {});
        }
      });
      return () => sub.remove();
    } catch (_) {
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
