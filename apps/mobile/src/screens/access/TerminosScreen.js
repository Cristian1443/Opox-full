import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { authApi } from '../../api';
import { TERMS_VERSION, PRIVACY_VERSION } from '@opox/constants';
import { detectBiometricType, isBiometricLinked } from '../../lib/biometric';

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

    return (
        <SafeAreaView style={s.container}>
            <ScrollView
                contentContainerStyle={s.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={s.header}>
                    <Text style={s.title}>Antes de empezar</Text>
                </View>

                {/* Condiciones de uso */}
                <View style={s.section}>
                    <TouchableOpacity
                        style={s.linkHeader}
                        onPress={() => abrirEnlace('Condiciones de uso')}
                        activeOpacity={0.7}
                    >
                        <Text style={s.sectionTitle}>Condiciones de uso</Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.primary} />
                    </TouchableOpacity>
                    <Text style={s.sectionText}>
                        Opox es una herramienta de apoyo al estudio. Los contenidos no sustituyen las fuentes oficiales…
                    </Text>
                </View>

                {/* Protección de datos */}
                <View style={s.section}>
                    <TouchableOpacity
                        style={s.linkHeader}
                        onPress={() => abrirEnlace('Protección de datos')}
                        activeOpacity={0.7}
                    >
                        <Text style={s.sectionTitle}>Protección de datos</Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.primary} />
                    </TouchableOpacity>
                    <Text style={s.sectionText}>
                        Tratamos tus datos conforme al RGPD y la LOPDGDD. Los datos biométricos y de salud se procesan en tu dispositivo…
                    </Text>
                </View>

                <Text style={s.extraInfo}>Para más detalle consulta la política completa.</Text>

                {/* Checkbox */}
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
                        .
                    </Text>
                </TouchableOpacity>

                <View style={s.spacer} />

                {/* CTA anclada al bottom */}
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
        backgroundColor: colors.white,
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
    header: {
        marginTop: 8,
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: colors.dark,
    },
    section: {
        marginBottom: 16,
        backgroundColor: colors.grayLight,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.grayMid,
    },
    linkHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.primary,
    },
    sectionText: {
        fontSize: 14,
        color: colors.grayText,
        lineHeight: 20,
    },
    extraInfo: {
        fontSize: 13,
        color: colors.grayText,
        fontStyle: 'italic',
        marginBottom: 24,
        marginTop: 8,
        textAlign: 'center',
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
        borderColor: colors.grayMid,
        backgroundColor: colors.white,
        marginRight: 12,
        marginTop: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    checkboxText: {
        flex: 1,
        fontSize: 14,
        color: colors.dark,
        lineHeight: 20,
    },
    linkText: {
        color: colors.primary,
        fontWeight: '700',
        textDecorationLine: 'underline',
    },
    primaryButton: {
        backgroundColor: colors.primary,
        paddingVertical: 16,
        borderRadius: 16,
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
        color: colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
});
