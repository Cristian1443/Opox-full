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
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

const { width } = Dimensions.get('window');

// ─── Fiel al Figma (PushAlertaBoeNotification.tsx) ────────────────────────────
// Mockup de una notificación push tal como aparecería en la pantalla de
// bloqueo del teléfono; este es su único uso real en la app (banner in-app
// cuando llega una alerta BOE con la app en foreground) — no es un componente
// compartido con otros bloques, así que se puede ajustar 1:1 al diseño.
const FIGMA = {
    subtitleMuted: 'rgba(52, 58, 61, 0.5)',
    bodyMuted: 'rgba(52, 58, 61, 0.7)',
};

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
 *   onDismiss   — tap fuera, swipe o botón cerrar → cerrar sin navegar
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
                        activeOpacity={0.9}
                        onPress={onPress}
                        accessibilityLabel={`Alerta BOE: ${title}. Tocar para ver el detalle.`}
                    >
                        <View style={styles.header}>
                            {/* Icono de la app — se mantiene la balanza (icono real
                                de OPOX para contenido legal) en vez del glifo
                                genérico de marcador de posición del mockup. */}
                            <View style={styles.appIcon}>
                                <MaterialCommunityIcons
                                    name="scale-balance"
                                    size={17}
                                    color={colors.white}
                                />
                            </View>
                            <Text style={styles.appName}>Opox.ai</Text>
                            <View style={styles.spacer} />
                            <Text style={styles.time}>ahora</Text>
                            <TouchableOpacity
                                onPress={onDismiss}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                accessibilityLabel="Cerrar notificación"
                            >
                                <Ionicons name="close" size={14} color={FIGMA.subtitleMuted} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.alertTitle}>{title}</Text>
                        <Text style={styles.alertBody} numberOfLines={3}>{body}</Text>
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
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderRadius: 16,
        padding: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
        elevation: 10,
    },

    // ── Encabezado: ícono + nombre app + hora + cerrar ─────────────
    header: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    appIcon: {
        width: 22,
        height: 22,
        borderRadius: 6,
        backgroundColor: colors.accentOrange,
        alignItems: 'center',
        justifyContent: 'center',
    },
    appName: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 13,
        color: colors.textDark,
        marginLeft: 8,
    },
    spacer: {
        flex: 1,
    },
    time: {
        fontFamily: 'Poppins-Regular',
        fontSize: 10,
        color: FIGMA.subtitleMuted,
        marginRight: 8,
    },

    // ── Texto ─────────────────────────────────────────────────────
    alertTitle: {
        fontFamily: 'Poppins-Bold',
        fontSize: 15,
        color: colors.textDark,
        marginTop: 8,
    },
    alertBody: {
        fontFamily: 'Poppins-Regular',
        fontSize: 12.5,
        color: FIGMA.bodyMuted,
        marginTop: 2,
        lineHeight: 17,
    },
});
