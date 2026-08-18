import React, { useState, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ScrollView,
    ActivityIndicator,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme';
import { authApi } from '../../api';
import OpoxWordmark from '../../../assets/opoxLogo';
import { GoogleLogo, AppleLogo } from '../../components/icons/SocialAuthIcons';
import EmailAlreadyRegisteredModal from '../../components/EmailAlreadyRegisteredModal';

// Figma: elDJ7bHPEsMt5MMlSJ4BcI — frame "CREAR CUENTA" (node 2349:34).
// Fondo de la pantalla (#f4f4f4) es literal de Figma: no coincide exactamente
// con ningún token de theme.js (colors.grayLight = #f4f5f7), así que se deja
// como hex directo en vez de reusar un token que no es idéntico.
const SCREEN_BG = '#f4f4f4';

const PASSWORD_COLORS = {
    fuerte: colors.statGreen,
    media: colors.accentOrange,
    débil: colors.statRed,
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

    // TODO(bloque1): cablear authApi.oauthLogin(provider) cuando el SDK nativo
    // de Google/Meta/Apple esté integrado — de momento los botones sociales
    // son solo visuales (igual que antes de este cambio, no había onPress).
    const socialButtons = [
        { key: 'google', label: 'Continuar con Google', icon: <GoogleLogo size={20} /> },
        {
            key: 'meta',
            label: 'Continuar con Meta',
            icon: (
                <View style={s.metaLogoClip}>
                    <Image
                        source={require('../../../assets/logo-meta.png')}
                        style={s.metaLogoImage}
                        resizeMode="cover"
                    />
                </View>
            ),
        },
        { key: 'apple', label: 'Continuar con Apple', icon: <AppleLogo size={19} /> },
    ];

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
                        <Text style={s.subtitle}>Tardas menos de un minuto</Text>
                    </View>

                    {/* Botones sociales */}
                    <View style={s.socialContainer}>
                        {socialButtons.map((btn) => (
                            <TouchableOpacity key={btn.key} style={s.socialButton} activeOpacity={0.8}>
                                {btn.icon}
                                <Text style={s.socialText}>{btn.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Divisor */}
                    <Text style={s.dividerText}>– o con tu email –</Text>

                    {/* Formulario */}
                    <View style={s.form}>
                        <TextInput
                            style={s.input}
                            placeholder="Nombre"
                            placeholderTextColor={colors.textDark}
                            value={nombre}
                            onChangeText={setNombre}
                        />

                        <TextInput
                            ref={emailInputRef}
                            style={[s.input, emailExistsError && s.inputError]}
                            placeholder="Email"
                            placeholderTextColor={colors.textDark}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={handleEmailChange}
                        />

                        <View>
                            <TextInput
                                style={s.input}
                                placeholder="Contraseña"
                                placeholderTextColor={colors.textDark}
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
                            activeOpacity={0.85}
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

                    {/* Footer: wordmark + Ayuda / Aviso legal */}
                    <View style={s.footerLogoWrap}>
                        <OpoxWordmark width={96} />
                    </View>
                    <View style={s.footerRow}>
                        <View style={s.footerLink}>
                            <View style={s.helpBadge}>
                                <Text style={s.helpBadgeText}>?</Text>
                            </View>
                            <Text style={s.footerLinkText}>Ayuda</Text>
                        </View>
                        <Text style={s.footerLinkText}>Aviso legal</Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* 1.2 · err — Email ya registrado (modal) */}
            <EmailAlreadyRegisteredModal
                visible={emailExistsError}
                email={email}
                onGoToLogin={handleIrALogin}
                onUseAnotherEmail={handleUsarOtroEmail}
            />
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: SCREEN_BG,
    },
    flex: { flex: 1 },
    scroll: {
        padding: 24,
        paddingBottom: 32,
    },
    header: {
        marginTop: 16,
        marginBottom: 26,
        alignItems: 'center',
    },
    title: {
        fontSize: 26,
        fontFamily: 'Poppins-SemiBold',
        color: colors.textDark,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        fontFamily: 'Poppins-Regular',
        color: colors.textDark,
        opacity: 0.5,
        marginTop: 6,
        textAlign: 'center',
    },
    socialContainer: {
        gap: 12,
        marginBottom: 4,
    },
    socialButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        backgroundColor: colors.white,
        height: 58,
        borderRadius: 18,
    },
    metaLogoClip: {
        width: 22,
        height: 15,
        overflow: 'hidden',
    },
    metaLogoImage: {
        width: 96,
        height: 19,
    },
    socialText: {
        fontSize: 15,
        fontFamily: 'Poppins-SemiBold',
        color: colors.textDark,
    },
    dividerText: {
        color: colors.textDark,
        fontSize: 13,
        fontFamily: 'Poppins-Light',
        textAlign: 'center',
        marginVertical: 18,
    },
    form: {
        gap: 14,
    },
    input: {
        backgroundColor: colors.white,
        borderRadius: 16,
        paddingHorizontal: 18,
        height: 56,
        fontSize: 15,
        fontFamily: 'Poppins-Regular',
        color: colors.textDark,
    },
    passwordFeedback: {
        fontSize: 12,
        marginTop: 6,
        marginLeft: 4,
        fontFamily: 'Poppins-Medium',
    },
    inputError: {
        borderWidth: 1.5,
        borderColor: colors.statRed,
    },
    primaryButton: {
        backgroundColor: colors.purple,
        height: 60,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
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
        fontSize: 17,
        fontFamily: 'Poppins-SemiBold',
    },
    footerLogoWrap: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 14,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 22,
    },
    footerLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    helpBadge: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: colors.purple,
        alignItems: 'center',
        justifyContent: 'center',
    },
    helpBadgeText: {
        color: colors.white,
        fontSize: 10,
        fontFamily: 'Poppins-SemiBold',
    },
    footerLinkText: {
        color: colors.textDark,
        fontSize: 12,
        fontFamily: 'Poppins-Medium',
    },
});
