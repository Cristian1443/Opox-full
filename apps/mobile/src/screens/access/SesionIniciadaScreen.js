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
import { authApi } from '../../api';
import { PENDING_OPOSICION_KEY } from '../onboarding/OppositionSelectorScreen';
import { SesionCheckIcon } from '../../components/icons/AccessIcons';
import { registerForPushNotifications } from '../../../App';

// Colores del frame Figma "PERMISO CONCEDIDO" (2349:911) sin equivalente
// exacto en theme.js — se dejan literales aquí a propósito (otros agentes
// tocan theme.js en paralelo para otras pantallas del mismo bloque).
const FIGMA = {
    backdrop: '#000000',
    cardBorder: 'rgba(65, 41, 80, 0.3)',
    checkGreen: '#3AB375',
};

export default function SesionIniciadaScreen({ navigation, route }) {
    const { email } = route.params || {};

    useEffect(() => {
        // Si el Bloque 0 dejó una oposición elegida antes de que existiera
        // sesión, la aplicamos ahora que ya hay token real. Best-effort: si
        // falla, el usuario puede configurarla luego en Ajustes.
        const applyPendingOposicion = async () => {
            const oposicion = await AsyncStorage.getItem(PENDING_OPOSICION_KEY);
            if (!oposicion) return;
            await authApi.updateProfile({ oposicion }).catch(() => undefined);
            await AsyncStorage.removeItem(PENDING_OPOSICION_KEY);
        };

        // TODO: sustituir el timer por la carga real del perfil / token
        const timer = setTimeout(() => {
            applyPendingOposicion().finally(() => {
                registerForPushNotifications().catch(() => {});
                navigation.replace('Dashboard', { email });
            });
        }, 2000);

        return () => clearTimeout(timer);
    }, [navigation, email]);

    return (
        <SafeAreaView style={s.container}>
            <StatusBar barStyle="light-content" backgroundColor={FIGMA.backdrop} />

            {/* MODAL (2349:912) centrado sobre el fondo oscuro del frame */}
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
    container: {
        flex: 1,
        backgroundColor: FIGMA.backdrop,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: colors.white,
        borderRadius: 28,
        borderWidth: 1,
        borderColor: FIGMA.cardBorder,
        paddingVertical: 40,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    title: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 28,
        color: colors.textDark,
        marginTop: 20,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontFamily: 'Poppins-Light',
        fontSize: 16,
        color: colors.textDark,
        textAlign: 'center',
    },
});
