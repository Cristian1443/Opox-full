// Bloque 3 · Salud — Pantalla 3.2 · Conexión de dispositivo
// En Android, TODOS los wearables (Wear OS, Samsung, Xiaomi, Fitbit, Garmin…)
// sincronizan a través de Health Connect. En iOS, todos van vía HealthKit.
// Detectamos plataforma y mostramos solo las opciones reales.
import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import HealthScreenHeader from '../../components/HealthScreenHeader';
import {
    isHealthAvailable,
    getHealthConnectStatus,
    openHealthConnectPlayStore,
} from '../../services/HealthService';

// Colores confirmados contra Figma (frame CONEXION DISPOSITIVO, Bloque 3)
// sin equivalente exacto en theme.js.
const FIGMA = {
    subtitleMuted: 'rgba(65,41,80,0.5)',
    cardBorder: 'rgba(65,41,80,0.3)',
    cardHighlightFill: 'rgba(235,235,235,0.5)',
    textNote: '#343A3D',
    greenBadgeBg: 'rgba(36,189,144,0.15)',
    warnBadgeBg: 'rgba(255,159,0,0.15)',
};

export default function ConnectDeviceScreen({ navigation }) {
    const [hcStatus, setHcStatus] = useState(null); // 'available' | 'not_installed' | 'update_required' | 'not_supported' | 'not_android'
    const [loading, setLoading] = useState(Platform.OS === 'android');

    const checkStatus = useCallback(() => {
        let cancelled = false;
        (async () => {
            if (Platform.OS !== 'android') {
                if (!cancelled) { setHcStatus('not_android'); setLoading(false); }
                return;
            }
            const s = await getHealthConnectStatus();
            if (!cancelled) { setHcStatus(s); setLoading(false); }
        })();
        return () => { cancelled = true; };
    }, []);

    useFocusEffect(checkStatus);

    // ── iOS: HealthKit único ────────────────────────────────────────────────
    if (Platform.OS === 'ios') {
        const hkAvailable = isHealthAvailable();
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <HealthScreenHeader title="Conectar dispositivo" onBack={() => navigation.goBack()} />
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <Text style={styles.subtitle}>
                        Todos los wearables (Apple Watch, Garmin, Fitbit…) sincronizan a través
                        de Apple Salud. Conéctalo una vez y OPOX leerá tus datos.
                    </Text>
                    <View style={styles.devicesList}>
                        <DeviceCard
                            icon="heart-circle-outline"
                            name="Apple Salud"
                            sublabel="HealthKit · datos de tu wearable"
                            statusBadge={hkAvailable ? { text: 'Disponible', color: colors.ctaGreen, bg: FIGMA.greenBadgeBg } : null}
                            actionText="Conectar"
                            onPress={() => navigation.navigate('Pairing', {
                                device: { name: 'Apple Salud', platform: 'ios_healthkit', icon: 'heart-circle-outline' },
                            })}
                        />
                        <DeviceCard
                            icon="phone-portrait-outline"
                            name="Solo smartphone"
                            sublabel="Sensores del móvil (limitado)"
                            actionText="Usar"
                            onPress={() => navigation.navigate('HomeHealth')}
                        />
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    // ── Android: Health Connect ─────────────────────────────────────────────
    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <HealthScreenHeader title="Conectar dispositivo" onBack={() => navigation.goBack()} />
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.subtitle}>
                    En Android, los wearables (Wear OS, Samsung, Xiaomi, Fitbit, Garmin…)
                    sincronizan sus datos en Health Connect. OPOX los lee desde ahí —
                    no se conecta directamente al reloj por Bluetooth.
                </Text>

                {loading ? (
                    <View style={styles.loadingWrap}>
                        <ActivityIndicator size="small" color={colors.accentOrange} />
                    </View>
                ) : (
                    <View style={styles.devicesList}>
                        {/* Health Connect — tarjeta principal según estado real */}
                        {hcStatus === 'available' && (
                            <DeviceCard
                                icon="fitness-outline"
                                name="Health Connect"
                                sublabel="Wear OS, Samsung, Xiaomi, Fitbit, Garmin…"
                                statusBadge={{ text: 'Disponible', color: colors.ctaGreen, bg: FIGMA.greenBadgeBg }}
                                actionText="Conectar"
                                onPress={() => navigation.navigate('Pairing', {
                                    device: { name: 'Health Connect', platform: 'health_connect', icon: 'fitness-outline' },
                                })}
                            />
                        )}

                        {hcStatus === 'update_required' && (
                            <DeviceCard
                                icon="fitness-outline"
                                name="Health Connect"
                                sublabel="Necesita actualizar Health Connect"
                                statusBadge={{ text: 'Desactualizado', color: colors.accentOrange, bg: FIGMA.warnBadgeBg }}
                                actionText="Actualizar"
                                onPress={openHealthConnectPlayStore}
                            />
                        )}

                        {hcStatus === 'not_installed' && (
                            <DeviceCard
                                icon="fitness-outline"
                                name="Health Connect"
                                sublabel="No instalado — descarga desde Google Play"
                                statusBadge={{ text: 'No instalado', color: colors.accentOrange, bg: FIGMA.warnBadgeBg }}
                                actionText="Instalar"
                                onPress={openHealthConnectPlayStore}
                            />
                        )}

                        {hcStatus === 'not_supported' && (
                            <View style={styles.card}>
                                <View style={styles.iconWrap}>
                                    <Ionicons name="alert-circle-outline" size={30} color={colors.statRed} />
                                </View>
                                <View style={styles.deviceTextWrap}>
                                    <Text style={styles.deviceName}>Health Connect no soportado</Text>
                                    <Text style={styles.deviceSublabel}>Requiere Android 8 o superior.</Text>
                                </View>
                            </View>
                        )}

                        {/* Solo smartphone — siempre disponible como fallback */}
                        <DeviceCard
                            icon="phone-portrait-outline"
                            name="Solo smartphone"
                            sublabel="Sensores del móvil (limitado)"
                            actionText="Usar"
                            onPress={() => navigation.navigate('HomeHealth')}
                        />
                    </View>
                )}

                <View style={{ height: spacing.lg }} />
            </ScrollView>
        </SafeAreaView>
    );
}

