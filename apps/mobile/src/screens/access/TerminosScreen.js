import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { authApi } from '../../api';
import { TERMS_VERSION, PRIVACY_VERSION } from '@opox/constants';
import { detectBiometricType, isBiometricLinked } from '../../lib/biometric';

// Colores del frame Figma "TERMINOS Y PRIVACIDAD" (2349:491) sin equivalente
// exacto en theme.js — se dejan literales aquí a propósito (otros agentes
// tocan theme.js en paralelo para otras pantallas del mismo bloque).
const FIGMA = {
    pageBg: '#f4f4f4',
    linkBlue: '#56a1df',
};

export default function TerminosScreen({ navigation, route }) {
    const { email } = route.params || { email: 'usuario@ejemplo.com' };
    const [aceptado, setAceptado] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // TODO: sustituir por Linking.openURL('https://opox.app/…') o WebView
    const abrirEnlace = (titulo) => {
        Alert.alert(
            `Leer ${titulo}`,
            'Aquí se abriría el documento completo en un WebView o navegador externo.',
            [{ text: 'Entendido', style: 'default' }],
        );
    };

    const handleAceptar = async () => {
        if (!aceptado || isLoading) return;
        setIsLoading(true);

        const { error } = await authApi.acceptTerms({
            termsVersion: TERMS_VERSION,
            privacyVersion: PRIVACY_VERSION,
        });
        setIsLoading(false);

        if (error) {
            Alert.alert('Error', error.message);
            return;
        }

        // Ofrecer BioLink solo si el dispositivo tiene biometría Y aún no
        // hay vínculo local. Si no, saltar directo a SesionIniciada.
        const [type, linked] = await Promise.all([
            detectBiometricType(),
            isBiometricLinked(),
        ]);
        if (type !== 'none' && !linked) {
            navigation.replace('BioLink');
        } else {
            navigation.replace('SesionIniciada', { email });
        }
    };

    const canContinue = aceptado && !isLoading;
    const canGoBack = navigation?.canGoBack?.();

    return (
        <SafeAreaView style={s.container}>
            <ScrollView
                contentContainerStyle={s.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* < Volver (2349:635) */}
                {canGoBack && (
                    <TouchableOpacity
                        style={s.backButton}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.7}
                    >
                        <Text style={s.backButtonText}>{'< Volver'}</Text>
                    </TouchableOpacity>
                )}

                {/* Header (2349:495) */}
                <View style={s.header}>
                    <Text style={s.title}>Antes de empezar</Text>
                </View>

                {/* Tarjeta blanca (2349:506 "Rectangle 3467704") con el texto legal
                    real (2349:504) — Condiciones de uso + Protección de datos */}
                <View style={s.card}>
                    <Text style={s.cardText}>
                        <Text style={s.cardHeading}>Condiciones de uso</Text>
                        {'\n'}
                        Opox es una herramienta de apoyo al estudio. Los contenidos no sustituyen las fuentes oficiales…
                        {'\n\n'}
                        <Text style={s.cardHeading}>Protección de datos</Text>
                        {'\n'}
                        Tratamos tus datos conforme al RGPD y la LOPDGDD. Los datos biométricos y de salud se procesan en tu dispositivo…
                        {'\n\n'}
                        Para más detalle consulta la política completa.
                    </Text>
                </View>

                {/* Checkbox + texto de aceptación (2349:512 "recordar mis datos") */}
                <TouchableOpacity
                    style={s.checkboxContainer}
                    onPress={() => setAceptado(!aceptado)}
                    activeOpacity={0.7}
                >
                    <View style={[s.checkbox, aceptado && s.checkboxChecked]}>
                        {aceptado && <Ionicons name="checkmark" size={16} color={colors.white} />}
                    </View>
                    <Text style={s.checkboxText}>
                        Acepto las{' '}
                        <Text style={s.linkText} onPress={() => abrirEnlace('Condiciones de uso')}>
                            condiciones de uso
                        </Text>
                        {' '}y la{' '}
                        <Text style={s.linkText} onPress={() => abrirEnlace('Protección de datos')}>
                            política de privacidad
                        </Text>
                    </Text>
                </TouchableOpacity>

                <View style={s.spacer} />

                {/* BOTON (2349:492/493/494) */}
                <TouchableOpacity
                    style={[s.primaryButton, !canContinue && s.buttonDisabled]}
                    onPress={handleAceptar}
                    disabled={!canContinue}
                    activeOpacity={0.85}
                >
                    {isLoading ? (
                        <View style={s.processingRow}>
                            <ActivityIndicator size="small" color={colors.white} />
                            <Text style={s.primaryButtonText}>Procesando...</Text>
                        </View>
                    ) : (
                        <Text style={s.primaryButtonText}>Aceptar y continuar</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: FIGMA.pageBg,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 32,
        flexGrow: 1,
    },
    spacer: {
        flex: 1,
        minHeight: 16,
    },
    backButton: {
        alignSelf: 'flex-start',
        marginBottom: 12,
        paddingVertical: 4,
    },
    backButtonText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 16,
        color: colors.textDark,
        opacity: 0.5,
    },
    header: {
        marginTop: 4,
        marginBottom: 20,
    },
    title: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 28,
        color: colors.textDark,
        textAlign: 'center',
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: 28,
        padding: 20,
        marginBottom: 20,
    },
    cardText: {
        fontFamily: 'Poppins-Light',
        fontSize: 14,
        lineHeight: 21,
        color: colors.textDark,
    },
    cardHeading: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 15,
        color: colors.textDark,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 24,
        padding: 4,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: colors.gray,
        backgroundColor: colors.white,
        marginRight: 12,
        marginTop: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: colors.purple,
        borderColor: colors.purple,
    },
    checkboxText: {
        flex: 1,
        fontFamily: 'Poppins-Regular',
        fontSize: 15,
        color: colors.textDark,
        lineHeight: 21,
    },
    linkText: {
        fontFamily: 'Poppins-SemiBold',
        color: FIGMA.linkBlue,
    },
    primaryButton: {
        backgroundColor: colors.purple,
        paddingVertical: 18,
        borderRadius: 28,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    processingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    primaryButtonText: {
        fontFamily: 'Poppins-SemiBold',
        color: colors.white,
        fontSize: 18,
    },
});
