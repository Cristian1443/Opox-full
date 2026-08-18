import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ActivityIndicator,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme';
import { detectBiometricType, biometricLabel, setupBiometric } from '../../lib/biometric';
import { FaceScanIcon, LockIcon } from '../../components/icons/AccessIcons';
import AlertCardModal from '../../components/AlertCardModal';

// Fondo confirmado contra Figma (frame FACE ID) — sin token exacto en theme.js.
const FIGMA_BG = '#F4F4F4';

export default function BioLinkScreen({ navigation, route }) {
    const [isProcessing, setIsProcessing] = useState(false);
    // route.params.forceError lo usa el Dev Menu para saltar directo al estado de error.
    // null | 'not-recognized' | 'locked'
    const [errorState, setErrorState] = useState(
        route?.params?.forceError ? 'not-recognized' : null
    );
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

    const handleActivateBiometrics = async () => {
        setIsProcessing(true);
        setErrorState(null);

        const { ok, error } = await setupBiometric();
        setIsProcessing(false);

        if (ok) {
            navigation.replace('SesionIniciada');
        } else if (error === 'lockout') {
            setErrorState('locked');
        } else if (error && error !== 'cancelada') {
            setErrorState('not-recognized');
        }
    };

    const handleSkip = () => navigation.replace('SesionIniciada');

    const handleRetry = () => {
        setErrorState(null);
        handleActivateBiometrics();
    };

    const handleUsePassword = () => {
        setErrorState(null);
        navigation.navigate('Login');
    };

    const handleResetPassword = () => {
        setErrorState(null);
        navigation.navigate('RecuperarPassword');
    };

    return (
        <SafeAreaView style={s.container}>
            <StatusBar barStyle="dark-content" backgroundColor={FIGMA_BG} />

            <TouchableOpacity
                style={s.backButton}
                onPress={() => navigation.goBack()}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
                <Text style={s.backButtonText}>‹ Volver</Text>
            </TouchableOpacity>

            <View style={s.content}>
                <FaceScanIcon size={100} color={colors.textDark} />

                <Text style={s.title}>Activa el acceso rápido</Text>
                <Text style={s.subtitle}>
                    Usa {BIOMETRIC_TYPE} para entrar sin escribir la contraseña cada vez.
                </Text>

                <View style={s.actions}>
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
                </View>
            </View>

            {/* Frame Figma "ERROR FACE ID" #1 (2349:851) — no reconocido */}
            <AlertCardModal
                visible={errorState === 'not-recognized'}
                iconBg="transparent"
                iconSize={70}
                icon={<FaceScanIcon size={70} color={colors.statRed} />}
                title="No te hemos reconocido"
                description="Inténtalo otra vez o entra con tu contraseña."
                primaryLabel={`Reintentar ${BIOMETRIC_TYPE}`}
                primaryColor={colors.purple}
                onPrimaryPress={handleRetry}
                secondaryLabel="Usar contraseña"
                onSecondaryPress={handleUsePassword}
            />

            {/* Frame Figma "ERROR FACE ID" #2 (2349:872) — cuenta bloqueada */}
            <AlertCardModal
                visible={errorState === 'locked'}
                iconBg="transparent"
                iconSize={70}
                icon={<LockIcon size={70} color={colors.textDark} />}
                title="Cuenta bloqueada temporalmente"
                description="Demasiados intentos fallidos. Vuelve a probar en 15 minutos o restablece tu contraseña."
                primaryLabel="Restablecer contraseña"
                primaryColor={colors.purple}
                onPrimaryPress={handleResetPassword}
                secondaryLabel="Entendido"
                onSecondaryPress={() => setErrorState(null)}
            />
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: FIGMA_BG,
        paddingHorizontal: 24,
    },
    backButton: {
        marginTop: 12,
        alignSelf: 'flex-start',
        paddingVertical: 8,
    },
    backButtonText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        color: colors.textDark,
        opacity: 0.5,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        marginTop: 32,
        fontFamily: 'Poppins-SemiBold',
        fontSize: 22,
        color: colors.textDark,
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontFamily: 'Poppins-Regular',
        fontSize: 13,
        lineHeight: 20,
        color: colors.textDark,
        opacity: 0.5,
        textAlign: 'center',
        maxWidth: 300,
        marginBottom: 40,
    },
    actions: {
        width: '100%',
        gap: 12,
    },
    primaryButton: {
        backgroundColor: colors.purple,
        paddingVertical: 18,
        borderRadius: 24,
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
        fontFamily: 'Poppins-SemiBold',
    },
    skipButton: {
        marginTop: 12,
        paddingVertical: 8,
        alignItems: 'center',
    },
    skipText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 16,
        color: colors.purple,
    },
});
