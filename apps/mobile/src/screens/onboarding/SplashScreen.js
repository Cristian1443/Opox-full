import React, { useEffect } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    StatusBar,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OpoxWordmark from '../../../assets/opoxLogo';
import MasCopLogo from '../../../assets/masCopLogo';
import camoImg from '../../imports/CargaInicial/3e43d7dd7590060c7fd1b2f8e506e66fc41fe1d7.jpg';
import { api, authApi } from '../../api';
import { PENDING_OPOSICION_KEY } from './OppositionSelectorScreen';
import { PENDING_LEVEL_TEST_KEY } from './LevelTestInProgressScreen';

// Persiste entre instalaciones y sesiones. Si está presente, el usuario ya
// completó el onboarding al menos una vez en este dispositivo → ir a login,
// no al slider ni al selector de oposición.
export const ONBOARDING_COMPLETED_KEY = 'opox.onboardingCompleted';

// Restaura la sesión guardada en AsyncStorage (si existe) para no forzar
// login + onboarding de nuevo cada vez que se cierra la app. `me()` valida
// que el accessToken siga vivo; si expiró, se intenta un refresh antes de
// darla por perdida.
async function resolveSession() {
    const session = await api.loadSession();
    if (!session?.accessToken) return false;

    const { error: meError } = await authApi.me();
    if (!meError) return true;

    if (session.refreshToken) {
        const { error: refreshError } = await authApi.refresh(session.refreshToken);
        if (!refreshError) return true;
    }

    await api.clearSession();
    return false;
}

// Sin sesión activa. Tres casos posibles:
// 1. El usuario ya hizo el onboarding alguna vez → ir directo a login (Entrada).
// 2. Cerró la app a mitad del onboarding → retomar donde se quedó.
// 3. Usuario completamente nuevo → empezar desde el slider.
async function resolveOnboardingEntryRoute() {
    const completed = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
    if (completed) return 'Entrada';

    const pendingLevelTest = await AsyncStorage.getItem(PENDING_LEVEL_TEST_KEY);
    if (pendingLevelTest != null) return 'LevelTestInProgress';

    const pendingOposicion = await AsyncStorage.getItem(PENDING_OPOSICION_KEY);
    if (pendingOposicion) return 'LevelTestProposal';

    return 'OnboardingSlider';
}

// ─── MásCOP badge ──────────────────────────────────────────────────────────────
// Lockup vectorizado real "MásCOP · Formación Policial" (paths exactos extraídos
// de Figma vía API REST — ver apps/mobile/assets/masCopLogo.js).
function MascopBadge() {
    return (
        <View style={s.badgeRow}>
            <Text style={s.badgeLabel}>La APP de</Text>
            <MasCopLogo width={80} />
        </View>
    );
}

// ─── SplashScreen ─────────────────────────────────────────────────────────────
export default function SplashScreen({ navigation }) {
    useEffect(() => {
        let cancelled = false;

        const timer = setTimeout(async () => {
            const state = await NetInfo.fetch();
            const hasConnection = state.isConnected && state.isInternetReachable !== false;
            const isUpdated = true; // reemplaza con tu lógica de versión

            if (cancelled) return;
            if (!hasConnection) return navigation.replace('SplashNoConnection');
            if (!isUpdated) return navigation.replace('SplashUpdate');

            const hasValidSession = await resolveSession();
            if (cancelled) return;
            if (hasValidSession) return navigation.replace('Dashboard');

            const entryRoute = await resolveOnboardingEntryRoute();
            if (cancelled) return;
            navigation.replace(entryRoute);
        }, 2500);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, []);

    return (
        <View style={s.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            {/* Fondo de camuflaje real del Figma */}
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                <Image
                    source={camoImg}
                    style={s.camo}
                    resizeMode="cover"
                />
            </View>

            {/* Centro: wordmark OPOX AI */}
            <View style={s.center}>
                <OpoxWordmark width={260} />
                <Text style={s.tagline}>Tu plaza más cerca</Text>
            </View>

            {/* Footer: badge MásCOP */}
            <View style={s.footer}>
                <MascopBadge />
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    camo: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        opacity: 0.8,
    },
    center: {
        zIndex: 1,
        alignItems: 'center',
        width: '80%',
    },
    tagline: {
        fontWeight: '500',
        fontSize: 18,
        color: '#412950',
        letterSpacing: 0.2,
        textAlign: 'center',
        marginTop: 14,
    },
    footer: {
        position: 'absolute',
        bottom: 36,
        zIndex: 1,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    badgeLabel: {
        fontWeight: '700',
        fontSize: 13,
        color: '#412950',
    },
});