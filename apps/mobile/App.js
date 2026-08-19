import React, { useCallback, useEffect, useState } from 'react';
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
import InAppNotificationBanner from './src/components/InAppNotificationBanner';
import { supabase } from './src/lib/supabase';

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
 * Escucha notificaciones push en primer plano y el tap sobre ellas.
 * No-op en Expo Go.
 */
function PushNotificationHandler({ onForegroundNotification }) {
  useEffect(() => {
    if (!Notifications) return;
    try {
      // Notificación recibida con la app abierta → mostrar banner in-app
      const receivedSub = Notifications.addNotificationReceivedListener(notification => {
        const { title, body, data } = notification.request.content;
        onForegroundNotification({ title, body, type: data?.type ?? 'daily_reminder', data });
      });
      // Tap sobre notificación → navegar a la pantalla indicada
      const responseSub = Notifications.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data ?? {};
        if (data.screen && navigationRef.isReady()) {
          navigationRef.navigate(data.screen, data.params ?? {});
        }
      });
      return () => { receivedSub.remove(); responseSub.remove(); };
    } catch (_) {
      return undefined;
    }
  }, []);
  return null;
}

/**
 * Escucha la tabla boe_changes en Realtime y muestra un banner in-app cuando
 * el backend inserta un nuevo cambio BOE mientras la app está abierta.
 * No-op si supabase no está configurado (EXPO_PUBLIC_SUPABASE_URL ausente).
 */
function BoeRealtimeWatcher({ onNewChange }) {
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel('boe-realtime-alerts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'boe_changes' }, (payload) => {
        const title = payload.new?.article_title ?? 'Cambio legislativo detectado';
        onNewChange({ title, body: 'Hay una actualización en tu temario. Toca para verla.', type: 'boe_alert', data: { screen: 'BoeHome' } });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
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

  const [banner, setBanner] = useState(null);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <NavigationContainer ref={navigationRef} linking={linking}>
        <NetworkWatcher />
        <PushNotificationHandler onForegroundNotification={setBanner} />
        <BoeRealtimeWatcher onNewChange={setBanner} />
        <OnboardingNavigator />
      </NavigationContainer>
      <InAppNotificationBanner
        visible={!!banner}
        title={banner?.title ?? ''}
        body={banner?.body ?? ''}
        type={banner?.type ?? 'daily_reminder'}
        onPress={() => {
          if (banner?.data?.screen && navigationRef.isReady()) {
            navigationRef.navigate(banner.data.screen, banner.data.params ?? {});
          }
          setBanner(null);
        }}
        onDismiss={() => setBanner(null)}
      />
    </SafeAreaProvider>
  );
}
