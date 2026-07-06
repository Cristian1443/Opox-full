import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    Pressable,
    Keyboard,
    ActivityIndicator,
} from 'react-native';
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
                            <Ionicons name="alert-circle" size={16} color="#dc2626" />
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

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
    content: {
        flex: 1,
        padding: 24,
        paddingBottom: 32,
        justifyContent: 'space-between',
    },
    topBlock: {
        paddingTop: 24,
    },
    header: {
        marginBottom: 32,
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: colors.dark,
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: colors.grayText,
        textAlign: 'center',
        lineHeight: 24,
    },
    emailHighlight: {
        fontWeight: '700',
        color: colors.dark,
    },
    // Wrapper de las casillas + input oculto
    otpWrapper: {
        position: 'relative',
        marginBottom: 20,
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
    },
    otpBox: {
        width: 48,
        height: 56,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: colors.grayMid,
        backgroundColor: colors.grayLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    otpBoxFilled: {
        borderColor: colors.primary,
        backgroundColor: colors.white,
    },
    otpBoxCurrent: {
        borderColor: colors.primary,
        borderWidth: 2,
    },
    otpBoxError: {
        borderColor: '#fca5a5',
        backgroundColor: '#fef2f2',
    },
    otpDigit: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.dark,
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
        fontSize: 24,
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
        color: '#dc2626',
        fontSize: 14,
        fontWeight: '600',
    },
    processingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    verifyButton: {
        backgroundColor: colors.primary,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    verifyButtonText: {
        color: colors.white,
        fontSize: 17,
        fontWeight: '700',
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
        color: colors.grayText,
        fontWeight: '600',
    },
    resendText: {
        color: colors.primary,
        fontWeight: '700',
    },
    resendTextDisabled: {
        color: colors.primary,
        fontWeight: '700',
        opacity: 0.5,
    },
});
