import React, { useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../theme';
import { authApi, planningApi } from '../../api';
import { PENDING_OPOSICION_KEY } from '../onboarding/OppositionSelectorScreen';
import { LEVEL_TEST_RESULT_KEY } from '../onboarding/LevelTestInProgressScreen';
import { ONBOARDING_COMPLETED_KEY } from '../onboarding/SplashScreen';
import { SesionCheckIcon } from '../../components/icons/AccessIcons';
import { registerForPushNotifications } from '../../../App';

const FIGMA = {
    backdrop: '#000000',
    cardBorder: 'rgba(65, 41, 80, 0.3)',
    checkGreen: '#3AB375',
};

export default function SesionIniciadaScreen({ navigation, route }) {
    const { email } = route.params || {};

    useEffect(() => {
        // Aplicar oposición elegida en el onboarding (si existe)
        const applyPendingOposicion = async () => {
            const oposicion = await AsyncStorage.getItem(PENDING_OPOSICION_KEY);
            if (!oposicion) return;
            await authApi.updateProfile({ oposicion }).catch(() => undefined);
            await AsyncStorage.removeItem(PENDING_OPOSICION_KEY);
        };

        // Inicializar la intensidad del plan de estudio con el resultado del test de nivel
        const applyLevelTestResult = async () => {
            const raw = await AsyncStorage.getItem(LEVEL_TEST_RESULT_KEY);
            if (!raw) return;
            try {
                const { intensity } = JSON.parse(raw);
                if (intensity) {
                    await planningApi.updatePlan({ intensity }).catch(() => undefined);
                }
            } catch (_) {}
            await AsyncStorage.removeItem(LEVEL_TEST_RESULT_KEY);
        };

        // Marcar que el onboarding ya fue completado en este dispositivo.
        // Desde ahora, al cerrar sesión y volver, SplashScreen irá directo
        // a Entrada (login) en vez de mostrar el slider y el selector de oposición.
        const markOnboardingCompleted = async () => {
            await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, '1');
        };

        const timer = setTimeout(async () => {
            await Promise.all([
                applyPendingOposicion(),
                applyLevelTestResult(),
                markOnboardingCompleted(),
            ]);
            await registerForPushNotifications().catch(() => {});
            navigation.replace('Dashboard', { email });
        }, 2000);

        return () => clearTimeout(timer);
    }, [navigation, email]);

    return (
        <SafeAreaView style={s.container}>
            <StatusBar barStyle="light-content" backgroundColor={FIGMA.backdrop} />

            <View style={s.content}>
                <View style={s.card}>
                    <SesionCheckIcon width={72} color={FIGMA.checkGreen} />
                    <Text style={s.title}>¡Estás dentro!</Text>
                    <Text style={s.subtitle}>Preparando tu Centro de Mando…</Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: FIGMA.backdrop },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    card: {
        width: '100%', maxWidth: 360,
        backgroundColor: colors.white,
        borderRadius: 28, borderWidth: 1, borderColor: FIGMA.cardBorder,
        paddingVertical: 40, paddingHorizontal: 24,
        alignItems: 'center',
    },
    title: {
        fontFamily: 'Poppins-SemiBold', fontSize: 28,
        color: colors.textDark, marginTop: 20, marginBottom: 8, textAlign: 'center',
    },
    subtitle: {
        fontFamily: 'Poppins-Light', fontSize: 16,
        color: colors.textDark, textAlign: 'center',
    },
});
