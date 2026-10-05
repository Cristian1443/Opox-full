import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Platform, Alert, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
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
import { AccessibilityProvider, AccessibilityContext } from './src/contexts/AccessibilityContext';
import { ensureCheckinReminderScheduled } from './src/lib/checkinReminder';
// Tipografía de marca OPOX
SplashScreen.preventAutoHideAsync().catch(() => {});

// Desde SDK 53, expo-notifications remoto NO funciona en Expo Go y lanza
// un error en su propia inicialización de módulo antes de que podamos
// interceptarlo. Por eso NO usamos import top-level — usamos require()
// condicional para que Metro no lo evalúe al cargar el bundle.
const IS_EXPO_GO = Constants.appOwnership === 'expo';

// Google Sign-In y Facebook SDK requieren native build — no disponibles en Expo Go.
if (!IS_EXPO_GO) {
  try {
    const { configureGoogleSignIn } = require('./src/hooks/useSocialAuth');
    configureGoogleSignIn();
  } catch (_) { /* silencioso si el módulo nativo aún no está linkeado */ }

  // Meta Android SDK v16+ (react-native-fbsdk-next v13+) ya no se auto-inicializa
  // solo con isAutoInitEnabled en el manifest — requiere llamada explícita en JS.
  // Sin esto, LoginManager lanza una excepción nativa fatal al primer uso.
  try {
    const { Settings } = require('react-native-fbsdk-next');
    Settings.initializeSDK();
  } catch (_) { /* silencioso si el módulo nativo aún no está linkeado */ }
}

// Carga lazy: solo en development build / producción real
let Notifications = null;
if (!IS_EXPO_GO) {
  try {
    Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      // `shouldShowAlert` quedó deprecado en esta versión de expo-notifications
      // a favor de shouldShowBanner/shouldShowList — sin declararlos, Android
      // no muestra nada en la bandeja del sistema mientras la app está abierta
      // (solo se veía el banner interno de InAppNotificationBanner).
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: true,
      }),
    });
  } catch (_) {
    Notifications = null;
  }
}

/**
 * ID estable por dispositivo físico: Android ID / vendor ID de iOS, que
 * sobreviven a reinstalaciones de la app (a diferencia del token de push,
 * que Expo rota cada vez). Cae al viejo comportamiento (derivado del token)
 * solo si la llamada nativa falla o no devuelve nada.
 */
async function getStableDeviceId(fallbackToken) {
  try {
    const id = Platform.OS === 'ios'
      ? await Application.getIosIdForVendorAsync()
      : Application.getAndroidId();
    if (id) return id.slice(0, 64);
  } catch (err) {
    console.warn('[push-reg] getStableDeviceId falló, usando fallback:', err?.message);
  }
  return fallbackToken.replace('ExponentPushToken[', '').replace(']', '').slice(0, 32);
}

/**
 * Solicita permiso push y registra el token Expo en el backend.
 * Llamar tras login exitoso. No-op en Expo Go (SDK 53+).
 *
 * Instrumentado con logs `[push-reg]` para diagnosticar en Metro / adb logcat.
 */
