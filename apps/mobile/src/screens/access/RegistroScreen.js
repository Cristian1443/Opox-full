import React, { useState, useRef } from 'react';
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
    ActivityIndicator,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { authApi } from '../../api';

const PASSWORD_COLORS = {
    fuerte: colors.green,
    media: colors.primary,
    débil: '#dc2626',
};

const validarPassword = (pass) => {
    if (pass.length < 6) return 'débil';
    if (pass.length < 10 || !/[0-9]/.test(pass)) return 'media';
    return 'fuerte';
};

export default function RegistroScreen({ navigation }) {
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fuerza, setFuerza] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [emailExistsError, setEmailExistsError] = useState(false);
    const emailInputRef = useRef(null);

    const handlePasswordChange = (text) => {
        setPassword(text);
        setFuerza(validarPassword(text));
    };

    const handleEmailChange = (text) => {
        setEmail(text);
        if (emailExistsError) setEmailExistsError(false);
    };

    const handleRegistro = async () => {
        if (!nombre || !email || !password) {
            Alert.alert('Error', 'Por favor completa todos los campos');
            return;
        }

        setIsLoading(true);
        setEmailExistsError(false);

        const { data, error } = await authApi.register({
            email,
            password,
            displayName: nombre,
        });

        setIsLoading(false);

        if (error) {
            if (error.code === 'auth/email-already-registered') {
                setEmailExistsError(true);
                return;
            }
            Alert.alert('Error', error.message);
            return;
        }

        // El backend devuelve accessToken vacío cuando Supabase tiene
        // "Confirm email" ON y aún hay OTP pendiente → pasamos a screen 1.6.
        // Si accessToken viene poblado (Confirm email OFF), saltamos OTP.
        if (data?.accessToken) {
            navigation.navigate('Terminos', { email });
        } else {
            navigation.navigate('Otp', { email });
        }
    };

    const handleIrALogin = () => {
        setEmailExistsError(false);
        navigation.navigate('Login', { prefillEmail: email });
    };

    const handleUsarOtroEmail = () => {
        setEmailExistsError(false);
        setEmail('');
        setTimeout(() => emailInputRef.current?.focus(), 50);
    };

    const isDisabled = !nombre || !email || !password || isLoading;

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
                        <Text style={s.title}>Crea tu cuenta</Text>
                        <Text style={s.subtitle}>Tardas menos de un minuto.</Text>
                    </View>

                    {/* Botones sociales */}
                    <View style={s.socialContainer}>
                        <TouchableOpacity style={s.socialButton} activeOpacity={0.8}>
                            <Ionicons name="logo-google" size={20} color={colors.dark} />
                            <Text style={s.socialText}>Continuar con Google</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.socialButton} activeOpacity={0.8}>
                            <Ionicons name="logo-facebook" size={20} color={colors.dark} />
                            <Text style={s.socialText}>Continuar con Meta</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.socialButton} activeOpacity={0.8}>
                            <Ionicons name="logo-apple" size={20} color={colors.dark} />
                            <Text style={s.socialText}>Continuar con Apple</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Divisor */}
                    <View style={s.dividerRow}>
                        <View style={s.dividerLine} />
                        <Text style={s.dividerText}>o con tu email</Text>
                        <View style={s.dividerLine} />
                    </View>

                    {/* Formulario */}
                    <View style={s.form}>
                        <TextInput
                            style={s.input}
                            placeholder="Nombre"
                            placeholderTextColor={colors.grayText}
                            value={nombre}
                            onChangeText={setNombre}
                        />

                        <TextInput
                            ref={emailInputRef}
                            style={[s.input, emailExistsError && s.inputError]}
                            placeholder="Email"
                            placeholderTextColor={colors.grayText}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={handleEmailChange}
                        />

                        <View>
                            <TextInput
                                style={s.input}
                                placeholder="Contraseña"
                                placeholderTextColor={colors.grayText}
                                secureTextEntry
                                value={password}
                                onChangeText={handlePasswordChange}
                            />
                            {password.length > 0 && (
                                <Text style={[s.passwordFeedback, { color: PASSWORD_COLORS[fuerza] }]}>
                                    {fuerza === 'media'
                                        ? 'Fuerza: media · añade un número o símbolo'
                                        : fuerza === 'fuerte'
                                            ? 'Fuerza: fuerte'
                                            : 'Fuerza: débil'}
                                </Text>
                            )}
                        </View>

                        <TouchableOpacity
                            style={[s.primaryButton, isDisabled && s.primaryButtonDisabled]}
                            onPress={handleRegistro}
                            activeOpacity={0.8}
                            disabled={isDisabled}
                        >
                            {isLoading ? (
                                <View style={s.processingRow}>
                                    <ActivityIndicator size="small" color={colors.white} />
                                    <Text style={s.primaryButtonText}>Creando cuenta...</Text>
                                </View>
                            ) : (
                                <Text style={s.primaryButtonText}>Crear cuenta</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* 1.2 · err — Email ya registrado (modal) */}
            <Modal
                transparent
                visible={emailExistsError}
                animationType="fade"
                statusBarTranslucent
                onRequestClose={() => setEmailExistsError(false)}
            >
                <View style={s.modalOverlay}>
                    <View style={s.modalDialog}>
                        <View style={s.modalIconBox}>
                            <Ionicons name="mail-outline" size={26} color={colors.grayText} />
                        </View>
                        <Text style={s.modalTitle}>Ese email ya tiene cuenta</Text>
                        <Text style={s.modalBody}>
                            Parece que ya te registraste con{' '}
                            <Text style={s.modalEmail}>{email}</Text>. ¿Quieres iniciar sesión?
                        </Text>

                        <TouchableOpacity
                            style={s.modalPrimary}
                            onPress={handleIrALogin}
                            activeOpacity={0.85}
                        >
                            <Text style={s.modalPrimaryText}>Ir a iniciar sesión</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={s.modalSecondary}
                            onPress={handleUsarOtroEmail}
                            activeOpacity={0.7}
                        >
                            <Text style={s.modalSecondaryText}>Usar otro email</Text>
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
    socialContainer: {
        gap: 12,
        marginBottom: 8,
    },
    socialButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        backgroundColor: colors.white,
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    socialText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.dark,
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
        gap: 12,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: colors.grayMid,
    },
    dividerText: {
        color: colors.grayText,
        fontSize: 13,
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
    passwordFeedback: {
        fontSize: 12,
        marginTop: 6,
        marginLeft: 4,
        fontWeight: '600',
    },
    inputError: {
        borderColor: '#f59e0b',
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
        backgroundColor: colors.grayLight,
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
    modalEmail: {
        fontWeight: '700',
        color: colors.dark,
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
        color: colors.dark,
        fontSize: 14,
        fontWeight: '600',
    },
});
