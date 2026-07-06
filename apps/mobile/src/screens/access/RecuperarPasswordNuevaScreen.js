import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { authApi } from '../../api';

// 4 segmentos: uno por cada criterio cumplido, color según categoría del segmento
const SEGMENT_COLORS = [colors.green, colors.green, colors.primary, colors.green];

const evaluarFuerza = (pass) => {
    if (!pass) return { fuerza: '', mensaje: '', segments: [false, false, false, false] };

    const segments = [
        pass.length >= 6,
        pass.length >= 10,
        /[0-9]/.test(pass),
        /[^A-Za-z0-9]/.test(pass),
    ];
    const count = segments.filter(Boolean).length;

    if (count <= 1) {
        return { fuerza: 'débil', mensaje: 'Fuerza: débil · usa al menos 8 caracteres.', segments };
    }
    if (count <= 3) {
        return { fuerza: 'media', mensaje: 'Fuerza: media · añade un número o símbolo.', segments };
    }
    return { fuerza: 'fuerte', mensaje: 'Fuerza: fuerte. ¡Buena elección!', segments };
};

export default function RecuperarPasswordNuevaScreen({ navigation, route }) {
    // El deep link del email de recuperación debería inyectar aquí el resetToken
    const resetToken = route?.params?.resetToken || '';

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fuerza, setFuerza] = useState('');
    const [mensajeFuerza, setMensajeFuerza] = useState('');
    const [segments, setSegments] = useState([false, false, false, false]);
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handlePasswordChange = (text) => {
        setPassword(text);
        setError('');
        const resultado = evaluarFuerza(text);
        setFuerza(resultado.fuerza);
        setMensajeFuerza(resultado.mensaje);
        setSegments(resultado.segments);
    };

    const handleConfirmChange = (text) => {
        setConfirmPassword(text);
        setError('');
    };

    const handleGuardar = async () => {
        setError('');

        if (!password || !confirmPassword) {
            setError('Por favor, rellena ambos campos.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }
        if (fuerza !== 'fuerte') {
            setError('Por favor, elige una contraseña más segura.');
            return;
        }

        setIsSaving(true);
        const { data, error: apiError } = await authApi.confirmPasswordReset({
            resetToken,
            newPassword: password,
        });
        setIsSaving(false);

        if (apiError) {
            setError(apiError.message);
            return;
        }
        if (data?.accessToken) {
            navigation.replace('SesionIniciada');
        }
    };

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
                        <Text style={s.title}>Crea tu nueva clave</Text>
                        <Text style={s.subtitle}>Que no la uses en otras webs.</Text>
                    </View>

                    {/* Formulario */}
                    <View style={s.form}>
                        <TextInput
                            style={s.input}
                            placeholder="Nueva contraseña"
                            placeholderTextColor={colors.grayText}
                            secureTextEntry
                            value={password}
                            onChangeText={handlePasswordChange}
                        />

                        <TextInput
                            style={s.input}
                            placeholder="Repite contraseña"
                            placeholderTextColor={colors.grayText}
                            secureTextEntry
                            value={confirmPassword}
                            onChangeText={handleConfirmChange}
                        />

                        {/* Barra de fuerza segmentada (mockup 1.5c) */}
                        {password.length > 0 && (
                            <View>
                                <View style={s.segmentBar}>
                                    {segments.map((filled, i) => (
                                        <View
                                            key={i}
                                            style={[
                                                s.segment,
                                                {
                                                    backgroundColor: filled
                                                        ? SEGMENT_COLORS[i]
                                                        : colors.grayMid,
                                                },
                                            ]}
                                        />
                                    ))}
                                </View>
                                <Text style={s.feedbackText}>{mensajeFuerza}</Text>
                            </View>
                        )}

                        {error ? (
                            <View style={s.errorContainer}>
                                <Ionicons name="alert-circle" size={18} color="#dc2626" />
                                <Text style={s.errorText}>{error}</Text>
                            </View>
                        ) : null}
                    </View>

                    {/* CTA anclada al bottom */}
                    <View style={s.spacer} />
                    <TouchableOpacity
                        style={[s.primaryButton, isSaving && s.buttonDisabled]}
                        onPress={handleGuardar}
                        disabled={isSaving}
                        activeOpacity={0.85}
                    >
                        {isSaving ? (
                            <View style={s.processingRow}>
                                <ActivityIndicator size="small" color={colors.white} />
                                <Text style={s.primaryButtonText}>Guardando...</Text>
                            </View>
                        ) : (
                            <Text style={s.primaryButtonText}>Guardar y entrar</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
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
        paddingBottom: 32,
        flexGrow: 1,
    },
    spacer: {
        flex: 1,
        minHeight: 24,
    },
    header: {
        marginTop: 20,
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: colors.dark,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: colors.grayText,
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
    segmentBar: {
        flexDirection: 'row',
        gap: 6,
        marginTop: 2,
    },
    segment: {
        flex: 1,
        height: 5,
        borderRadius: 3,
    },
    feedbackText: {
        fontSize: 13,
        marginTop: 8,
        color: colors.grayText,
        fontWeight: '600',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: colors.redSoft,
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    errorText: {
        color: '#dc2626',
        fontSize: 14,
        flex: 1,
    },
    primaryButton: {
        backgroundColor: colors.primary,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.6,
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
});
