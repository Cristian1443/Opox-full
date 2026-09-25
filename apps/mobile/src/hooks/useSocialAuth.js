import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { authApi } from '../api/auth';

// Google Sign-In y Facebook SDK son módulos nativos puros — no están en el
// binario de Expo Go. Se cargan con require() lazy dentro de cada función para
// que Metro no los evalúe al arrancar el bundle en Expo Go (mismo patrón que
// expo-notifications en App.js).

// Llamar una sola vez al arranque desde App.js, solo si !IS_EXPO_GO.
export function configureGoogleSignIn() {
    const { GoogleSignin } = require('@react-native-google-signin/google-signin');
    GoogleSignin.configure({
        webClientId: '468573803070-sdvl0utq0ojvldlnjlndnnbfjo5ddfe5.apps.googleusercontent.com',
        iosClientId: '468573803070-3v6flatm7hagovj5rhl3ujg5c0h482j1.apps.googleusercontent.com',
        offlineAccess: false,
    });
}

export function useSocialAuth() {
    const [loading, setLoading] = useState(null); // 'google' | 'apple' | 'facebook' | null

    // ── GOOGLE ─────────────────────────────────────────────────────────────────
    const loginWithGoogle = useCallback(async () => {
        setLoading('google');
        // require lazy: el módulo nativo no está en Expo Go.
        const { GoogleSignin, statusCodes } = require('@react-native-google-signin/google-signin');
        try {
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            await GoogleSignin.signIn();
            const { idToken } = await GoogleSignin.getTokens();

            if (!idToken) throw new Error('Google no devolvió idToken.');

            return await authApi.oauthLogin({ provider: 'google', idToken });
        } catch (err) {
            if (err.code === statusCodes.SIGN_IN_CANCELLED) return { data: null, error: null };
            if (err.code === statusCodes.IN_PROGRESS)
                return { data: null, error: { message: 'Ya hay un inicio de sesión en curso.' } };
            if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE)
                return { data: null, error: { message: 'Google Play Services no está disponible.' } };
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
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });

            if (!credential.identityToken) throw new Error('Apple no devolvió identityToken.');

            return await authApi.oauthLogin({
                provider: 'apple',
                idToken: credential.identityToken,
                // El fullName solo llega la primera vez que el usuario autoriza.
                firstName: credential.fullName?.givenName ?? null,
                lastName: credential.fullName?.familyName ?? null,
            });
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
        const { LoginManager, AccessToken } = require('react-native-fbsdk-next');
        try {
            const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);

            if (result.isCancelled) return { data: null, error: null };

            const tokenData = await AccessToken.getCurrentAccessToken();
            if (!tokenData?.accessToken) throw new Error('Facebook no devolvió access token.');

            return await authApi.oauthLogin({
                provider: 'facebook',
                accessToken: tokenData.accessToken,
            });
        } catch (err) {
            return { data: null, error: { message: err.message ?? 'Error de Facebook Login.' } };
        } finally {
            setLoading(null);
        }
    }, []);

    return { loginWithGoogle, loginWithApple, loginWithFacebook, loading };
}
