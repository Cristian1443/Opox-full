import { api } from './client';
import { API_ROUTES } from '@opox/constants';

const P = API_ROUTES.PUSH;

export const pushApi = {
    /**
     * Registra el token Expo del dispositivo en el backend.
     * Llamar tras login exitoso y cada vez que el token se refresca.
     * @param {string} token - ExponentPushToken[...]
     * @param {'ios'|'android'} platform
     * @param {string} deviceId - identificador único del dispositivo
     */
    registerToken: (token, platform, deviceId) =>
        api.post(P.REGISTER_TOKEN, { token, platform, deviceId }),
};
