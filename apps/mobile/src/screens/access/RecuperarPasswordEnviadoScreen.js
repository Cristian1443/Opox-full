import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Linking,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../theme';
import { authApi } from '../../api';

// Ruta exacta exportada de Figma (icono "ERROR EMAIL", 125×93 — sobre).
function EmailIcon({ size = 40, color = colors.textDark }) {
    return (
        <Svg width={size} height={size * (93 / 125)} viewBox="0 0 125 93" fill="none" style={{ marginBottom: 16 }}>
            <Path d="M114.48 92.07H10.41C7.65083 92.07 5.00452 90.9746 3.05255 89.0245C1.10059 87.0744 0.0026505 84.4292 0 81.67V10.41C0.00264757 7.64991 1.10026 5.00362 3.05194 3.05194C5.00362 1.10026 7.64991 0.00264757 10.41 0L114.48 0C117.24 0.00264757 119.886 1.10026 121.838 3.05194C123.79 5.00362 124.887 7.64991 124.89 10.41V81.67C124.887 84.4292 123.789 87.0744 121.837 89.0245C119.885 90.9746 117.239 92.07 114.48 92.07ZM10.41 6.94C9.4897 6.94 8.60709 7.30559 7.95634 7.95634C7.30559 8.60709 6.94 9.4897 6.94 10.41V81.67C6.94 82.5903 7.30559 83.4729 7.95634 84.1237C8.60709 84.7744 9.4897 85.14 10.41 85.14H114.48C114.94 85.1453 115.396 85.0595 115.822 84.8876C116.248 84.7157 116.636 84.4611 116.963 84.1385C117.29 83.8159 117.55 83.4316 117.728 83.008C117.906 82.5843 117.999 82.1295 118 81.67V10.41C117.997 9.49051 117.631 8.60943 116.981 7.95925C116.331 7.30907 115.449 6.94264 114.53 6.94H10.41Z" fill={color} />
            <Path d="M62.4399 59C61.6187 58.9963 60.8252 58.7023 60.1999 58.17L2.99988 9.57996C2.59962 9.30611 2.2612 8.9514 2.00646 8.5387C1.75173 8.126 1.58633 7.66449 1.52094 7.18394C1.45555 6.70338 1.49163 6.21445 1.62683 5.7487C1.76204 5.28294 1.99338 4.8507 2.30593 4.47986C2.61848 4.10902 3.00529 3.80781 3.44141 3.59567C3.87754 3.38353 4.35329 3.26516 4.83798 3.24821C5.32267 3.23126 5.80552 3.3161 6.2554 3.49726C6.70528 3.67841 7.11219 3.95186 7.44988 4.29996L62.4399 51L117.44 4.33996C117.782 4.01724 118.187 3.76755 118.629 3.60608C119.071 3.44461 119.541 3.37472 120.011 3.40068C120.481 3.42664 120.941 3.5479 121.362 3.75708C121.784 3.96626 122.158 4.25899 122.463 4.61748C122.768 4.97596 122.997 5.39271 123.135 5.84237C123.274 6.29203 123.32 6.76522 123.27 7.23314C123.22 7.70107 123.076 8.15397 122.845 8.56429C122.615 8.97461 122.303 9.33378 121.93 9.61996L64.6899 58.15C64.0648 58.6917 63.2671 58.9931 62.4399 59Z" fill={color} />
        </Svg>
    );
}

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
                {/* Volver — Figma: "‹ Volver" morado #412950 al 50% opacidad, arriba a la izquierda */}
                <TouchableOpacity
                    style={s.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Ionicons name="chevron-back" size={20} color={colors.textDark} />
                    <Text style={s.backText}>Volver</Text>
                </TouchableOpacity>

                <View style={s.centerBlock}>
                    {/* Header */}
                    <View style={s.header}>
                        <EmailIcon />
                        <Text style={s.title}>Revisa tu correo</Text>
                        <Text style={s.subtitle}>
                            Hemos enviado un enlace a{' '}
                            <Text style={s.emailDestino}>{email}</Text>. Caduca en 30 minutos.
                        </Text>
                    </View>

                    {/* Abrir app de correo — Figma: botón morado #7241B8 */}
                    <TouchableOpacity
                        style={s.primaryButton}
                        onPress={handleAbrirCorreo}
                        activeOpacity={0.85}
                    >
                        <Text style={s.primaryButtonText}>Abrir app de correo</Text>
                    </TouchableOpacity>

                    {/* Reenviar — Figma: "¿No te ha llegado? Reenviar" (link azul #56A1DF) */}
                    <View style={s.resendContainer}>
                        <TouchableOpacity
                            onPress={handleReenviar}
                            disabled={!reenviarHabilitado}
                            activeOpacity={0.7}
                            style={s.resendButton}
                        >
                            {reenviarHabilitado ? (
                                <Text style={s.resendLabel}>
                                    ¿No te ha llegado? <Text style={s.resendText}>Reenviar</Text>
                                </Text>
                            ) : (
                                <Text style={s.resendLabel}>
                                    ¿No te ha llegado?{' '}
                                    <Text style={s.resendTextDisabled}>
                                        Reenviar en 0:{contador.toString().padStart(2, '0')}
                                    </Text>
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f4f4f4',
    },
    content: {
        flex: 1,
        padding: 24,
        paddingBottom: 32,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        opacity: 0.5,
    },
    backText: {
        fontSize: 19,
        fontFamily: 'Poppins-Regular',
        color: colors.textDark,
    },
    centerBlock: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
        paddingHorizontal: 16,
    },
    title: {
        fontSize: 28,
        fontFamily: 'Poppins-SemiBold',
        color: colors.textDark,
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        fontFamily: 'Poppins-Regular',
        color: colors.textDark,
        opacity: 0.5,
        textAlign: 'center',
        lineHeight: 21,
    },
    emailDestino: {
        fontFamily: 'Poppins-SemiBold',
        color: colors.textDark,
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: colors.purple,
        width: '100%',
        paddingVertical: 20,
        borderRadius: 19,
        marginBottom: 16,
    },
    primaryButtonText: {
        color: colors.white,
        fontSize: 21,
        fontFamily: 'Poppins-SemiBold',
    },
    resendContainer: {
        width: '100%',
        alignItems: 'center',
    },
    resendButton: {
        paddingVertical: 10,
    },
    resendLabel: {
        fontSize: 13,
        fontFamily: 'Poppins-Regular',
        color: colors.textDark,
    },
    resendText: {
        fontSize: 14,
        fontFamily: 'Poppins-SemiBold',
        color: '#56A1DF',
    },
    resendTextDisabled: {
        fontSize: 14,
        fontFamily: 'Poppins-SemiBold',
        color: '#56A1DF',
        opacity: 0.5,
    },
});
