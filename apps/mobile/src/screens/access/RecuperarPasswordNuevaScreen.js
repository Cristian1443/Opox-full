import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    TextInput,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import Text from '../../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { authApi } from '../../api';

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
        return { fuerza: 'débil', mensaje: 'Fuerza débil: usa al menos 8 caracteres.', segments };
    }
    if (count <= 3) {
        return { fuerza: 'media', mensaje: 'Fuerza media: añade un número o símbolo.', segments };
    }
    return { fuerza: 'fuerte', mensaje: 'Fuerza fuerte: ¡buena elección!', segments };
};

/** Extrae token_hash de una URL completa (opox://reset-password?token_hash=xxx)
 *  o devuelve la cadena tal cual si ya es el hash en bruto. */
function parseTokenFromInput(raw) {
    if (!raw) return '';
    const trimmed = raw.trim();
    try {
        const url = new URL(trimmed.replace(/^opox:\/\//, 'https://opox-placeholder'));
        const hash = url.searchParams.get('token_hash');
        if (hash) return hash;
    } catch { /* no es URL — usar como hash directo */ }
    return trimmed;
}

export default function RecuperarPasswordNuevaScreen({ navigation, route }) {
    // El deep link de recuperación (opox://reset-password?token_hash=...&type=recovery)
    // llega con `token_hash` en la query — React Navigation lo vuelca tal
    // cual en route.params. `resetToken` queda como fallback para navegación
    // manual (ej. DevMenu) pasando el param directamente con ese nombre.
    const tokenFromParams = route?.params?.token_hash || route?.params?.resetToken || '';

    // Si no llega token por deep link (Gmail bloqueó el esquema custom), el
    // usuario puede pegar el enlace del correo manualmente.
    const [manualLink, setManualLink] = useState('');
    const resetToken = tokenFromParams || parseTokenFromInput(manualLink);

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
                    {/* Volver — Figma: "‹ Volver" morado #412950 al 50% opacidad */}
                    <TouchableOpacity
                        style={s.backButton}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="chevron-back" size={20} color={colors.textDark} />
                        <Text style={s.backText}>Volver</Text>
                    </TouchableOpacity>

                    {/* Header */}
                    <View style={s.header}>
                        <Text style={s.title}>Crea tu nueva clave</Text>
                        <Text style={s.subtitle}>Que no la uses en otras webs.</Text>
                    </View>

                    {/* Campo manual — solo visible cuando el deep link no llegó.
                        El usuario copia el enlace del email y lo pega aquí. */}
                    {!tokenFromParams && (
                        <View style={s.manualBlock}>
                            <Text style={s.manualLabel}>
                                ¿El botón del correo no abrió la app?{'\n'}Copia el enlace del email y pégalo aquí:
                            </Text>
                            <TextInput
                                style={s.manualInput}
                                placeholder="opox://reset-password?token_hash=…"
                                placeholderTextColor="rgba(65,41,80,0.35)"
                                value={manualLink}
                                onChangeText={setManualLink}
                                autoCapitalize="none"
                                autoCorrect={false}
                                multiline
                            />
                        </View>
                    )}

                    {/* Formulario */}
                    <View style={s.form}>
                        <TextInput
                            style={s.input}
                            placeholder="Nueva contraseña"
                            placeholderTextColor={colors.textDark}
                            secureTextEntry
                            value={password}
                            onChangeText={handlePasswordChange}
                        />

                        <TextInput
                            style={s.input}
                            placeholder="Repite la contraseña"
                            placeholderTextColor={colors.textDark}
                            secureTextEntry
                            value={confirmPassword}
                            onChangeText={handleConfirmChange}
                        />

                        {/* Barra de fuerza segmentada: 4 tramos, uno por criterio cumplido.
                            Verde cuando el criterio se cumple, gris cuando no — nunca rojo,
                            un criterio cumplido nunca es un estado de error. */}
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
                                                        ? colors.statGreen
                                                        : colors.separator,
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

                    {/* CTA anclada al bottom — Figma: botón morado #7241B8 "Guardar y entrar" */}
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
        backgroundColor: '#f4f4f4',
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
    header: {
        marginTop: 20,
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontFamily: 'Poppins-SemiBold',
        color: colors.textDark,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        fontFamily: 'Poppins-Regular',
        color: colors.textDark,
        opacity: 0.5,
    },
    manualBlock: {
        backgroundColor: 'rgba(65,41,80,0.07)',
        borderRadius: 14,
        padding: 16,
        marginBottom: 20,
        gap: 10,
    },
    manualLabel: {
        fontSize: 13,
        fontFamily: 'Poppins-Regular',
        color: colors.textDark,
        opacity: 0.7,
        lineHeight: 18,
    },
    manualInput: {
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 14,
        fontSize: 12,
        fontFamily: 'Poppins-Regular',
        color: colors.textDark,
        minHeight: 60,
    },
    form: {
        gap: 16,
    },
    input: {
        backgroundColor: colors.white,
        borderRadius: 20,
        padding: 20,
        fontSize: 17,
        fontFamily: 'Poppins-Regular',
        color: colors.textDark,
    },
    segmentBar: {
        flexDirection: 'row',
        gap: 6,
        marginTop: 2,
    },
    segment: {
        flex: 1,
        height: 8,
        borderRadius: 4,
    },
    feedbackText: {
        fontSize: 13,
        marginTop: 8,
        color: colors.textDark,
        fontFamily: 'Poppins-Regular',
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
        fontFamily: 'Poppins-Regular',
        flex: 1,
    },
    primaryButton: {
        backgroundColor: colors.purple,
        paddingVertical: 20,
        borderRadius: 19,
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
        fontSize: 21,
        fontFamily: 'Poppins-SemiBold',
    },
});
