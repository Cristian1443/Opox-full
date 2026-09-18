// Bloque 3 · Salud — Onboarding wearable · paso 3 (mini-guía por marca)
// 3 pasos exactos por marca + botones "Abrir app" (deep link a Play Store si
// no está instalada) y "Ya lo hice · Conectar" (→ Pairing con HC).
import React from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Text from '../../components/AppText';
import HealthScreenHeader from '../../components/HealthScreenHeader';
import { colors, spacing } from '../../theme';

const FIGMA = {
    subtitleMuted: 'rgba(65,41,80,0.5)',
    cardBorder: 'rgba(65,41,80,0.3)',
    cardFill: 'rgba(255,255,255,0.5)',
};

// Guías reales — cada `steps` es la ruta exacta dentro de la app oficial hasta
// activar la sincronización con Health Connect. Verificado con la doc de cada
// fabricante a fecha 2026-09. Si cambian los menús, actualizar aquí.
const GUIDES = {
    wearos: {
        title: 'Wear OS / Pixel Watch',
        packageName: 'com.google.android.wearable.app',
        appLabel: 'Wear OS',
        steps: [
            'Abre la app Wear OS o Google Fit',
            'Ajustes → Health Connect',
            'Activa: Ritmo cardíaco, Sueño, HRV, SpO₂',
        ],
    },
    xiaomi: {
        title: 'Xiaomi / Mi Band',
        packageName: 'com.mi.health',
        appLabel: 'Mi Fitness',
        steps: [
            'Abre la app Mi Fitness',
            'Perfil → Ajustes → Integraciones → Health Connect',
            'Activa: Ritmo cardíaco, Sueño, HRV, SpO₂',
        ],
    },
    amazfit: {
        title: 'Amazfit / Zepp',
        packageName: 'com.huami.watch.hmwatchmanager',
        appLabel: 'Zepp',
        steps: [
            'Abre la app Zepp',
            'Perfil → Ajustes → Integraciones → Health Connect',
            'Activa: Ritmo cardíaco, Sueño, HRV, SpO₂',
        ],
    },
    fitbit: {
        title: 'Fitbit',
        packageName: 'com.fitbit.FitbitMobile',
        appLabel: 'Fitbit',
        steps: [
            'Abre la app Fitbit',
            'Tú → Ajustes → Health Connect',
            'Activa: Ritmo cardíaco, Sueño, HRV, SpO₂',
        ],
    },
    garmin: {
        title: 'Garmin Connect',
        packageName: 'com.garmin.android.apps.connectmobile',
        appLabel: 'Garmin Connect',
        steps: [
            'Abre la app Garmin Connect',
            'Más → Configuración → Datos y privacidad → Health Connect',
            'Activa la sincronización de todos los datos',
        ],
    },
    samsung: {
        title: 'Samsung Health',
        packageName: 'com.sec.android.app.shealth',
        appLabel: 'Samsung Health',
        steps: [
            'Abre la app Samsung Health',
            'Ajustes → Health Connect',
            'Activa: Ritmo cardíaco, Sueño, HRV, SpO₂',
        ],
    },
    other: {
        title: 'Otro wearable',
        packageName: null,
        appLabel: null,
        steps: [
            'Abre la app oficial de tu wearable',
            'Busca "Health Connect" en los ajustes o integraciones',
            'Activa la escritura de datos vitales y sueño',
        ],
    },
};

export default function WearableGuideScreen({ navigation, route }) {
    const brand = route?.params?.brand ?? 'other';
    const guide = GUIDES[brand] ?? GUIDES.other;

    const handleOpenApp = () => {
        if (!guide.packageName) return;
        const url = `market://details?id=${guide.packageName}`;
        const fallback = `https://play.google.com/store/apps/details?id=${guide.packageName}`;
        Linking.openURL(url).catch(() => Linking.openURL(fallback).catch(() => {}));
    };

    const handleConnect = () => {
        navigation.replace('Pairing', {
            device: { name: 'Health Connect', platform: 'health_connect', icon: 'fitness-outline' },
        });
    };

    return (
        <SafeAreaView style={styles.container} edges={['top','left','right']}>
            <StatusBar barStyle="dark-content" />
            <HealthScreenHeader title={guide.title} onBack={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <Text style={styles.intro}>
                    Sigue estos 3 pasos en tu app oficial para que envíe los datos a Health Connect.
                    Después OPOX los leerá automáticamente.
                </Text>

                <View style={styles.stepsWrap}>
                    {guide.steps.map((step, i) => (
                        <View key={i} style={styles.stepRow}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>{i + 1}</Text>
                            </View>
                            <Text style={styles.stepText}>{step}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.tip}>
                    <Ionicons name="information-circle-outline" size={18} color={colors.bannerPurple} />
                    <Text style={styles.tipText}>
                        Si no encuentras Health Connect en tu app, revisa que la tengas actualizada.
                        Algunas apps antiguas no lo soportan todavía.
                    </Text>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                {guide.packageName && (
                    <TouchableOpacity style={styles.secondary} onPress={handleOpenApp} activeOpacity={0.85}>
                        <Ionicons name="open-outline" size={18} color={colors.accentOrange} />
                        <Text style={styles.secondaryText}>Abrir {guide.appLabel}</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.primary} onPress={handleConnect} activeOpacity={0.85}>
                    <Text style={styles.primaryText}>Ya lo hice · Conectar</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.white },
    scroll: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing.lg,
    },
    intro: {
        fontFamily: 'Poppins-Regular',
        fontSize: 13,
        lineHeight: 19,
        color: FIGMA.subtitleMuted,
        marginBottom: spacing.lg,
    },
    stepsWrap: {
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.md,
    },
    stepNumber: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: colors.accentOrange,
        alignItems: 'center', justifyContent: 'center',
    },
    stepNumberText: {
        fontFamily: 'Poppins-Bold',
        fontSize: 15,
        color: colors.white,
    },
    stepText: {
        flex: 1,
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
        color: colors.textDark,
        marginTop: 4,
    },
    tip: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: 12,
        backgroundColor: 'rgba(128,76,201,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(128,76,201,0.2)',
    },
    tipText: {
        flex: 1,
        fontFamily: 'Poppins-Regular',
        fontSize: 11.5,
        lineHeight: 15,
        color: colors.textDark,
    },
    footer: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
        borderTopWidth: 1,
        borderTopColor: FIGMA.cardBorder,
        gap: spacing.sm,
    },
    secondary: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 48,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.accentOrange,
    },
    secondaryText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 14,
        color: colors.accentOrange,
    },
    primary: {
        height: 56,
        borderRadius: 14,
        backgroundColor: colors.ctaGreen,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 15,
        color: colors.white,
    },
});
