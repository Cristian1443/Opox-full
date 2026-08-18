import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    Pressable,
    Keyboard,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { authApi } from '../../api';

const OTP_LENGTH = 6;

export default function OtpScreen({ route, navigation }) {
    const { email } = route.params || { email: 'usuario@ejemplo.com' };

    // Un único string con el código. Las casillas solo son visualización.
    const [code, setCode] = useState('');
    const [timer, setTimer] = useState(32);
    const [isVerified, setIsVerified] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (isVerified || timer <= 0) return;
        const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
        return () => clearInterval(interval);
    }, [timer, isVerified]);

    // Enfoca el input oculto al montar la pantalla
    useEffect(() => {
        const t = setTimeout(() => inputRef.current?.focus(), 100);
        return () => clearTimeout(t);
    }, []);

    const handleChange = (text) => {
        if (error) setError('');
        // Solo dígitos, truncado al máximo
        const digits = (text || '').replace(/\D/g, '').slice(0, OTP_LENGTH);
        setCode(digits);
    };

    const focusInput = () => inputRef.current?.focus();

    const handleVerify = async () => {
        if (code.length < OTP_LENGTH || isVerifying) return;

        Keyboard.dismiss();
        setError('');
        setIsVerifying(true);

        const { data, error: apiError } = await authApi.verifyOtp({
            email,
            code,
            purpose: 'email_verification',
        });

        setIsVerifying(false);

        if (data?.accessToken) {
            setIsVerified(true);
            navigation.replace('Terminos', { email });
            return;
        }

        if (apiError?.code === 'auth/otp-expired') {
            setError('El código ha caducado. Solicita uno nuevo.');
        } else {
            setError(apiError?.message || 'Código incorrecto. Revísalo e inténtalo de nuevo.');
        }
    };

    const handleResend = async () => {
        if (timer > 0) return;
        setError('');
        setTimer(30);
        setCode('');
        focusInput();
        await authApi.sendOtp({ email, purpose: 'email_verification' });
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const isComplete = code.length === OTP_LENGTH;

    return (
        <SafeAreaView style={s.container}>
            <View style={s.content}>
                <View style={s.topBlock}>
                    {/* Volver */}
                    <TouchableOpacity
                        style={s.backRow}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Ionicons name="chevron-back" size={18} color={colors.textDark} />
                        <Text style={s.backText}>Volver</Text>
                    </TouchableOpacity>

                    {/* Header */}
                    <View style={s.header}>
                        <Text style={s.title}>Verifica tu email</Text>
                        <Text style={s.subtitle}>
                            Escribe el código de {OTP_LENGTH} dígitos que enviamos a{'\n'}
                            <Text style={s.emailHighlight}>{email}</Text>
                        </Text>
                    </View>

                    {/* Casillas OTP — solo VISUAL. El input real está oculto detrás. */}
                    <Pressable onPress={focusInput} style={s.otpWrapper}>
                        <View style={s.otpContainer}>
                            {Array.from({ length: OTP_LENGTH }).map((_, i) => {
                                const digit = code[i] || '';
                                const isCurrent = code.length === i;
                                return (
                                    <View
                                        key={i}
                                        style={[
                                            s.otpBox,
                                            digit && s.otpBoxFilled,
                                            isCurrent && s.otpBoxCurrent,
                                            isComplete && !error && s.otpBoxComplete,
                                            !!error && s.otpBoxError,
                                        ]}
                                    >
                                        <Text style={s.otpDigit}>{digit}</Text>
                                    </View>
                                );
                            })}
                        </View>

                        {/* Input oculto que captura toda la escritura */}
                        <TextInput
                            ref={inputRef}
                            style={s.hiddenInput}
                            value={code}
                            onChangeText={handleChange}
                            keyboardType="number-pad"
                            inputMode="numeric"
                            maxLength={OTP_LENGTH}
                            textContentType="oneTimeCode"
                            autoComplete="one-time-code"
                            autoFocus
                            caretHidden
                            editable={!isVerifying}
                        />
                    </Pressable>

                    {/* Error inline */}
                    {!!error && (
                        <View style={s.errorRow}>
                            <Ionicons name="alert-circle" size={16} color={colors.statRed} />
                            <Text style={s.errorText}>{error}</Text>
                        </View>
                    )}

                    {/* Reenviar */}
                    <TouchableOpacity
                        style={s.resendButton}
                        onPress={handleResend}
                        disabled={timer > 0}
                        activeOpacity={0.7}
                    >
                        {timer > 0 ? (
                            <Text style={s.resendLine}>
                                <Text style={s.resendLabel}>¿No te ha llegado? </Text>
                                <Text style={s.resendTextDisabled}>
                                    Reenviar en {formatTime(timer)}
                                </Text>
                            </Text>
                        ) : (
                            <Text style={s.resendLine}>
                                <Text style={s.resendLabel}>¿No te ha llegado? </Text>
                                <Text style={s.resendText}>Reenviar código</Text>
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* CTA anclada al bottom */}
                <TouchableOpacity
                    style={[s.verifyButton, (!isComplete || isVerifying) && s.buttonDisabled]}
                    onPress={handleVerify}
                    disabled={!isComplete || isVerifying}
                    activeOpacity={0.85}
                >
                    {isVerifying ? (
                        <View style={s.processingRow}>
                            <ActivityIndicator size="small" color={colors.white} />
                            <Text style={s.verifyButtonText}>Verificando...</Text>
                        </View>
                    ) : (
                        <Text style={s.verifyButtonText}>Verificar</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

// Tokens confirmados contra Figma (frame VERIFICACION) que no tienen
// equivalente exacto en theme.js — literales locales a esta pantalla.
const FIGMA = {
    background: '#F4F4F4',
    inputBorder: '#B8B8D2',
    inputText: '#1F1F39',
    link: '#56A1DF',
};

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: FIGMA.background,
    },
    content: {
        flex: 1,
        padding: 28,
        paddingBottom: 32,
        justifyContent: 'space-between',
    },
    topBlock: {
        paddingTop: 8,
    },
    backRow: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 4,
        marginBottom: 28,
        paddingVertical: 4,
    },
    backText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
        color: colors.textDark,
        opacity: 0.5,
    },
    header: {
        marginBottom: 28,
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    title: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 22,
        color: colors.textDark,
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontFamily: 'Poppins-Regular',
        fontSize: 13,
        lineHeight: 20,
        color: colors.textDark,
        opacity: 0.5,
        textAlign: 'center',
    },
    emailHighlight: {
        fontFamily: 'Poppins-SemiBold',
        color: colors.textDark,
        opacity: 1,
    },
    // Wrapper de las casillas + input oculto
    otpWrapper: {
        position: 'relative',
        marginBottom: 20,
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
    },
    otpBox: {
        width: 45,
        height: 51,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: FIGMA.inputBorder,
        backgroundColor: colors.white,
        alignItems: 'center',
        justifyContent: 'center',
    },
    otpBoxFilled: {
        borderColor: colors.purple,
    },
    otpBoxCurrent: {
        borderColor: colors.purple,
        borderWidth: 1.5,
    },
    otpBoxComplete: {
        borderColor: colors.purple,
        borderWidth: 1.5,
    },
    otpBoxError: {
        borderColor: colors.statRed,
        backgroundColor: colors.errorBg,
    },
    otpDigit: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 20,
        color: FIGMA.inputText,
    },
    // Input real, invisible pero foco-able
    hiddenInput: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0,
        // En web sin opacity 0.01 a veces el input no captura clics — dejamos 0
        color: 'transparent',
        fontSize: 22,
        textAlign: 'center',
    },
    errorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginBottom: 12,
    },
    errorText: {
        fontFamily: 'Poppins-Medium',
        color: colors.statRed,
        fontSize: 14,
    },
    processingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    verifyButton: {
        backgroundColor: colors.purple,
        paddingVertical: 18,
        borderRadius: 24,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    verifyButtonText: {
        fontFamily: 'Poppins-SemiBold',
        color: colors.white,
        fontSize: 16,
    },
    resendButton: {
        paddingVertical: 6,
        alignItems: 'center',
        marginTop: 12,
    },
    resendLine: {
        textAlign: 'center',
        fontSize: 14,
    },
    resendLabel: {
        fontFamily: 'Poppins-Regular',
        color: colors.textDark,
    },
    resendText: {
        fontFamily: 'Poppins-SemiBold',
        color: FIGMA.link,
    },
    resendTextDisabled: {
        fontFamily: 'Poppins-SemiBold',
        color: FIGMA.link,
    },
});