import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    SafeAreaView,
    Linking,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { authApi } from '../../api';

export default function RecuperarPasswordEnviadoScreen({ route, navigation }) {
    const { email } = route.params || { email: 'usuario@ejemplo.com' };

    const [reenviarHabilitado, setReenviarHabilitado] = useState(false);
    const [contador, setContador] = useState(30);

    useEffect(() => {
        if (contador <= 0) {
            setReenviarHabilitado(true);
            return;
        }
        const timer = setTimeout(() => setContador((c) => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [contador]);

    const handleAbrirCorreo = async () => {
        const url = `mailto:${email}`;
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert('Error', 'No se pudo abrir la app de correo.');
            }
        } catch {
            Alert.alert('Error', 'No se pudo abrir la app de correo.');
        }
    };

    const handleReenviar = async () => {
        if (!reenviarHabilitado) return;
        setContador(30);
        setReenviarHabilitado(false);
        await authApi.requestPasswordReset(email);
        Alert.alert('Reenviado', 'Hemos enviado un nuevo enlace a tu correo.');
    };

    return (
        <SafeAreaView style={s.container}>
            <View style={s.content}>
                {/* Icono email — mockup usa círculo verde claro con icono email */}
                <View style={s.iconContainer}>
                    <Ionicons name="mail-outline" size={40} color={colors.green} />
                </View>

                {/* Header */}
                <View style={s.header}>
                    <Text style={s.title}>Revisa tu correo</Text>
                    <Text style={s.subtitle}>
                        Hemos enviado un enlace a{'\n'}
                        <Text style={s.emailDestino}>{email}</Text>. Caduca en 30 minutos.
                    </Text>
                </View>

                {/* Abrir app de correo */}
                <TouchableOpacity
                    style={s.primaryButton}
                    onPress={handleAbrirCorreo}
                    activeOpacity={0.85}
                >
                    <Text style={s.primaryButtonText}>Abrir app de correo</Text>
                </TouchableOpacity>

                {/* Reenviar — mockup: "¿No llega? Reenviar" en una línea */}
                <View style={s.resendContainer}>
                    <TouchableOpacity
                        onPress={handleReenviar}
                        disabled={!reenviarHabilitado}
                        activeOpacity={0.7}
                        style={s.resendButton}
                    >
                        {reenviarHabilitado ? (
                            <Text style={s.resendLabel}>
                                ¿No llega? <Text style={s.resendText}>Reenviar</Text>
                            </Text>
                        ) : (
                            <Text style={s.resendTextDisabled}>
                                Reenviar en 0:{contador.toString().padStart(2, '0')}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Volver */}
                <TouchableOpacity
                    style={s.backButton}
                    onPress={() => navigation.popToTop()}
                    activeOpacity={0.7}
                >
                    <Text style={s.backText}>Volver al inicio</Text>
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
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: colors.greenLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 28,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
        paddingHorizontal: 16,
    },
    title: {
        fontSize: 26,
        fontWeight: '900',
        color: colors.dark,
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        color: colors.grayText,
        textAlign: 'center',
        lineHeight: 22,
    },
    emailDestino: {
        fontWeight: '800',
        color: colors.dark,
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: colors.primary,
        width: '100%',
        paddingVertical: 16,
        borderRadius: 16,
        marginBottom: 16,
    },
    primaryButtonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
    resendContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 20,
    },
    resendButton: {
        paddingVertical: 10,
    },
    resendLabel: {
        fontSize: 14,
        color: colors.grayText,
        fontWeight: '600',
    },
    resendText: {
        color: colors.primary,
        fontWeight: '700',
    },
    resendTextDisabled: {
        fontSize: 14,
        color: colors.grayText,
        fontWeight: '600',
    },
    backButton: {
        paddingVertical: 10,
    },
    backText: {
        fontSize: 14,
        color: colors.grayText,
        fontWeight: '600',
    },
});
