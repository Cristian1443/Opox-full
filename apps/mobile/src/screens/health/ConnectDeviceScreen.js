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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import HealthScreenHeader from '../../components/HealthScreenHeader';
import ConnectionErrorModal from '../../components/ConnectionErrorModal';

// Datos simulados de dispositivos (mock hasta integrar backend)
const devicesData = [
    {
        id: '1',
        name: 'Apple Watch',
        model: 'Series 9',
        status: 'connected',
        lastSync: 'hace 2 min',
        icon: 'logo-apple',
        iconColor: '#333',
        type: 'watch',
    },
    {
        id: '2',
        name: 'Garmin',
        model: 'Connect',
        status: 'available',
        icon: 'watch',
        iconColor: '#FF5722',
        type: 'watch',
    },
    {
        id: '3',
        name: 'Fitbit / Pixel Watch',
        model: 'Google Health',
        status: 'available',
        icon: 'watch-outline',
        iconColor: '#4285F4',
        type: 'watch',
    },
    {
        id: '4',
        name: 'Samsung Galaxy Watch',
        model: 'Samsung Health',
        status: 'available',
        icon: 'logo-android',
        iconColor: '#14B7A0',
        type: 'watch',
    },
    {
        id: '5',
        name: 'Solo smartphone',
        model: 'Sensores del móvil (limitado)',
        status: 'available',
        iconColor: '#8E8E93',
        type: 'phone',
    },
];

export default function ConnectDeviceScreen({ navigation }) {
    const [errorDevice, setErrorDevice] = useState(null);

    // Mock determinista: Garmin (id '2') dispara error, el resto navega al flujo 3.3.
    // Cuando exista pairing real, sustituir por el resultado del backend.
    const handleConnect = (device) => {
        if (device.id === '2') {
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
            <TouchableOpacity
                key={device.id}
                style={[styles.deviceCard, isConnected && styles.deviceCardConnected]}
                onPress={() => handleConnect(device)}
                disabled={isConnected}
                activeOpacity={isConnected ? 1 : 0.7}
            >
                <View style={styles.deviceHeader}>
                    <View style={styles.iconContainer}>
                        {device.type === 'watch' ? (
                            <Ionicons name={device.icon} size={28} color={device.iconColor} />
                        ) : (
                            <MaterialCommunityIcons name="cellphone" size={28} color={device.iconColor} />
                        )}
                    </View>

                    <View style={styles.deviceInfo}>
                        <Text style={[styles.deviceName, isConnected && styles.deviceNameConnected]}>
                            {device.name}
                        </Text>
                        <Text style={styles.deviceModel}>{device.model}</Text>
                    </View>

                    <View style={styles.actionContainer}>
                        {isConnected ? (
                            <View style={styles.connectedBadge}>
                                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                                <Text style={styles.connectedText}>Conectado</Text>
                            </View>
                        ) : (
                            <View style={styles.connectButton}>
                                <Text style={styles.connectButtonText}>Conectar</Text>
                            </View>
                        )}
                    </View>
                </View>

                {isConnected && (
                    <View style={styles.syncInfo}>
                        <Ionicons name="refresh-outline" size={14} color={colors.success} />
                        <Text style={styles.syncText}>{device.lastSync}</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <HealthScreenHeader title="Conectar dispositivo" onBack={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.subtitle}>
                    Sincroniza tu wearable para el control de fatiga en tiempo real.
                </Text>

                <View style={styles.listContainer}>
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
        backgroundColor: colors.background,
    },
    scrollContent: {
        padding: spacing.md,
    },
    subtitle: {
        fontSize: 16,
        color: colors.textSecondary,
        marginBottom: spacing.lg,
        lineHeight: 22,
    },
    listContainer: {
        gap: spacing.sm,
    },
    deviceCard: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.separator,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 2,
    },
    deviceCardConnected: {
        borderColor: colors.success,
        backgroundColor: colors.successBg,
    },
    deviceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.03)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    deviceInfo: {
        flex: 1,
    },
    deviceName: {
        fontSize: 17,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 2,
    },
    deviceNameConnected: {
        color: colors.success,
    },
    deviceModel: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    actionContainer: {
        marginLeft: spacing.sm,
    },
    connectedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(52, 199, 89, 0.1)',
        paddingHorizontal: spacing.sm,
        paddingVertical: 6,
        borderRadius: 20,
    },
    connectedText: {
        color: colors.success,
        fontWeight: '600',
        fontSize: 13,
        marginLeft: 4,
    },
    connectButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: 8,
        borderRadius: 20,
    },
    connectButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
    syncInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.sm,
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: 'rgba(52, 199, 89, 0.2)',
    },
    syncText: {
        fontSize: 13,
        color: colors.success,
        marginLeft: 6,
    },
});