// ─── Tarjeta reutilizable ────────────────────────────────────────────────────
function DeviceCard({ icon, name, sublabel, statusBadge, actionText, onPress }) {
    return (
        <View style={[styles.card, statusBadge?.color === colors.ctaGreen && styles.cardHighlighted]}>
            <View style={styles.iconWrap}>
                <Ionicons name={icon} size={30} color={colors.accentOrange} />
            </View>
            <View style={styles.deviceTextWrap}>
                <Text style={styles.deviceName}>{name}</Text>
                <Text style={styles.deviceSublabel}>{sublabel}</Text>
            </View>
            {statusBadge ? (
                <View style={[styles.statusBadge, { backgroundColor: statusBadge.bg, borderColor: statusBadge.color }]}>
                    <Text style={[styles.statusBadgeText, { color: statusBadge.color }]}>{statusBadge.text}</Text>
                </View>
            ) : null}
            {onPress ? (
                <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.actionBtn}>
                    <Text style={styles.actionText}>{actionText}</Text>
                </TouchableOpacity>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
    scrollContent: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
    },
    subtitle: {
        textAlign: 'center',
        fontFamily: 'Poppins-Regular',
        fontSize: 11.5,
        lineHeight: 16,
        color: FIGMA.subtitleMuted,
        marginBottom: spacing.lg,
        paddingHorizontal: spacing.sm,
    },
    devicesList: {
        gap: 14,
    },
    loadingWrap: {
        paddingVertical: spacing.xl,
        alignItems: 'center',
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 90,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        borderWidth: 0.5,
        borderColor: FIGMA.cardBorder,
        borderRadius: 12,
    },
    cardHighlighted: {
        backgroundColor: FIGMA.cardHighlightFill,
    },
    iconWrap: {
        width: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    deviceTextWrap: {
        flex: 1,
    },
    deviceName: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: colors.textDark,
    },
    deviceSublabel: {
        marginTop: 2,
        fontFamily: 'Poppins-Regular',
        fontSize: 11.5,
        color: FIGMA.textNote,
    },
    statusBadge: {
        borderWidth: 0.4,
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginRight: 8,
    },
    statusBadgeText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 9.8,
    },
    actionBtn: {
        paddingHorizontal: 4,
        paddingVertical: 8,
    },
    actionText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 11.5,
        color: colors.accentOrange,
    },
});
