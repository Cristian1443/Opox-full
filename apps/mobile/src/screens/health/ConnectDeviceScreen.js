// Bloque 3 · Salud — Pantalla 3.2 · Conexión de dispositivo
import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';
import { colors, spacing } from '../../theme';
import HealthScreenHeader from '../../components/HealthScreenHeader';
import ConnectionErrorModal from '../../components/ConnectionErrorModal';

// Colores confirmados contra Figma (frame CONEXION DISPOSITIVO, Bloque 3)
// sin equivalente exacto en theme.js.
const FIGMA = {
    subtitleMuted: 'rgba(65,41,80,0.5)',
    cardBorder: 'rgba(65,41,80,0.3)',
    cardHighlightFill: 'rgba(235,235,235,0.5)',
    textNote: '#343A3D',
    greenBadgeBg: 'rgba(36,189,144,0.15)',
};

// Datos de dispositivos (mock hasta integrar backend). Solo Apple Watch
// llega "connected"; Garmin dispara el mock de error de emparejamiento;
// el resto ofrece "Conectar", salvo "Solo smartphone" que ofrece "Usar".
const devicesData = [
    {
        id: 'apple-watch',
        name: 'Apple Watch',
        sublabel: 'Series 9 · sincronizado hace 2 min',
        status: 'connected',
        icon: 'watch',
    },
    {
        id: 'garmin',
        name: 'Garmin',
        sublabel: 'Connect',
        status: 'connect',
        icon: 'roundWatch',
    },
    {
        id: 'fitbit',
        name: 'Fitbit/Pixel Watch',
        sublabel: 'Google Health',
        status: 'connect',
        icon: 'phone',
    },
    {
        id: 'samsung',
        name: 'Samsung Galaxy Watch',
        sublabel: 'Samsung Health',
        status: 'connect',
        icon: 'phone',
    },
    {
        id: 'solo-smartphone',
        name: 'Solo smartphone',
        sublabel: 'Sensores del móvil (limitado)',
        status: 'use',
        icon: 'phone',
    },
];

// ─── Iconos aproximados (ver nota: no son el asset exportado) ───────────────
function WatchIcon({ size = 28, color = colors.accentOrange }) {
    return (
        <Svg width={size} height={size * 1.15} viewBox="0 0 24 28">
            <Rect x="4" y="1" width="10" height="4" rx="1.5" stroke={color} strokeWidth={1.6} fill="none" />
            <Rect x="4" y="23" width="10" height="4" rx="1.5" stroke={color} strokeWidth={1.6} fill="none" />
            <Rect x="2.5" y="6" width="13" height="16" rx="4" stroke={color} strokeWidth={1.8} fill="none" />
            <Line x1="18" y1="11" x2="20.5" y2="11" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
            <Line x1="18" y1="17" x2="20.5" y2="17" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
    );
}

function RoundWatchIcon({ size = 28, color = colors.accentOrange }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth={1.8} fill="none" />
            <Path d="M12 7.5V12L15 14" stroke={color} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <Line x1="12" y1="1.8" x2="12" y2="3.4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
    );
}

function PhoneIcon({ size = 24, color = colors.accentOrange }) {
    return (
        <Svg width={size} height={size * 1.4} viewBox="0 0 20 28">
            <Rect x="1.5" y="1.5" width="17" height="25" rx="3.5" stroke={color} strokeWidth={1.8} fill="none" />
            <Line x1="7" y1="23" x2="13" y2="23" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
    );
}

function DeviceIcon({ type }) {
    if (type === 'watch') return <WatchIcon />;
    if (type === 'roundWatch') return <RoundWatchIcon />;
    return <PhoneIcon />;
}

export default function ConnectDeviceScreen({ navigation }) {
    const [errorDevice, setErrorDevice] = useState(null);

    // Mock determinista: Garmin dispara error, el resto navega al flujo 3.3.
    // Cuando exista pairing real, sustituir por el resultado del backend.
    const handleConnect = (device) => {
        if (device.id === 'garmin') {
            setErrorDevice(device);
        } else {
            navigation.navigate('Pairing', { device });
        }
    };

    const handleRetry = () => {
        const device = errorDevice;
        setErrorDevice(null);
        navigation.navigate('Pairing', { device });
    };

    const renderDeviceItem = (device) => {
        const isConnected = device.status === 'connected';

        return (
            <View
                key={device.id}
                style={[styles.card, isConnected && styles.cardHighlighted]}
            >
                <View style={styles.iconWrap}>
                    <DeviceIcon type={device.icon} />
                </View>

                <View style={styles.deviceTextWrap}>
                    <Text style={styles.deviceName}>{device.name}</Text>
                    <Text style={styles.deviceSublabel}>{device.sublabel}</Text>
                </View>

                {isConnected ? (
                    <View style={styles.connectedBadge}>
                        <Text style={styles.connectedBadgeText}>Conectado</Text>
                    </View>
                ) : (
                    <TouchableOpacity activeOpacity={0.7} onPress={() => handleConnect(device)}>
                        <Text style={styles.actionText}>{device.status === 'use' ? 'Usar' : 'Conectar'}</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <HealthScreenHeader title="Conectar dispositivo" onBack={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.subtitle}>
                    Sincroniza tu wearable para el control de fatiga en tiempo real.
                </Text>

                <View style={styles.devicesList}>
                    {devicesData.map((device) => renderDeviceItem(device))}
                </View>

                <View style={{ height: spacing.lg }} />
            </ScrollView>

            <ConnectionErrorModal
                visible={!!errorDevice}
                onRetry={handleRetry}
                onClose={() => setErrorDevice(null)}
            />
        </SafeAreaView>
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
        fontSize: 10.5,
        color: FIGMA.subtitleMuted,
        marginBottom: spacing.lg,
        paddingHorizontal: spacing.sm,
    },
    devicesList: {
        gap: 14,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 119,
        paddingHorizontal: spacing.md,
        borderWidth: 0.3,
        borderColor: FIGMA.cardBorder,
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
    connectedBadge: {
        backgroundColor: FIGMA.greenBadgeBg,
        borderWidth: 0.4,
        borderColor: colors.ctaGreen,
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    connectedBadgeText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 9.8,
        color: colors.ctaGreen,
    },
    actionText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 9.8,
        color: colors.textDark,
    },
});
