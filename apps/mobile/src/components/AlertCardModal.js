import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated } from 'react-native';
import { colors } from '../theme';

// ─── Alert card centrada (bloque 6: ERROR FOTO BORROSA, SALIR GENERAR TEST) ──
// Modal tipo alert-card centrado sobre overlay oscuro con CTA verde y
// enlace secundario opcional debajo. Igual patrón visual que TestReadyModal.
export default function AlertCardModal({
    visible,
    iconBg = '#F1F3F7',
    icon,
    title,
    description,
    extraContent,
    primaryLabel,
    onPrimaryPress,
    primaryColor,
    secondaryLabel,
    onSecondaryPress,
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
                        <View style={[styles.iconBox, iconBg && { backgroundColor: iconBg }]}>
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
                        <TouchableOpacity
                            style={styles.btnLink}
                            onPress={onSecondaryPress}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.btnLinkText}>{secondaryLabel}</Text>
                        </TouchableOpacity>
                    ) : null}
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 27, 51, 0.55)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    card: {
        width: '100%',
        maxWidth: 320,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingHorizontal: 22,
        paddingTop: 24,
        paddingBottom: 18,
        alignItems: 'center',
        shadowColor: '#0F1B33',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 16,
    },
    iconBox: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    title: {
        fontSize: 19,
        fontFamily: 'Poppins-SemiBold',
        color: colors.textDark,
        marginBottom: 6,
        textAlign: 'center',
    },
    description: {
        fontSize: 13,
        fontFamily: 'Poppins-Light',
        color: colors.textDark,
        textAlign: 'center',
        lineHeight: 19,
        marginBottom: 18,
    },
    descriptionNode: {
        width: '100%',
        marginBottom: 18,
    },
    extraContent: {
        width: '100%',
        marginBottom: 14,
    },
    btnPrimary: {
        backgroundColor: colors.ctaGreen,
        borderRadius: 12,
        paddingVertical: 13,
        alignItems: 'center',
        width: '100%',
    },
    btnPrimaryText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'Poppins-SemiBold',
    },
    btnLink: {
        paddingVertical: 10,
        marginTop: 4,
    },
    btnLinkText: {
        color: colors.textDark,
        fontSize: 13,
        fontFamily: 'Poppins-Light',
    },
});
