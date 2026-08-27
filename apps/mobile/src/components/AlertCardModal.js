import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated } from 'react-native';
import { colors } from '../theme';

// ─── Alert card centrada (bloque 6: ERROR FOTO BORROSA, SALIR GENERAR TEST) ──
// Modal tipo alert-card centrado sobre overlay oscuro con CTA verde y
// enlace secundario opcional debajo. Igual patrón visual que TestReadyModal.
export default function AlertCardModal({
    visible,
    iconBg = '#E8E8E8',
    iconSize = 74,
    icon,
    title,
    description,
    extraContent,
    primaryLabel,
    onPrimaryPress,
    primaryColor,
    secondaryLabel,
    onSecondaryPress,
    // 'link' (por defecto, estilo existente) o 'button' (bordeado, usado por
    // NotesDeleteConfirmModal — Figma confirma un botón con trazo para
    // "Cancelar" en vez de un enlace de texto en esa alerta destructiva).
    secondaryVariant = 'link',
}) {
    const fade = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.88)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }),
                Animated.spring(scale, { toValue: 1, tension: 65, friction: 8, useNativeDriver: true }),
            ]).start();
        } else {
            fade.setValue(0);
            scale.setValue(0.88);
        }
    }, [visible]);

    const onDismiss = onSecondaryPress ?? onPrimaryPress;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onDismiss}
        >
            <Animated.View style={[styles.overlay, { opacity: fade }]}>
                <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    activeOpacity={1}
                    onPress={onDismiss}
                />
                <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
                    {icon ? (
                        <View
                            style={[
                                styles.iconBox,
                                {
                                    width: iconSize,
                                    height: iconSize,
                                    borderRadius: iconSize / 2,
                                    backgroundColor: iconBg,
                                },
                            ]}
                        >
                            {icon}
                        </View>
                    ) : null}

                    <Text style={styles.title}>{title}</Text>
                    {description ? (
                        // `description` puede ser string o un ReactNode (por ejemplo <Text> con partes coloreadas).
                        typeof description === 'string'
                            ? <Text style={styles.description}>{description}</Text>
                            : <View style={styles.descriptionNode}>{description}</View>
                    ) : null}

                    {extraContent ? (
                        <View style={styles.extraContent}>{extraContent}</View>
                    ) : null}

                    <TouchableOpacity
                        style={[
                            styles.btnPrimary,
                            primaryColor && { backgroundColor: primaryColor },
                        ]}
                        onPress={onPrimaryPress}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.btnPrimaryText}>{primaryLabel}</Text>
                    </TouchableOpacity>

                    {secondaryLabel ? (
                        secondaryVariant === 'button' ? (
                            <TouchableOpacity
                                style={styles.btnSecondary}
                                onPress={onSecondaryPress}
                                activeOpacity={0.75}
                            >
                                <Text style={styles.btnSecondaryText}>{secondaryLabel}</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={styles.btnLink}
                                onPress={onSecondaryPress}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.btnLinkText}>{secondaryLabel}</Text>
                            </TouchableOpacity>
                        )
                    ) : null}
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 25,
    },
    card: {
        width: '100%',
        maxWidth: 325,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(65, 41, 80, 0.3)',
        paddingVertical: 28,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    iconBox: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 18,
        fontFamily: 'Poppins-SemiBold',
        color: colors.textDark,
        textAlign: 'center',
        marginBottom: 10,
    },
    description: {
        fontSize: 14,
        fontFamily: 'Poppins-Light',
        color: colors.textDark,
        textAlign: 'center',
        lineHeight: 19,
        marginBottom: 20,
    },
    descriptionNode: {
        width: '100%',
        marginBottom: 20,
    },
    extraContent: {
        width: '100%',
        marginBottom: 14,
    },
    btnPrimary: {
        backgroundColor: colors.ctaGreen,
        borderRadius: 14,
        height: 57,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    btnPrimaryText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'Poppins-SemiBold',
    },
    btnLink: {
        paddingVertical: 6,
        marginTop: 14,
    },
    btnLinkText: {
        color: colors.textDark,
        fontSize: 14,
        fontFamily: 'Poppins-Light',
    },
    btnSecondary: {
        borderWidth: 1,
        borderColor: 'rgba(65, 41, 80, 0.3)',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        height: 57,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        marginTop: 10,
    },
    btnSecondaryText: {
        color: colors.textDark,
        fontSize: 16,
        fontFamily: 'Poppins-SemiBold',
    },
});