export async function registerForPushNotifications() {
  console.log('[push-reg] start · IS_EXPO_GO=', IS_EXPO_GO, 'isDevice=', Device.isDevice, 'Notifications=', !!Notifications);
  if (!Notifications) { console.warn('[push-reg] abort: expo-notifications no cargado (¿Expo Go?)'); return; }
  if (!Device.isDevice) { console.warn('[push-reg] abort: no es dispositivo físico (emulador/simulador)'); return; }

  try {
    // Android 8+ necesita un canal de notificación para MOSTRAR pushes
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    console.log('[push-reg] permission existing=', existing);
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      console.log('[push-reg] permission requested → status=', status);
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.warn('[push-reg] abort: permiso denegado por el usuario');
      // Ofrecer apertura de ajustes solo si el usuario ya denegó antes (no la primera vez,
      // para no ser intrusivo). Si existing ya era denied, el sistema no mostró el diálogo.
      if (existing === 'denied') {
        Alert.alert(
          'Notificaciones desactivadas',
          'Para recibir alertas del BOE y recordatorios de racha, actívalas en Configuración del dispositivo.',
          [
            { text: 'Ahora no', style: 'cancel' },
            { text: 'Ir a Configuración', onPress: () => Linking.openSettings() },
          ],
        );
      }
      return;
    }

    // projectId es OBLIGATORIO en dev builds a partir de SDK 49+
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ||
      Constants.easConfig?.projectId;
    console.log('[push-reg] projectId=', projectId || '(vacío)');

    const tokenRes = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    const token = tokenRes?.data;
    console.log('[push-reg] token=', token ? token.slice(0, 40) + '...' : '(vacío)');
    if (!token) { console.warn('[push-reg] abort: getExpoPushTokenAsync no devolvió token'); return; }

    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    // ID estable por dispositivo (sobrevive reinstalaciones/builds nuevos del
    // APK) en vez de derivarlo del token de push, que Expo rota en cada
    // instalación. Antes, cada reinstalación durante testing generaba una
    // fila NUEVA en vez de actualizar la existente — algunos usuarios
    // acumularon hasta 10 tokens "vivos" y recibían el mismo push repetido
    // una vez por cada fila vieja.
    const deviceId = await getStableDeviceId(token);
    console.log('[push-reg] POST /push/token → platform=', platform, 'deviceId=', deviceId);
    const res = await pushApi.registerToken(token, platform, deviceId);
    console.log('[push-reg] backend response=', JSON.stringify(res).slice(0, 200));
  } catch (err) {
    console.error('[push-reg] ERROR:', err?.message || String(err), err?.stack);
  }
}

function NetworkWatcher() {
  useNetworkWatcher();
  return null;
}

// Rutas previas a la sesión autenticada (splash, onboarding y acceso). Si el
// usuario toca una push mientras está en cualquiera de ellas, la navegación se
// difiere hasta que llegue a 'Dashboard' — Splash y SesionIniciada hacen
// `reset` a Dashboard en cuanto hay sesión válida.
const PRE_AUTH_ROUTES = new Set([
  'Icono', 'Splash', 'SplashNoConnection', 'SplashUpdate',
  'OnboardingSlider', 'OppositionSelector', 'LevelTestProposal',
  'LevelTestInProgress', 'LevelTestResult', 'Permissions',
  'Entrada', 'Registro', 'Login', 'BioLink', 'RecuperarPassword',
  'RecuperarPasswordEnviado', 'RecuperarPasswordNueva', 'Otp', 'Terminos',
  'SesionIniciada', 'HealthConnectRationale',
]);
const AUTHENTICATED_HOME_ROUTE = 'Dashboard';

// Identificadores de notificaciones ya procesadas. A nivel de módulo para que
// sobreviva a remontajes del handler (y a que el listener y
// getLastNotificationResponseAsync entreguen la misma respuesta en cold start).
const handledNotificationIds = new Set();

/**
 * Escucha notificaciones push en primer plano y el tap sobre ellas, tanto con
 * la app en segundo plano (listener) como con la app CERRADA (cold start vía
 * getLastNotificationResponseAsync). No-op en Expo Go.
 */
