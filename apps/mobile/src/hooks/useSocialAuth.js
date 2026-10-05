import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { api } from '../api/client';
import { supabase } from '../lib/supabase';

// Google Sign-In y Facebook SDK son módulos nativos puros — no están en el
// binario de Expo Go. Se cargan con require() lazy dentro de cada función para
// que Metro no los evalúe al arrancar el bundle en Expo Go (mismo patrón que
// expo-notifications en App.js).

// Llamar una sola vez al arranque desde App.js, solo si !IS_EXPO_GO.
export function configureGoogleSignIn() {
    const { GoogleSignin } = require('@react-native-google-signin/google-signin');
    GoogleSignin.configure({
        webClientId: '76808135597-moaetvsrr1sph9hfe3kebd33vtrt9d57.apps.googleusercontent.com',
        iosClientId: '76808135597-s7ofnpev65fg3lg26cnp6o4biip1oi4g.apps.googleusercontent.com',
        offlineAccess: false,
    });
}

// Mapea la sesión de Supabase al formato interno de la app: { accessToken,
// refreshToken, user }. Supabase usa snake_case (access_token / refresh_token),
// la app usa camelCase. user.oposicion viene de user_metadata (guardado en el
// onboarding) — sin él el temario caería al fallback 'justicia-tramitacion'.
function mapSupabaseSession(session, user) {
    return {
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        user: {
            id: user.id,
            email: user.email,
            displayName:
                user.user_metadata?.display_name ??
                user.user_metadata?.full_name ??
                user.user_metadata?.name ??
                '',
            oposicion: user.user_metadata?.oposicion ?? null,
            user_metadata: user.user_metadata ?? {},
        },
    };
}

