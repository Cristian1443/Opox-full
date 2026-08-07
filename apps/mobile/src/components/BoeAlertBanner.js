import React, { useEffect, useRef, useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Dimensions,
    Animated,
    Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';

const { width } = Dimensions.get('window');

/**
 * Banner de alerta BOE estilo notificación push del SO (lock-screen).
 *
 * Aparece cuando la app está en foreground y llega una notificación BOE.
 * En background, el SO muestra la push nativa (expo-notifications, Paso 2).
 *
 * Props:
 *   visible     — muestra / oculta el banner
 *   title       — título de la alerta (default: "¡Alerta BOE!")
 *   body        — cuerpo del mensaje
 *   onPress     — tap en la tarjeta → navegar al detalle BOE
 *   onDismiss   — tap fuera o swipe → cerrar sin navegar
 */
export default function BoeAlertBanner({
    visible,
    title = '¡Alerta BOE!',
    body = 'El art. 14 de tu temario ha sido modificado. Toca para ver el cambio y hacer un mini-test.',
    onPress,
    onDismiss,
}) {
    const translateY = useRef(new Animated.Value(-120)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    // Estado interno: el Modal permanece montado durante la animación de salida
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        if (visible) {
            setModalVisible(true);
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0,
                    tension: 70,
                    friction: 10,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            // Animar salida primero; solo entonces ocultar el Modal
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: -120,
                    duration: 220,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 180,
                    useNativeDriver: true,
                }),
            ]).start(({ finished }) => {
                if (finished) setModalVisible(false);
            });
        }
    }, [visible]);

    return (
        <Modal
            transparent
            visible={modalVisible}
            animationType="none"
            statusBarTranslucent
            onRequestClose={onDismiss}
        >
            {/* Overlay: tap fuera cierra el banner */}
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onDismiss}
            >
                <Animated.View
                    style={[
                        styles.cardWrapper,
                        { transform: [{ translateY }], opacity },
                    ]}
                >
                    {/* La tarjeta no propaga el tap al overlay */}
                    <TouchableOpacity
                        style={styles.card}
                        activeOpacity={0.88}
                        onPress={onPress}
                        accessibilityLabel={`Alerta BOE: ${title}. Tocar para ver el detalle.`}
                    >
                        {/* Icono de la app */}
                        <View style={styles.appIcon}>
                            <MaterialCommunityIcons
                                name="scale-balance"
                                size={24}
                                color={colors.white}
                            />
                        </View>

                        {/* Texto */}
                        <View style={styles.textBlock}>
                            <View style={styles.metaRow}>
                                <Text style={styles.appName}>OPOX</Text>
                                <Text style={styles.timestamp}>ahora</Text>
                            </View>
                            <Text style={styles.alertTitle}>{title}</Text>
                            <Text style={styles.alertBody} numberOfLines={3}>
                                {body.replace(/\. Toca.*$/, '.')}
                                {body.includes('Toca') && (
                                    <Text style={styles.bodyHighlight}>
                                        {' Toca para ver el cambio y hacer un mini-test.'}
                                    </Text>
                                )}
                            </Text>
                        </View>

                        {/* Punto verde "nueva notificación" */}
                        <View style={styles.newDot} />
                    </TouchableOpacity>
                </Animated.View>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 56, // debajo de la status bar del SO
    },
    cardWrapper: {
        width: width * 0.9,
        maxWidth: 400,
    },
    card: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: spacing.md,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },

    // ── App icon ──────────────────────────────────────────────────
    appIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#E2483D', // acento BOE
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },

    // ── Texto ─────────────────────────────────────────────────────
    textBlock: {
        flex: 1,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 3,
    },
    appName: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.text,
        letterSpacing: 0.3,
    },
    timestamp: {
        fontSize: 11,
        color: colors.textSecondary,
    },
    alertTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#E2483D', // rojo para urgencia
        marginBottom: 3,
    },
    alertBody: {
        fontSize: 13,
        color: colors.textSecondary,
        lineHeight: 19,
    },
    bodyHighlight: {
        color: colors.text,
        fontWeight: '600',
    },

    // ── Punto verde "nuevo" ───────────────────────────────────────
    newDot: {
        width: 9,
        height: 9,
        borderRadius: 5,
        backgroundColor: colors.success,
        marginTop: 4,
        flexShrink: 0,
    },
});
