import { Platform } from 'react-native';

/**
 * URL del backend. En Android emulador `localhost` apunta al emulador
 * mismo, no al host — hay que usar 10.0.2.2.
 * En iOS simulador `localhost` sí funciona.
 * En web (Expo Web) `localhost` funciona.
 *
 * Para dispositivo físico usar la IP local de la máquina de desarrollo
 * o exponer con un túnel (ngrok, expo start --tunnel).
 */
const HOST_BY_PLATFORM = {
    android: 'http://10.0.2.2:3000',
    ios: 'http://localhost:3000',
    web: 'http://localhost:3000',
    default: 'http://localhost:3000',
};

export const API_BASE_URL = HOST_BY_PLATFORM[Platform.OS] || HOST_BY_PLATFORM.default;
