import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { detectBiometricType, biometricLabel, setupBiometric } from '../../lib/biometric';

const ICON_BY_TYPE = {
    face: 'scan-outline',
    finger: 'finger-print',
    both: 'scan-outline',
    none: 'scan-outline',
};

export default function BioLinkScreen({ navigation, route }) {
    const [isProcessing, setIsProcessing] = useState(false);
    // route.params.forceError lo usa el Dev Menu para saltar directo al estado 1.4 · err
    const [showError, setShowError] = useState(!!route?.params?.forceError);
    const [biometricType, setBiometricType] = useState(null);

    useEffect(() => {
        (async () => {
            const t = await detectBiometricType();
            setBiometricType(t);
            // Si el dispositivo no tiene biometría, saltamos esta pantalla.
            if (t === 'none' && !route?.params?.forceError) {
                navigation.replace('SesionIniciada');
            }
        })();
    }, [navigation, route?.params?.forceError]);

    const BIOMETRIC_TYPE = biometricLabel(biometricType) || 'biometría';
    const BIOMETRIC_ICON = ICON_BY_TYPE[biometricType] || 'scan-outline';

    const handleActivateBiometrics = async () => {
        setIsProcessing(true);
        setShowError(false);

        const { ok, error } = await setupBiometric();
        setIsProcessing(false);

        if (ok) {
            navigation.replace('SesionIniciada');
        } else if (error && !error.includes('cancelada')) {
            setShowError(true);
        }
    };

    const handleSkip = () => navigation.replace('SesionIniciada');

    const handleRetry = () => {
        setShowError(false);
        handleActivateBiometrics();
    };

    return (
        <SafeAreaView style={s.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.dark} />

            <View style={s.content}>
                <View style={[s.iconFrame, showError && s.iconFrameError]}>
                    <Ionicons
                        name={BIOMETRIC_ICON}
                        size={72}
                        color={showError ? '#f87171' : colors.primary}
                    />
                </View>

                <Text style={s.title}>
                    {showError ? 'No te hemos reconocido' : 'Activa el acceso rápido'}
                </Text>
                <Text style={s.subtitle}>
                    {showError
                        ? 'Inténtalo otra vez o entra con tu contraseña.'
                        : `Usa ${BIOMETRIC_TYPE} para entrar sin escribir la contraseña cada vez.`}
                </Text>

                <View style={s.actions}>
                    {showError ? (
                        <>
                            <TouchableOpacity
                                style={s.primaryButton}
                                onPress={handleRetry}
                                activeOpacity={0.85}
                            >
                                <Text style={s.primaryButtonText}>Reintentar {BIOMETRIC_TYPE}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={s.darkButton}
                                onPress={() => navigation.navigate('Login')}
                                activeOpacity={0.85}
                            >
                                <Text style={s.darkButtonText}>Usar contraseña</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <TouchableOpacity
                                style={[s.primaryButton, isProcessing && s.buttonDisabled]}
                                onPress={handleActivateBiometrics}
                                disabled={isProcessing}
                                activeOpacity={0.85}
                            >
                                {isProcessing ? (
                                    <View style={s.processingRow}>
                                        <ActivityIndicator size="small" color={colors.white} />
                                        <Text style={s.primaryButtonText}>Verificando...</Text>
                                    </View>
                                ) : (
                                    <Text style={s.primaryButtonText}>Activar {BIOMETRIC_TYPE}</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={s.skipButton}
                                onPress={handleSkip}
                                activeOpacity={0.7}
                            >
                                <Text style={s.skipText}>Ahora no</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.dark,
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconFrame: {
        width: 140,
        height: 140,
        borderRadius: 28,
        borderWidth: 2,
        borderColor: 'rgba(242, 101, 53, 0.4)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    iconFrameError: {
        borderColor: 'rgba(248, 113, 113, 0.5)',
    },
    title: {
        fontSize: 26,
        fontWeight: '900',
        color: colors.white,
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 15,
        color: colors.grayText,
        textAlign: 'center',
        lineHeight: 22,
        maxWidth: 300,
        marginBottom: 48,
    },
    actions: {
        width: '100%',
        gap: 12,
    },
    primaryButton: {
        backgroundColor: colors.primary,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    processingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    primaryButtonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
    darkButton: {
        backgroundColor: '#1a2a3f',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    darkButtonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
    skipButton: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    skipText: {
        fontSize: 15,
        color: colors.grayText,
        fontWeight: '600',
    },
});
