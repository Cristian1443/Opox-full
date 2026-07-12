import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

// ─── Estado "Test generado" (6.5 · ok) ───────────────────────────────────────
// Modal de éxito centrado que celebra que la IA ha terminado de generar el
// test. Reutilizable en cualquier flujo del Bloque 6 donde queramos anunciar
// que el mazo/test está listo (Generador Infinito, Foto-Test, Laboratorio…).
//
// - onStart: acción primaria, ir al test (Bloque 7).
// - onDismiss: se llama al pulsar fuera o hardware-back. Permite al usuario
//   ver el contenido subyacente (flashcard, guardar mazo, etc.) sin abandonar.

function IconCheckCircle({ color = '#1f9d6b' }) {
    return (
        <Svg width={44} height={44} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={12} r={10} fill={color} />
            <Path d="M7.5 12.5l3 3 6-7" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

export default function TestReadyModal({
    visible,
    onStart,
    onDismiss,
    questionCount = 10,
    title = '¡Test listo!',
    ctaLabel = 'Empezar test',
}) {
    const fade = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.85)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }),
                Animated.spring(scale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
            ]).start();
        } else {
            fade.setValue(0);
            scale.setValue(0.85);
        }
    }, [visible]);

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
                    <View style={styles.iconWrap}>
                        <IconCheckCircle />
                    </View>

                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>
                        Hemos creado <Text style={styles.highlight}>{questionCount} preguntas</Text> a partir de tu apunte.
                    </Text>

                    <TouchableOpacity style={styles.btn} onPress={onStart} activeOpacity={0.85}>
                        <Text style={styles.btnText}>{ctaLabel}</Text>
                    </TouchableOpacity>
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
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingHorizontal: 22,
        paddingTop: 24,
        paddingBottom: 20,
        alignItems: 'center',
        shadowColor: '#0F1B33',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 16,
    },
    iconWrap: {
        width: 66,
        height: 66,
        borderRadius: 33,
        backgroundColor: '#EAF7F1',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F1B33',
        marginBottom: 6,
        textAlign: 'center',
    },
    message: {
        fontSize: 13,
        color: '#5A6373',
        textAlign: 'center',
        lineHeight: 19,
        marginBottom: 20,
    },
    highlight: { color: '#1f9d6b', fontWeight: '800' },
    btn: {
        backgroundColor: '#FF6B4A',
        borderRadius: 12,
        paddingVertical: 13,
        alignItems: 'center',
        width: '100%',
    },
    btnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
