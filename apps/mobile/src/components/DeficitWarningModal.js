// Modal que se muestra al usuario cuando se entregaron menos preguntas
// de las pedidas (G08 · INFORME_GENERADOR_INFINITO.md). A veces se pierden
// preguntas por descartes internos del generador y sin este aviso el
// usuario empieza un test de 3 preguntas creyendo que pidió 10.
// Copy sin jerga técnica (2026-09-24): nunca mostrar códigos internos
// (hecho_ya_preguntado, tope_minado, etc.) ni mencionar "el Motor" — el
// usuario final no sabe qué es eso ni le interesa.
//
// Diseño:
//   - Backdrop no clickable (usuario debe reconocer y elegir)
//   - CTA verde: "Empezar con las N que hay"
//   - Link secundario: "Volver al generador" (cancela y vuelve)
//   - Tono informativo, no alarmista — no es culpa del usuario.
import React from 'react';
import { View, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import Text from './AppText';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';

function reasonLabel(reason) {
    switch (reason) {
        case 'tope_minado':
            return 'Se agotaron los ejercicios disponibles para tu selección de temas.';
        default:
            return null;
    }
}

export default function DeficitWarningModal({ visible, deficit, onProceed, onCancel }) {
    if (!deficit) return null;
    const { requested, delivered, reason } = deficit;

    const reasonLine = reasonLabel(reason);

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            statusBarTranslucent
            onRequestClose={() => {}}
        >
            <View style={styles.backdrop}>
                <View style={styles.card}>
                    <View style={styles.iconWrap}>
                        <Ionicons name="information-circle" size={44} color={colors.accentOrange} />
                    </View>

                    <Text style={styles.title}>
                        Solo pudimos preparar {delivered} de {requested} preguntas
                    </Text>

                    <Text style={styles.body}>
                        {reasonLine ??
                            'No pudimos generar todas las preguntas que pediste con la selección actual.'}
                    </Text>

                    <TouchableOpacity
                        style={styles.primaryBtn}
                        onPress={onProceed}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.primaryBtnText}>
                            Empezar con las {delivered} disponibles
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryBtn}
                        onPress={onCancel}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.secondaryBtnText}>
                            Volver al generador y probar con más temas
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg,
    },
    card: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: spacing.lg,
        paddingTop: spacing.xl,
        alignItems: 'center',
    },
    iconWrap: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(246,150,36,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    title: {
        fontSize: 18,
        fontFamily: 'Poppins-SemiBold',
        color: colors.textDark,
        textAlign: 'center',
        marginBottom: spacing.sm,
        letterSpacing: -0.3,
    },
    body: {
        fontSize: 13.5,
        fontFamily: 'Poppins-Regular',
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: spacing.lg,
        paddingHorizontal: spacing.sm,
    },
    primaryBtn: {
        alignSelf: 'stretch',
        backgroundColor: colors.ctaGreen,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    primaryBtnText: {
        color: colors.white,
        fontSize: 15,
        fontFamily: 'Poppins-SemiBold',
    },
    secondaryBtn: {
        alignSelf: 'stretch',
        paddingVertical: 12,
        alignItems: 'center',
    },
    secondaryBtnText: {
        color: colors.textSecondary,
        fontSize: 13,
        fontFamily: 'Poppins-Medium',
        textAlign: 'center',
    },
});
