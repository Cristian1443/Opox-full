import { api } from './client';
import { API_ROUTES } from '@opox/constants';
import { disableBiometric } from '../lib/biometric';

/**
 * Wrappers específicos del bloque 1 · Acceso.
 * Cada función maneja el patrón:
 *   1. Llama al backend
 *   2. Si hay session en la respuesta, la persiste
 *   3. Devuelve { data, error } sin lanzar
 */

async function withSession(promise) {
    const { data, error } = await promise;
    if (data?.accessToken) await api.saveSession(data);
    return { data, error };
}

export const authApi = {
    register: (input) => withSession(api.post(API_ROUTES.AUTH.REGISTER, input)),
    login: (input) => withSession(api.post(API_ROUTES.AUTH.LOGIN, input)),
    oauthLogin: (input) => withSession(api.post(API_ROUTES.AUTH.OAUTH, input)),

    sendOtp: (input) => api.post(API_ROUTES.AUTH.OTP_SEND, input),
    verifyOtp: (input) => withSession(api.post(API_ROUTES.AUTH.OTP_VERIFY, input)),

    requestPasswordReset: (email) =>
        api.post(API_ROUTES.AUTH.PASSWORD_RESET_REQUEST, { email }),
    confirmPasswordReset: (input) =>
        withSession(api.post(API_ROUTES.AUTH.PASSWORD_RESET_CONFIRM, input)),

    biometricChallenge: (deviceId) =>
        api.post(API_ROUTES.AUTH.BIOMETRIC_CHALLENGE, { deviceId }),
    biometricLink: (input) => api.post(API_ROUTES.AUTH.BIOMETRIC_LINK, input, { auth: true }),
    biometricLogin: (input) =>
        withSession(api.post(API_ROUTES.AUTH.BIOMETRIC_LOGIN, input)),

    me: () => api.get(API_ROUTES.AUTH.ME, { auth: true }),
    refresh: (refreshToken) =>
        withSession(api.post(API_ROUTES.AUTH.REFRESH, { refreshToken })),
    logout: async () => {
        const res = await api.post(API_ROUTES.AUTH.LOGOUT, {}, { auth: true });
        await Promise.all([api.clearSession(), disableBiometric()]);
        return res;
    },
    acceptTerms: (input) => api.post(API_ROUTES.AUTH.TERMS_ACCEPT, input, { auth: true }),
    updateProfile: (input) => api.patch(API_ROUTES.AUTH.PROFILE_UPDATE, input, { auth: true }),
    deleteAccount: async () => {
        const res = await api.delete(API_ROUTES.AUTH.DELETE_ACCOUNT, { auth: true });
        await Promise.all([api.clearSession(), disableBiometric()]);
        return res;
    },
};
