import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';

// ─── Nudge flotante genérico (wireframe 2.4 a/b/c) ───────────────────────────
// Bottom-sheet que puede aparecer sobre cualquier pantalla. El contenido
// (icono, textos, acciones) lo define quien lo invoca.
export default function NudgeModal({
    visible,
    iconBg,
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

                    <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
                        {icon}
                    </View>

                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.description}>{description}</Text>

                    <View style={styles.actions}>
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
            </View>
        </Modal>
    );
}

// ─── Estilos (overlay-bg + .nudge del wireframe) ─────────────────────────────
const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 27, 51, 0.5)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        width: '100%',
        paddingTop: 20,
        paddingHorizontal: 18,
        paddingBottom: 22,
        shadowColor: '#0F1B33',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.2,
        shadowRadius: 30,
        elevation: 20,
    },
    grip: {
        width: 38,
        height: 4,
        borderRadius: 3,
        backgroundColor: '#E4E8F0',
        alignSelf: 'center',
        marginBottom: 16,
    },
    iconBox: {
        width: 54,
        height: 54,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 13,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F1B33',
        marginBottom: 7,
    },
    description: {
        fontSize: 12,
        color: '#5A6373',
        marginBottom: 16,
        lineHeight: 18,
    },
    actions: {
        flexDirection: 'column',
        gap: 8,
    },
    btnPrimary: {
        backgroundColor: '#34C759',
        borderRadius: 12,
        paddingVertical: 13,
        alignItems: 'center',
        width: '100%',
    },
    btnPrimaryText: {
        color: '#FFFFFF',
        fontSize: 13.5,
        fontWeight: '700',
    },
    btnGhost: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#D4DAE6',
        borderRadius: 12,
        paddingVertical: 13,
        alignItems: 'center',
        width: '100%',
    },
    btnGhostText: {
        color: '#1B2A4A',
        fontSize: 13.5,
        fontWeight: '700',
    },
});
