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
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { authApi } from '../../api';

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).toLowerCase());

export default function RecuperarPasswordEmailScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSendLink = async () => {
        setError('');

        if (!email) {
            setError('Por favor, introduce tu email.');
            return;
        }
        if (!isValidEmail(email)) {
            setError('Introduce un email válido.');
            return;
        }

        setIsSending(true);
        // Backend responde OK aunque el email no exista (anti-enumeración).
        await authApi.requestPasswordReset(email);
        setIsSending(false);

        navigation.navigate('RecuperarPasswordEnviado', { email });
    };

    return (
        <SafeAreaView style={s.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={s.flex}
            >
                <View style={s.content}>
                    {/* Volver */}
                    <TouchableOpacity
                        style={s.backButton}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="chevron-back" size={22} color={colors.primary} />
                        <Text style={s.backText}>Volver</Text>
                    </TouchableOpacity>

                    {/* Header */}
                    <View style={s.header}>
                        <Text style={s.title}>Recupera el acceso</Text>
                        <Text style={s.subtitle}>
                            Te enviaremos un enlace para crear una contraseña nueva.
                        </Text>
                    </View>

                    {/* Formulario */}
                    <View style={s.form}>
                        <TextInput
                            style={[s.input, error && s.inputError]}
                            placeholder="Tu email"
                            placeholderTextColor={colors.grayText}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                if (error) setError('');
                            }}
                        />

                        {error ? (
                            <View style={s.errorRow}>
                                <Ionicons name="alert-circle" size={16} color="#dc2626" />
                                <Text style={s.errorText}>{error}</Text>
                            </View>
                        ) : null}
                    </View>

                    {/* CTA anclada al bottom (thumb reach) */}
                    <View style={s.spacer} />
                    <TouchableOpacity
                        style={[s.primaryButton, isSending && s.buttonDisabled]}
                        onPress={handleSendLink}
                        disabled={isSending}
                        activeOpacity={0.85}
                    >
                        {isSending ? (
                            <View style={s.processingRow}>
                                <ActivityIndicator size="small" color={colors.white} />
                                <Text style={s.primaryButtonText}>Enviando...</Text>
                            </View>
                        ) : (
                            <Text style={s.primaryButtonText}>Enviar enlace</Text>
                        )}
                    </TouchableOpacity>
                </View>
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
    content: {
        flex: 1,
        padding: 24,
        paddingBottom: 32,
    },
    spacer: {
        flex: 1,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 4,
    },
    backText: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.primary,
    },
    header: {
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: colors.dark,
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: colors.grayText,
        lineHeight: 24,
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
        borderColor: '#dc2626',
    },
    errorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: -8,
    },
    errorText: {
        color: '#dc2626',
        fontSize: 14,
        fontWeight: '600',
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