function PushNotificationHandler({ onForegroundNotification }) {
  useEffect(() => {
    if (!Notifications) return undefined;

    // Destino pendiente hasta que el usuario esté autenticado y en Dashboard.
    let pendingTarget = null;
    let unsubscribeState = null;
    let cancelled = false;

    const flushPending = () => {
      if (!pendingTarget || !navigationRef.isReady()) return;
      if (navigationRef.getCurrentRoute()?.name !== AUTHENTICATED_HOME_ROUTE) return;
      const { screen, params } = pendingTarget;
      pendingTarget = null;
      if (unsubscribeState) { unsubscribeState(); unsubscribeState = null; }
      // Diferido un tick: estamos dentro del listener 'state' del contenedor.
      setTimeout(() => {
        if (navigationRef.isReady()) navigationRef.navigate(screen, params);
      }, 0);
    };

    const handleResponse = (response) => {
      const identifier = response?.notification?.request?.identifier;
      if (identifier) {
        if (handledNotificationIds.has(identifier)) return;
        handledNotificationIds.add(identifier);
      }
      const data = response?.notification?.request?.content?.data ?? {};
      if (!data.screen) return;
      const target = { screen: data.screen, params: data.params ?? {} };

      const currentRoute = navigationRef.isReady()
        ? navigationRef.getCurrentRoute()?.name
        : undefined;
      if (currentRoute && !PRE_AUTH_ROUTES.has(currentRoute)) {
        // App ya dentro de la sesión → navegación inmediata.
        navigationRef.navigate(target.screen, target.params);
        return;
      }
      // Arranque en frío o aún en splash/login → esperar a Dashboard.
      pendingTarget = target;
      if (!unsubscribeState) {
        unsubscribeState = navigationRef.addListener('state', flushPending);
      }
      flushPending();
    };

    let receivedSub = null;
    let responseSub = null;
    try {
      // Notificación recibida con la app abierta → mostrar banner in-app
      receivedSub = Notifications.addNotificationReceivedListener(notification => {
        const { title, body, data } = notification.request.content;
        onForegroundNotification({ title, body, type: data?.type ?? 'daily_reminder', data });
      });
      // Tap sobre notificación con la app en segundo plano
      responseSub = Notifications.addNotificationResponseReceivedListener(handleResponse);

      // Tap sobre notificación con la app CERRADA: el listener no recibe la
      // respuesta que lanzó el proceso, hay que pedirla explícitamente.
      Notifications.getLastNotificationResponseAsync?.()
        .then((response) => {
          if (cancelled || !response) return;
          handleResponse(response);
          // Evita re-procesarla en un reload de JS dentro del mismo proceso.
          Notifications.clearLastNotificationResponseAsync?.().catch(() => {});
        })
        .catch(() => {});
    } catch (_) { /* módulo nativo no disponible */ }

    return () => {
      cancelled = true;
      receivedSub?.remove();
      responseSub?.remove();
      if (unsubscribeState) unsubscribeState();
    };
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
        const changeId = payload.new?.id;
        const screen = changeId ? 'BoeDetail' : 'BoeHome';
        const params = changeId ? { itemId: changeId } : {};
        onNewChange({ title, body: 'Hay una actualización en tu temario. Toca para verla.', type: 'boe_alert', data: { screen, params } });
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
      // Health Connect lanza este deep-link cuando el usuario toca "Ver política
      // de privacidad" en el diálogo de permisos de HC. Sin esta ruta la app
      // es invisible en los ajustes de HC y los permisos se deniegan.
      HealthConnectRationale: 'health-rationale',
    },
  },
};

// Barra de estado global que refleja el tema elegido en Accesibilidad.
// Las pantallas que declaran su propio <StatusBar> lo sobreescriben localmente.
function ThemeStatusBar() {
  const { isDark } = useContext(AccessibilityContext);
  return (
    <StatusBar
      barStyle={isDark ? 'light-content' : 'dark-content'}
      backgroundColor={isDark ? '#0F1B33' : '#F4F6FA'}
    />
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'Poppins-Light': Poppins_300Light,
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
  });

  const [banner, setBanner] = useState(null);

  // Re-programa el recordatorio diario del check-in al arrancar la app —
  // idempotente: si nunca se configuró, no hace nada; si sí, se asegura de que
  // exista tras un reinstall/limpieza de datos.
  useEffect(() => {
    ensureCheckinReminderScheduled().catch(() => {});
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <AccessibilityProvider>
      <ThemeStatusBar />
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
    </AccessibilityProvider>
  );
}
