import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * URL del backend adaptativa al entorno de ejecución.
 *
 * Reglas:
 *  - Si hay EXPO_PUBLIC_API_URL en env → prevalece (producción / staging).
 *  - Web (browser corriendo en la misma máquina) → localhost.
 *  - Native (Expo Go en móvil físico, emulador, simulador) → derivamos la
 *    IP del host del bundler Metro (Constants.expoConfig.hostUri) y le
 *    pegamos el puerto 3000 del backend. Así el móvil real llega al PC
 *    por la LAN sin config manual.
 *  - Fallback si no hay hostUri por algún motivo raro:
 *      Android emulador → 10.0.2.2
 *      Resto → localhost
 */
function getApiBaseUrl() {
    const fromEnv = process.env.EXPO_PUBLIC_API_URL;
    if (fromEnv) return fromEnv;

    if (Platform.OS === 'web') return 'http://localhost:3000';

    const hostUri = Constants.expoConfig?.hostUri
        || Constants.manifest?.debuggerHost
        || Constants.manifest2?.extra?.expoGo?.debuggerHost;

    if (hostUri) {
        // hostUri viene como "192.168.20.122:8081" — nos quedamos con el host.
        const host = hostUri.split(':')[0];
        return `http://${host}:3000`;
    }

    return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
}

export const API_BASE_URL = getApiBaseUrl();
