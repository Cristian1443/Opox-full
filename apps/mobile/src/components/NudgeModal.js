import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { colors } from '../theme';

// Tokens confirmados contra Figma (frames NUDGE FATIGA / TEMA FLOJO / ALERTA
// BOE, Bloque 2) sin equivalente exacto en theme.js.
const FIGMA = {
    overlay: 'rgba(0, 0, 0, 0.45)',
    handle: '#D9D9D9',
};

// ─── Nudge flotante genérico (wireframe 2.4 a/b/c) ───────────────────────────
// Bottom-sheet que puede aparecer sobre cualquier pantalla. El contenido
// (icono, textos, acciones) lo define quien lo invoca. `iconBg` ya no se usa
// visualmente (Figma no lleva chip de color detrás del icono) — se mantiene
// en la firma solo por compatibilidad con quien ya lo pasa.
export default function NudgeModal({
    visible,
    iconBg: _iconBg,
    icon,
    title,
    description,
    primaryLabel,
    onPrimaryPress,
    secondaryLabel,
    onSecondaryPress,
}) {
    return (
        <Modal
            transparent
            visible={visible}
            animationType="slide"
            statusBarTranslucent
            onRequestClose={onSecondaryPress}
        >
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    <View style={styles.grip} />

                    <View style={styles.iconRow}>
                        {icon}
                    </View>

                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.description}>{description}</Text>

                    <TouchableOpacity
                        style={styles.btnPrimary}
                        onPress={onPrimaryPress}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.btnPrimaryText}>{primaryLabel}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.btnGhost}
                        onPress={onSecondaryPress}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.btnGhostText}>{secondaryLabel}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

// ─── Estilos (bottom-sheet, tokens confirmados de Figma) ─────────────────────
const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: FIGMA.overlay,
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: colors.white,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        width: '100%',
        paddingTop: 12,
        paddingHorizontal: 24,
        paddingBottom: 32,
        alignItems: 'center',
    },
    grip: {
        width: 64,
        height: 4,
        borderRadius: 2,
        backgroundColor: FIGMA.handle,
        marginBottom: 20,
    },
    iconRow: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: -8,
        marginBottom: 8,
    },
    title: {
        width: '100%',
        fontFamily: 'Poppins-SemiBold',
        fontSize: 22,
        color: colors.textDark,
        textAlign: 'left',
    },
    description: {
        width: '100%',
        marginTop: 12,
        fontFamily: 'Poppins-Light',
        fontSize: 16,
        lineHeight: 22,
        color: colors.textDark,
        textAlign: 'left',
    },
    btnPrimary: {
        width: '100%',
        height: 61,
        borderRadius: 14,
        backgroundColor: colors.accentOrange,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
    },
    btnPrimaryText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: colors.white,
    },
    btnGhost: {
        width: '100%',
        height: 61,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.purple,
        backgroundColor: colors.white,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
    },
    btnGhostText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 16,
        color: colors.purple,
    },
});
