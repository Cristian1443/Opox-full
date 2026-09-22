import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './config';
import { API_ROUTES } from '@opox/constants';

const TOKEN_KEY = 'opox.session';

/**
 * Cliente HTTP mínimo para hablar con el backend.
 * - Guarda el session (accessToken + refreshToken + user) en AsyncStorage.
 * - Adjunta Authorization: Bearer <accessToken> a cada request.
 * - Traduce respuestas ApiResponse<T> del backend al patrón { data, error }.
 * - Refresca el accessToken automáticamente en el primer 401 (ver refreshAccessToken).
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

// El accessToken de Supabase caduca (~1h) y antes nunca se refrescaba — el
// cliente solo leía el token guardado y lo pegaba en cada request, sin
// manejar 401 ni renovar. Un usuario con la app abierta >1h empezaba a ver
// errores genéricos en cualquier acción (bug latente, 2026-09-22).
// `refreshPromise` evita que varias requests que fallan con 401 al mismo
// tiempo disparen N refresh en paralelo — todas esperan la misma promesa.
let refreshPromise = null;

async function refreshAccessToken(session) {
    if (!session?.refreshToken) return null;
    if (!refreshPromise) {
        refreshPromise = (async () => {
            try {
                const res = await fetch(`${API_BASE_URL}${API_ROUTES.AUTH.REFRESH}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken: session.refreshToken }),
                });
                const payload = await res.json().catch(() => null);
                if (payload?.ok && payload.data?.accessToken) {
                    await saveSession(payload.data);
                    return payload.data;
                }
                // Refresh token también inválido/caducado — no hay forma de
                // recuperar la sesión sin re-login. Limpiamos para que el
                // resto de la app detecte "sin sesión" en vez de seguir
                // pegando el access token viejo en cada request.
                await saveSession(null);
                return null;
            } catch {
                return null;
            } finally {
                refreshPromise = null;
            }
        })();
    }
    return refreshPromise;
}

async function request(path, { method = 'GET', body, auth = false, timeoutMs, _retried = false } = {}) {
    const headers = { 'Content-Type': 'application/json' };

    let session = null;
    if (auth) {
        session = await loadSession();
        if (session?.accessToken) {
            headers.Authorization = `Bearer ${session.accessToken}`;
        }
    }

    // Abort controller opcional — endpoints largos (podcast generate) pasan un timeout mayor.
    const ctrl = new AbortController();
    let timer = null;
    if (timeoutMs) {
        timer = setTimeout(() => ctrl.abort(), timeoutMs);
    }

    let response;
    try {
        response = await fetch(`${API_BASE_URL}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
            signal: timeoutMs ? ctrl.signal : undefined,
        });
    } catch (networkErr) {
        if (timer) clearTimeout(timer);
        return {
            data: null,
            error: {
                code: 'common/network-error',
                message: 'Sin conexión. Revisa tu red e inténtalo de nuevo.',
            },
        };
    } finally {
        if (timer) clearTimeout(timer);
    }

    // 401 en una request autenticada → probablemente el accessToken caducó.
    // Refrescamos con el refreshToken guardado y reintentamos UNA sola vez
    // (evita bucle infinito si el refresh también falla).
    if (response.status === 401 && auth && !_retried && session?.refreshToken) {
        const refreshed = await refreshAccessToken(session);
        if (refreshed?.accessToken) {
            return request(path, { method, body, auth, timeoutMs, _retried: true });
        }
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
    put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
    patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
    delete: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
    saveSession,
    loadSession,
    clearSession: () => saveSession(null),
};
