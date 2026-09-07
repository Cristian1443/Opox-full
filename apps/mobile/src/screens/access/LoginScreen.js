import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Modal,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { authApi } from '../../api';
import {
    detectBiometricType,
    biometricLabel,
    isBiometricLinked,
    loginWithBiometric,
} from '../../lib/biometric';
import OpoxLogo from '../../../assets/opoxLogo';
import { UserIcon, LockIcon, EyeOffIcon, FaceIdIcon, RememberToggleIcon } from '../../components/icons/LoginIcons';

const HERO_BG = require('../../../assets/login/hero_bg.jpg');

// Colores de marca puntuales de "LOGIN" / "ERROR CONTRASEÑA" (Figma
// elDJ7bHPEsMt5MMlSJ4BcI, nodes 2293:572 y 2349:733) que no tienen token
// exacto en theme.js (ver nota en la tarea: no se edita theme.js aquí).
const LINK_BLUE = '#56A1DF';
const PAGE_BG = '#F4F4F4';
const ICON_GRAY = '#BDB6BF';

const BLOCK_DURATION_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 3;

export default function LoginScreen({ navigation, route }) {
    const prefillEmail = route?.params?.prefillEmail || '';
    const [email, setEmail] = useState(prefillEmail);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
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
                // 1.3 · err "ERROR CONTRASEÑA" (Figma node 2349:733): copy exacta.
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
    const [biometricType, setBiometricType] = useState(null);

    useEffect(() => {
        (async () => {
            const [type, linked] = await Promise.all([
                detectBiometricType(),
                isBiometricLinked(),
            ]);
            setBiometricAvailable(type !== 'none' && linked);
            setBiometricLabelText(biometricLabel(type) || 'biometría');
            setBiometricType(type);
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
    // 1.3 · err: cuando hay error de login, el formulario colapsa a la variante
    // "ERROR CONTRASEÑA" (Figma node 2349:733) — desaparecen "recordar mis
    // datos" / "olvidé contraseña" / FaceID y el botón sube justo debajo del
    // mensaje de error.
    const showAuthError = Boolean(authError);

    return (
        <SafeAreaView style={s.container}>
            {/* Fondo texturizado de pantalla completa (907×1920 en Figma, mismo
                origen que "Entrada") — el patrón de cebra se concentra arriba y
                se desvanece a un gris plano hacia abajo, por eso cubre toda la
                pantalla en vez de recortarse solo en el header. */}
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                <Image source={HERO_BG} style={s.heroBg} resizeMode="cover" />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={s.flex}
            >
                <ScrollView
                    contentContainerStyle={s.scroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header / LOGO (Figma node 2293:573) */}
                    <View style={s.hero}>
                        <View style={s.logoBlock}>
                            <OpoxLogo width={196} />
                            <Text style={s.tagline}>Tu APP de Oposiciones Inteligente</Text>
                        </View>
                    </View>

                    <View style={s.header}>
                        <Text style={s.title}>Bienvenido/a de nuevo</Text>
                        <Text style={s.subtitle}>Accede a tu preparación</Text>
                    </View>

                    {/* Formulario */}
                    <View style={s.form}>
                        <View style={[s.inputWrap, showAuthError && s.inputWrapError]}>
                            <UserIcon size={22} color={showAuthError ? colors.statRed : ICON_GRAY} />
                            <TextInput
                                style={s.input}
                                placeholder="Correo o usuario"
                                placeholderTextColor={colors.textDark}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={(text) => {
                                    setEmail(text);
                                    if (error) setError(null);
                                }}
                            />
                        </View>

                        <View style={[s.inputWrap, showAuthError && s.inputWrapError]}>
                            <LockIcon size={20} color={showAuthError ? colors.statRed : ICON_GRAY} />
                            <TextInput
                                style={s.input}
                                placeholder="Contraseña"
                                placeholderTextColor={colors.textDark}
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={(text) => {
                                    setPassword(text);
                                    if (error) setError(null);
                                }}
                            />
                            <TouchableOpacity
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                onPress={() => setShowPassword((v) => !v)}
                            >
                                {showPassword ? (
                                    <Ionicons name="eye-outline" size={22} color={ICON_GRAY} />
                                ) : (
                                    <EyeOffIcon size={22} color={ICON_GRAY} />
                                )}
                            </TouchableOpacity>
                        </View>

                        {showAuthError ? (
                            // 1.3 · err — texto plano en rojo, sin icono (pixel-match Figma)
                            <Text style={s.errorText}>{authError}</Text>
                        ) : (
                            <View style={s.optionsRow}>
                                <TouchableOpacity
                                    style={s.rememberRow}
                                    onPress={() => setRememberMe((v) => !v)}
                                    activeOpacity={0.7}
                                >
                                    <RememberToggleIcon size={22} checked={rememberMe} />
                                    <Text style={s.rememberText}>Recordar mis datos</Text>
                                </TouchableOpacity>

                                <TouchableOpacity onPress={handleResetPassword}>
                                    <Text style={s.forgotPasswordText}>
                                        Olvidé mi <Text style={s.link}>contraseña</Text>
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <TouchableOpacity
                            style={[s.primaryButton, isDisabled && s.primaryButtonDisabled]}
                            onPress={handleLogin}
                            activeOpacity={0.85}
                            disabled={isDisabled}
                        >
                            <Text style={s.primaryButtonText}>
                                {isBlocked ? 'Cuenta bloqueada' : 'Acceder'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {!isBlocked && !showAuthError && biometricAvailable && (
                        <TouchableOpacity
                            style={s.biometricBlock}
                            onPress={handleBiometricLogin}
                            activeOpacity={0.8}
                        >
                            <Text style={s.biometricLabel}>Accede con {biometricLabelText}</Text>
                            {biometricType === 'finger' ? (
                                <Ionicons name="finger-print" size={96} color={colors.textDark} />
                            ) : (
                                <FaceIdIcon size={96} />
                            )}
                        </TouchableOpacity>
                    )}

                    {/* Ir a Registro */}
                    <View style={s.bottomTextContainer}>
                        <Text style={s.bottomText}>¿No tienes cuenta? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Registro')}>
                            <Text style={s.bottomLink}>Regístrate.</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Footer — ayuda + aviso legal (Figma node 2293:672) */}
                    <View style={s.footerRow}>
                        <View style={s.footerDot}>
                            <Text style={s.footerDotText}>?</Text>
                        </View>
                        <Text style={s.footerText}>Ayuda</Text>
                        <Text style={s.footerText}>Aviso legal</Text>
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
                            <Ionicons name="lock-closed" size={26} color={colors.statRed} />
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
        backgroundColor: PAGE_BG,
    },
    flex: { flex: 1 },
    scroll: {
        paddingBottom: 40,
    },
    hero: {
        height: 210,
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroBg: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        opacity: 0.8,
    },
    logoBlock: {
        alignItems: 'center',
        gap: 10,
    },
    tagline: {
        fontFamily: 'Poppins-Bold',
        fontSize: 12,
        color: colors.textDark,
        textAlign: 'center',
        letterSpacing: 0.2,
    },
    header: {
        paddingHorizontal: 24,
        marginTop: 20,
        marginBottom: 24,
    },
    title: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 26,
        color: colors.textDark,
        textAlign: 'center',
    },
    subtitle: {
        fontFamily: 'Poppins-Regular',
        fontSize: 15,
        color: colors.textDark,
        opacity: 0.5,
        textAlign: 'center',
        marginTop: 6,
    },
    form: {
        paddingHorizontal: 24,
        gap: 14,
    },
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: 'transparent',
        borderRadius: 18,
        paddingHorizontal: 18,
        paddingVertical: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    inputWrapError: {
        borderColor: colors.statRed,
    },
    input: {
        flex: 1,
        fontFamily: 'Poppins-Regular',
        fontSize: 15,
        color: colors.textDark,
        padding: 0,
    },
    errorText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
        color: colors.statRed,
        marginTop: -2,
    },
    optionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: -2,
    },
    rememberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    rememberText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 13,
        color: colors.textDark,
    },
    forgotPasswordText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 13,
        color: colors.textDark,
    },
    link: {
        color: LINK_BLUE,
    },
    primaryButton: {
        backgroundColor: colors.purple,
        paddingVertical: 18,
        borderRadius: 20,
        alignItems: 'center',
        marginTop: 8,
    },
    primaryButtonDisabled: {
        opacity: 0.5,
    },
    primaryButtonText: {
        color: colors.white,
        fontFamily: 'Poppins-SemiBold',
        fontSize: 17,
    },
    biometricBlock: {
        alignItems: 'center',
        marginTop: 28,
        gap: 14,
    },
    biometricLabel: {
        fontFamily: 'Poppins-Regular',
        fontSize: 15,
        color: colors.textDark,
    },
    bottomTextContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 30,
    },
    bottomText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 13,
        color: colors.textDark,
    },
    bottomLink: {
        fontFamily: 'Poppins-Regular',
        fontSize: 13,
        color: LINK_BLUE,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: 24,
    },
    footerDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: colors.textDark,
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerDotText: {
        color: colors.white,
        fontSize: 10,
        fontFamily: 'Poppins-Medium',
        lineHeight: 12,
    },
    footerText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 13,
        color: colors.textDark,
        marginLeft: 8,
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
        backgroundColor: colors.statRed,
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
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
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
        fontFamily: 'Poppins-SemiBold',
        fontSize: 18,
        color: colors.textDark,
        marginBottom: 8,
        textAlign: 'center',
    },
    modalBody: {
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        color: colors.textDark,
        opacity: 0.7,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    modalTimer: {
        fontFamily: 'Poppins-SemiBold',
        color: colors.statRed,
        opacity: 1,
    },
    modalPrimary: {
        width: '100%',
        backgroundColor: colors.purple,
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
        marginBottom: 4,
    },
    modalPrimaryText: {
        color: colors.white,
        fontFamily: 'Poppins-SemiBold',
        fontSize: 15,
    },
    modalSecondary: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    modalSecondaryText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
        color: colors.textDark,
        opacity: 0.6,
    },
});
