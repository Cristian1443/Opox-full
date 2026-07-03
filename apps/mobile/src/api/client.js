import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './config';

const TOKEN_KEY = 'opox.session';

/**
 * Cliente HTTP mínimo para hablar con el backend.
 * - Guarda el session (accessToken + refreshToken + user) en AsyncStorage.
 * - Adjunta Authorization: Bearer <accessToken> a cada request.
 * - Traduce respuestas ApiResponse<T> del backend al patrón { data, error }.
 */

async function saveSession(session) {
    if (session) {
        await AsyncStorage.setItem(TOKEN_KEY, JSON.stringify(session));
    } else {
        await AsyncStorage.removeItem(TOKEN_KEY);
    }
}

async function loadSession() {
    const raw = await AsyncStorage.getItem(TOKEN_KEY);
    return raw ? JSON.parse(raw) : null;
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
    const headers = { 'Content-Type': 'application/json' };

    if (auth) {
        const session = await loadSession();
        if (session?.accessToken) {
            headers.Authorization = `Bearer ${session.accessToken}`;
        }
    }

    let response;
    try {
        response = await fetch(`${API_BASE_URL}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });
    } catch (networkErr) {
        return {
            data: null,
            error: {
                code: 'common/network-error',
                message: 'Sin conexión. Revisa tu red e inténtalo de nuevo.',
            },
        };
    }

    let payload = null;
    try {
        payload = await response.json();
    } catch {
        return {
            data: null,
            error: {
                code: 'common/internal-error',
                message: 'Respuesta inválida del servidor.',
            },
        };
    }

    if (payload?.ok) {
        return { data: payload.data, error: null };
    }
    return {
        data: null,
        error: payload?.error || {
            code: 'common/internal-error',
            message: 'Error desconocido.',
        },
    };
}

export const api = {
    get: (path, opts) => request(path, { ...opts, method: 'GET' }),
    post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
    saveSession,
    loadSession,
    clearSession: () => saveSession(null),
};