export function useSocialAuth() {
    const [loading, setLoading] = useState(null); // 'google' | 'apple' | 'facebook' | null

    // ── GOOGLE ─────────────────────────────────────────────────────────────────
    const loginWithGoogle = useCallback(async () => {
        setLoading('google');
        const { GoogleSignin, statusCodes } = require('@react-native-google-signin/google-signin');
        try {
            if (!supabase) throw new Error('Supabase no configurado. Comprueba las variables EXPO_PUBLIC_SUPABASE_*.');

            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            // v16: signIn() ya NO lanza al cancelar — resuelve { type: 'cancelled' }.
            // Sin este guard llamábamos getTokens() sin usuario y mostrábamos un
            // error al usuario que solo había cerrado la hoja de Google.
            const signInRes = await GoogleSignin.signIn();
            if (signInRes?.type === 'cancelled') return { data: null, error: null };
            const { idToken } = await GoogleSignin.getTokens();
            if (!idToken) throw new Error('Google no devolvió idToken.');

            const { data, error } = await supabase.auth.signInWithIdToken({
                provider: 'google',
                token: idToken,
            });
            if (error) throw error;

            const mapped = mapSupabaseSession(data.session, data.user);
            await api.saveSession(mapped);
            return { data: mapped, error: null };
        } catch (err) {
            if (err.code === statusCodes.SIGN_IN_CANCELLED) return { data: null, error: null };
            if (err.code === statusCodes.IN_PROGRESS)
                return { data: null, error: { message: 'Ya hay un inicio de sesión en curso.' } };
            if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE)
                return { data: null, error: { message: 'Google Play Services no está disponible.' } };
            if (err.message?.includes('DEVELOPER_ERROR') || String(err.code) === '10')
                return { data: null, error: { message: 'Inicio de sesión con Google no disponible ahora. Usa email y contraseña.' } };
            return { data: null, error: { message: err.message ?? 'Error de Google Sign-In.' } };
        } finally {
            setLoading(null);
        }
    }, []);

    // ── APPLE (solo iOS) ────────────────────────────────────────────────────────
    const loginWithApple = useCallback(async () => {
        if (Platform.OS !== 'ios') return { data: null, error: null };
        setLoading('apple');
        try {
            if (!supabase) throw new Error('Supabase no configurado. Comprueba las variables EXPO_PUBLIC_SUPABASE_*.');

            // Sign in with Apple no está disponible en iOS < 13 ni en algunos
            // simuladores/dispositivos sin cuenta — mejor un mensaje claro que un
            // error nativo críptico.
            const available = await AppleAuthentication.isAvailableAsync();
            if (!available) {
                return {
                    data: null,
                    error: { message: 'Iniciar sesión con Apple no está disponible en este dispositivo. Usa email y contraseña.' },
                };
            }

            // Nonce anti-replay: a Apple se le pasa el SHA-256 (hex) del nonce,
            // que queda como claim en el identityToken; a Supabase el nonce en
            // claro (lo hashea y lo compara con el claim del JWT).
            const rawNonce = Crypto.randomUUID();
            const hashedNonce = await Crypto.digestStringAsync(
                Crypto.CryptoDigestAlgorithm.SHA256,
                rawNonce,
            );

            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
                nonce: hashedNonce,
            });
            if (!credential.identityToken) throw new Error('Apple no devolvió identityToken.');

            const { data, error } = await supabase.auth.signInWithIdToken({
                provider: 'apple',
                token: credential.identityToken,
                nonce: rawNonce,
            });
            if (error) throw error;

            const mapped = mapSupabaseSession(data.session, data.user);
            // Apple solo entrega el nombre en el PRIMER inicio de sesión y no lo
            // incluye en el identityToken — si no lo guardamos ahora se pierde.
            const fullName = [credential.fullName?.givenName, credential.fullName?.familyName]
                .filter(Boolean).join(' ').trim();
            if (fullName && !mapped.user.displayName) {
                mapped.user.displayName = fullName;
                supabase.auth.updateUser({ data: { full_name: fullName } }).catch(() => {});
            }
            await api.saveSession(mapped);
            return { data: mapped, error: null };
        } catch (err) {
            if (err.code === 'ERR_REQUEST_CANCELED') return { data: null, error: null };
            return { data: null, error: { message: err.message ?? 'Error de Apple Sign-In.' } };
        } finally {
            setLoading(null);
        }
    }, []);

    // ── FACEBOOK ────────────────────────────────────────────────────────────────
    const loginWithFacebook = useCallback(async () => {
        setLoading('facebook');
        try {
            if (!supabase) throw new Error('Supabase no configurado. Comprueba las variables EXPO_PUBLIC_SUPABASE_*.');

            const { LoginManager, AccessToken, AuthenticationToken } = require('react-native-fbsdk-next');

            let idTokenParams;
            if (Platform.OS === 'ios') {
                // iOS (Facebook SDK 17+): sin permiso ATT concedido el SDK hace
                // SIEMPRE "Limited Login" y AccessToken.getCurrentAccessToken()
                // devuelve null → el login fallaba con "no devolvió access token".
                // Usamos Limited Login explícito con nonce y el token OIDC (JWT),
                // que es lo que Supabase valida en signInWithIdToken. Al SDK se le
                // pasa el SHA-256 del nonce; a Supabase el nonce en claro (lo hashea
                // y lo compara con el claim del JWT).
                const rawNonce = Crypto.randomUUID();
                const hashedNonce = await Crypto.digestStringAsync(
                    Crypto.CryptoDigestAlgorithm.SHA256,
                    rawNonce,
                );
                const result = await LoginManager.logInWithPermissions(
                    ['public_profile', 'email'],
                    'limited',
                    hashedNonce,
                );
                if (result.isCancelled) return { data: null, error: null };
                const authToken = await AuthenticationToken.getAuthenticationTokenIOS();
                if (!authToken?.authenticationToken) throw new Error('Facebook no devolvió token de autenticación.');
                idTokenParams = { provider: 'facebook', token: authToken.authenticationToken, nonce: rawNonce };
            } else {
                const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
                if (result.isCancelled) return { data: null, error: null };

                const tokenData = await AccessToken.getCurrentAccessToken();
                if (!tokenData?.accessToken) throw new Error('Facebook no devolvió access token.');
                // Supabase acepta el access token de Facebook como token en signInWithIdToken.
                idTokenParams = { provider: 'facebook', token: tokenData.accessToken };
            }

            // Requiere que el proveedor Facebook esté habilitado en Supabase Dashboard
            // → Authentication → Providers → Facebook → App ID + App Secret.
            const { data, error } = await supabase.auth.signInWithIdToken(idTokenParams);
            if (error) throw error;

            const mapped = mapSupabaseSession(data.session, data.user);
            await api.saveSession(mapped);
            return { data: mapped, error: null };
        } catch (err) {
            return { data: null, error: { message: err.message ?? 'Error de Facebook Login.' } };
        } finally {
            setLoading(null);
        }
    }, []);

    return { loginWithGoogle, loginWithApple, loginWithFacebook, loading };
}
