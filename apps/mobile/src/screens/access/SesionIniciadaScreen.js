import React, { useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../theme';
import { authApi } from '../../api';
import { PENDING_OPOSICION_KEY } from '../onboarding/OppositionSelectorScreen';

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
                navigation.replace('Dashboard', { email });
            });
        }, 2000);

        return () => clearTimeout(timer);
    }, [navigation, email]);

    return (
        <SafeAreaView style={s.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

            <View style={s.content}>
                <View style={s.iconContainer}>
                    <Ionicons name="checkmark" size={52} color={colors.green} />
                </View>

                <Text style={s.title}>¡Dentro!</Text>
                <Text style={s.subtitle}>Preparando tu Centro de Mando…</Text>
            </View>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    iconContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: colors.greenLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 28,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: colors.dark,
        marginBottom: 10,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 16,
        color: colors.grayText,
        textAlign: 'center',
    },
});
