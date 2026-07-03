import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    Alert,
    ScrollView,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { authApi } from '../../api';
import {
    detectBiometricType,
    biometricLabel,
    isBiometricLinked,
    loginWithBiometric,
} from '../../lib/biometric';

const BLOCK_DURATION_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 3;

export default function LoginScreen({ navigation, route }) {
    const prefillEmail = route?.params?.prefillEmail || '';
    const [email, setEmail] = useState(prefillEmail);
    const [password, setPassword] = useState('');
    // error: null | { type: 'auth' | 'offline', message: string }
    const [error, setError] = useState(null);
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [blockUntil, setBlockUntil] = useState(null);
    const [now, setNow] = useState(Date.now());

    const isBlocked = blockUntil !== null && now < blockUntil;
    const timeRemaining = isBlocked ? Math.ceil((blockUntil - now) / 1000) : 0;
    const authError = !isBlocked && error && error.type === 'auth' ? error.message : null;
    const offlineError = !isBlocked && error && error.type === 'offline' ? error.message : null;

    useEffect(() => {
        if (!isBlocked) return;
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, [isBlocked]);

    useEffect(() => {
        if (blockUntil !== null && now >= blockUntil) {
            setBlockUntil(null);
            setFailedAttempts(0);
        }
    }, [now, blockUntil]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleLogin = async () => {
        if (isBlocked) return;
        setError(null);

        if (!email || !password) {
            setError({ type: 'auth', message: 'Por favor, rellena todos los campos.' });
            return;
        }

        const { data, error: apiError } = await authApi.login({ email, password });

        if (data?.accessToken) {
            setFailedAttempts(0);
            navigation.replace('SesionIniciada', { email });
            return;
        }

        // Mapeo de códigos backend → UI del bloque 1
        if (apiError?.code === 'common/network-error') {
            setError({ type: 'offline', message: apiError.message });
            return;
        }
        if (apiError?.code === 'auth/account-locked') {
            setBlockUntil(Date.now() + BLOCK_DURATION_MS);
            setNow(Date.now());
            setPassword('');
            return;
        }

        // auth/invalid-credentials u otro fallo: contamos intento y decidimos bloqueo local
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);

        if (nextAttempts >= MAX_ATTEMPTS) {
            setBlockUntil(Date.now() + BLOCK_DURATION_MS);
            setNow(Date.now());
            setPassword('');
        } else {
            setError({
                type: 'auth',
                message: apiError?.message || 'Email o contraseña incorrectos.',
            });
        }
    };

    const handleResetPassword = () => {
        setBlockUntil(null);
        setFailedAttempts(0);
        navigation.navigate('RecuperarPassword', { email });
    };

    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [biometricLabelText, setBiometricLabelText] = useState('Face ID');

    useEffect(() => {
        (async () => {
            const [type, linked] = await Promise.all([
                detectBiometricType(),
                isBiometricLinked(),
            ]);
            setBiometricAvailable(type !== 'none' && linked);
            setBiometricLabelText(biometricLabel(type) || 'biometría');
        })();
    }, []);

    const handleBiometricLogin = async () => {
        setError(null);
        const { ok, error: bioError, session } = await loginWithBiometric();
        if (ok && session?.accessToken) {
            navigation.replace('SesionIniciada', { email: session.user?.email });
            return;
        }
        setError({ type: 'auth', message: bioError || 'No te hemos reconocido.' });
    };

    const isDisabled = !email || !password || isBlocked;

    return (
        <SafeAreaView style={s.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={s.flex}
            >
                <ScrollView
                    contentContainerStyle={s.scroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={s.header}>
                        <Text style={s.title}>Bienvenido de nuevo</Text>
                        <Text style={s.subtitle}>Accede a tu preparación.</Text>
                    </View>

                    {/* Formulario */}
                    <View style={s.form}>
                        <TextInput
                            style={[s.input, authError && s.inputError]}
                            placeholder="juan@email.com"
                            placeholderTextColor={colors.grayText}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                if (error) setError(null);
                            }}
                        />

                        <View>
                            <TextInput
                                style={[s.input, authError && s.inputError]}
                                placeholder="Contraseña"
                                placeholderTextColor={colors.grayText}
                                secureTextEntry
                                value={password}
                                onChangeText={(text) => {
                                    setPassword(text);
                                    if (error) setError(null);
                                }}
                            />
                            <TouchableOpacity
                                style={s.forgotPassword}
                                onPress={() => navigation.navigate('RecuperarPassword')}
                            >
                                <Text style={s.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
                            </TouchableOpacity>
                        </View>

                        {/* 1.3 · err — inline, alineado izquierda con icono */}
                        {authError && (
                            <View style={s.errorRow}>
                                <Ionicons name="alert-circle" size={16} color="#dc2626" />
                                <Text style={s.errorRowText}>{authError}</Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={[s.primaryButton, isDisabled && s.primaryButtonDisabled]}
                            onPress={handleLogin}
                            activeOpacity={0.85}
                            disabled={isDisabled}
                        >
                            <Text style={s.primaryButtonText}>
                                {isBlocked ? 'Cuenta bloqueada' : 'Entrar'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {!isBlocked && biometricAvailable && (
                        <>
                            {/* Divisor */}
                            <View style={s.dividerRow}>
                                <View style={s.dividerLine} />
                                <Text style={s.dividerText}>o</Text>
                                <View style={s.dividerLine} />
                            </View>

                            {/* Biometría (1.4 / atajo) — botón outline con borde dark */}
                            <TouchableOpacity
                                style={s.biometricButton}
                                onPress={handleBiometricLogin}
                                activeOpacity={0.85}
                            >
                                <Ionicons name="scan-outline" size={20} color={colors.primary} />
                                <Text style={s.biometricText}>Entrar con {biometricLabelText}</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {/* Ir a Registro */}
                    <View style={s.bottomTextContainer}>
                        <Text style={s.bottomText}>¿No tienes cuenta? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Registro')}>
                            <Text style={s.bottomLink}>Crear cuenta</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* 1.x · err — Sin conexión (toast inferior) */}
            {offlineError && (
                <View style={s.toastWrapper} pointerEvents="box-none">
                    <View style={s.toast}>
                        <Ionicons name="wifi-outline" size={20} color={colors.white} />
                        <Text style={s.toastText}>{offlineError}</Text>
                    </View>
                </View>
            )}

            {/* 1.3 · err — Cuenta bloqueada (modal) */}
            <Modal
                transparent
                visible={isBlocked}
                animationType="fade"
                statusBarTranslucent
                onRequestClose={() => { }}
            >
                <View style={s.modalOverlay}>
                    <View style={s.modalDialog}>
                        <View style={s.modalIconBox}>
                            <Ionicons name="lock-closed" size={26} color="#dc2626" />
                        </View>
                        <Text style={s.modalTitle}>Cuenta bloqueada temporalmente</Text>
                        <Text style={s.modalBody}>
                            Demasiados intentos fallidos. Vuelve a probar en{' '}
                            <Text style={s.modalTimer}>{formatTime(timeRemaining)}</Text>{' '}
                            o restablece tu contraseña.
                        </Text>

                        <TouchableOpacity
                            style={s.modalPrimary}
                            onPress={handleResetPassword}
                            activeOpacity={0.85}
                        >
                            <Text style={s.modalPrimaryText}>Restablecer contraseña</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={s.modalSecondary}
                            onPress={() => { /* seguir bloqueado hasta timer */ }}
                            activeOpacity={0.7}
                        >
                            <Text style={s.modalSecondaryText}>Entendido</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
    flex: { flex: 1 },
    scroll: {
        padding: 24,
        paddingBottom: 40,
    },
    header: {
        marginTop: 20,
        marginBottom: 28,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: colors.dark,
    },
    subtitle: {
        fontSize: 16,
        color: colors.grayText,
        marginTop: 8,
    },
    form: {
        gap: 16,
    },
    input: {
        backgroundColor: colors.grayLight,
        borderWidth: 1,
        borderColor: colors.grayMid,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: colors.dark,
    },
    inputError: {
        borderColor: '#fca5a5',
        backgroundColor: '#fef2f2',
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginTop: 8,
    },
    forgotPasswordText: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    errorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: -6,
    },
    errorRowText: {
        color: '#dc2626',
        fontSize: 14,
        fontWeight: '600',
    },
    primaryButton: {
        backgroundColor: colors.primary,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 10,
    },
    primaryButtonDisabled: {
        opacity: 0.5,
    },
    primaryButtonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
        gap: 12,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: colors.grayMid,
    },
    dividerText: {
        color: colors.grayText,
        fontSize: 14,
        fontWeight: '600',
    },
    biometricButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 14,
        backgroundColor: colors.white,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: colors.dark,
    },
    biometricText: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.dark,
    },
    bottomTextContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 30,
    },
    bottomText: {
        fontSize: 14,
        color: colors.grayText,
    },
    bottomLink: {
        fontSize: 14,
        color: colors.primary,
        fontWeight: '700',
    },
    // 1.x · err — toast offline
    toastWrapper: {
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 32,
    },
    toast: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#ef4444',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
    },
    toastText: {
        flex: 1,
        color: colors.white,
        fontSize: 14,
        fontWeight: '600',
        lineHeight: 20,
    },
    // 1.3 · err — modal bloqueo
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    modalDialog: {
        width: '100%',
        backgroundColor: colors.white,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
    },
    modalIconBox: {
        width: 56,
        height: 56,
        borderRadius: 14,
        backgroundColor: '#fecaca',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: colors.dark,
        marginBottom: 8,
        textAlign: 'center',
    },
    modalBody: {
        fontSize: 14,
        color: colors.grayText,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    modalTimer: {
        fontWeight: '800',
        color: '#dc2626',
    },
    modalPrimary: {
        width: '100%',
        backgroundColor: colors.primary,
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
        marginBottom: 4,
    },
    modalPrimaryText: {
        color: colors.white,
        fontWeight: '700',
        fontSize: 15,
    },
    modalSecondary: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    modalSecondaryText: {
        color: colors.grayText,
        fontSize: 14,
        fontWeight: '600',
    },
});
