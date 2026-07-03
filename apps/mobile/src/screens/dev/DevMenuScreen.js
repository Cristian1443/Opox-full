import React from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

/**
 * Menú de desarrollo — SOLO para validar visualmente las pantallas contra los mockups.
 * Quitar / mover cuando el bloque 1 esté validado y pasemos a producción.
 */
const SECTIONS = [
    {
        title: 'Flujo natural',
        rows: [
            {
                label: '▶ Ejecutar flujo desde Splash',
                route: 'Splash',
                highlight: true,
            },
        ],
    },
    {
        title: 'Bloque 0 · Onboarding',
        rows: [
            { label: '0.1 · Splash', route: 'Splash' },
            { label: '0.1 · err · Sin conexión', route: 'SplashNoConnection' },
            { label: '0.1 · err · Update requerido', route: 'SplashUpdate' },
            { label: '0.2 · Onboarding Slider', route: 'OnboardingSlider' },
            { label: '0.3 · Opposition Selector', route: 'OppositionSelector' },
            { label: '0.4 · Level Test Proposal', route: 'LevelTestProposal' },
            { label: '0.4 · Level Test In Progress', route: 'LevelTestInProgress' },
            { label: '0.4 · Level Test Result', route: 'LevelTestResult' },
            { label: '0.5 · Permissions', route: 'Permissions' },
        ],
    },
    {
        title: 'Bloque 1 · Acceso',
        rows: [
            { label: '1.1 · Entrada', route: 'Entrada' },
            { label: '1.2 · Registro', route: 'Registro' },
            { label: '1.3 · Login', route: 'Login' },
            { label: '1.4 · Bio-Link (Face ID / Huella)', route: 'BioLink' },
            {
                label: '1.5a · Recuperar · Email',
                route: 'RecuperarPassword',
            },
            {
                label: '1.5b · Recuperar · Correo enviado',
                route: 'RecuperarPasswordEnviado',
                params: { email: 'demo@opox.app' },
            },
            {
                label: '1.5c · Recuperar · Nueva contraseña',
                route: 'RecuperarPasswordNueva',
            },
            {
                label: '1.6 · Verificación · OTP',
                route: 'Otp',
                params: { email: 'demo@opox.app' },
            },
            { label: '1.7 · Términos y Privacidad', route: 'Terminos' },
            {
                label: '1.x · ok · Sesión iniciada',
                route: 'SesionIniciada',
                params: { email: 'demo@opox.app' },
            },
        ],
    },
    {
        title: 'Estados de error (cómo dispararlos)',
        rows: [
            {
                label: '1.2 · err · Email ya registrado',
                hint: 'Registro → usa email con "@ejemplo.com"',
                route: 'Registro',
            },
            {
                label: '1.3 · err · Credenciales incorrectas',
                hint: 'Login → email con "@" + contraseña de 1-4 caracteres',
                route: 'Login',
            },
            {
                label: '1.3 · err · Cuenta bloqueada',
                hint: 'Login → 3 intentos fallidos consecutivos (15 min lock)',
                route: 'Login',
            },
            {
                label: '1.4 · err · Face ID no reconocido',
                hint: 'Salta directo al estado de error (Reintentar / Usar contraseña)',
                route: 'BioLink',
                params: { forceError: true },
            },
            {
                label: '1.5a · err · Email inválido',
                hint: 'RecuperarPassword → escribe algo sin "@" y pulsa enviar',
                route: 'RecuperarPassword',
            },
            {
                label: '1.x · err · Sin conexión',
                hint: 'Login → email que contenga "offline"',
                route: 'Login',
            },
        ],
    },
];

export default function DevMenuScreen({ navigation }) {
    return (
        <SafeAreaView style={s.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
            <ScrollView contentContainerStyle={s.scroll}>
                <View style={s.header}>
                    <Text style={s.title}>OPOX · Dev Menu</Text>
                    <Text style={s.subtitle}>
                        Validación visual de mockups. Salta a cualquier pantalla o ejecuta el flujo completo.
                    </Text>
                </View>

                {SECTIONS.map((section) => (
                    <View key={section.title} style={s.section}>
                        <Text style={s.sectionTitle}>{section.title}</Text>
                        {section.rows.map((row) => (
                            <TouchableOpacity
                                key={row.label}
                                style={[s.row, row.highlight && s.rowHighlight]}
                                onPress={() => navigation.navigate(row.route, row.params)}
                                activeOpacity={0.7}
                            >
                                <View style={s.rowMain}>
                                    <Text style={[s.rowLabel, row.highlight && s.rowLabelHighlight]}>
                                        {row.label}
                                    </Text>
                                    {row.hint && <Text style={s.rowHint}>{row.hint}</Text>}
                                </View>
                                <Ionicons
                                    name="chevron-forward"
                                    size={18}
                                    color={row.highlight ? colors.white : colors.grayText}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}

                <Text style={s.footer}>
                    Este menú solo aparece en desarrollo. Se quitará al pasar a producción.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
    scroll: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        marginTop: 8,
        marginBottom: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: '900',
        color: colors.dark,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 14,
        color: colors.grayText,
        marginTop: 6,
        lineHeight: 20,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: colors.grayText,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
        marginLeft: 4,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.grayLight,
        borderWidth: 1,
        borderColor: colors.grayMid,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        marginBottom: 8,
    },
    rowHighlight: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    rowMain: {
        flex: 1,
        marginRight: 8,
    },
    rowLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.dark,
    },
    rowLabelHighlight: {
        color: colors.white,
    },
    rowHint: {
        fontSize: 12,
        color: colors.grayText,
        marginTop: 4,
        lineHeight: 16,
    },
    footer: {
        fontSize: 12,
        color: colors.grayText,
        textAlign: 'center',
        marginTop: 12,
        fontStyle: 'italic',
    },
});
