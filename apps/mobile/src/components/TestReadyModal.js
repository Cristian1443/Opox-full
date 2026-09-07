import React from 'react';
import { Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import AlertCardModal from './AlertCardModal';
import { colors } from '../theme';

// Check verde exacto (mismo trazo que ConnectionSuccessModal) — el original
// usaba un checkmark gris de Ionicons, pero Figma muestra un check verde
// grueso sin chip de fondo.
function IconCheckGreen({ width = 60, height = 40, color = colors.ctaGreen }) {
    return (
        <Svg width={width} height={height} viewBox="0 0 107 70">
            <Path d="M8 34L40 62L99 8" stroke={color} strokeWidth={14} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

// ─── Estado "Test generado" (6.5 · ok) ───────────────────────────────────────
// Modal de éxito centrado que celebra que la IA ha terminado de generar el
// test. Reutilizable en cualquier flujo del Bloque 6 donde queramos anunciar
// que el mazo/test está listo (Generador Infinito, Foto-Test, Laboratorio…).
//
// - onStart: acción primaria, ir al test (Bloque 7).
// - onDismiss: se llama al pulsar fuera o hardware-back. Permite al usuario
//   ver el contenido subyacente (flashcard, guardar mazo, etc.) sin abandonar.
export default function TestReadyModal({
    visible,
    onStart,
    onDismiss,
    questionCount = 10,
    title = '¡Test listo!',
    ctaLabel = 'Empezar test',
}) {
    return (
        <AlertCardModal
            visible={visible}
            iconBg="transparent"
            icon={<IconCheckGreen />}
            title={title}
            description={
                <Text style={{ fontFamily: 'Poppins-Light', fontSize: 14, lineHeight: 19, color: '#412950', textAlign: 'center', marginBottom: 20 }}>
                    Hemos creado <Text style={{ fontFamily: 'Poppins-SemiBold' }}>{questionCount} preguntas</Text> a partir de tu apunte.
                </Text>
            }
            primaryLabel={ctaLabel}
            onPrimaryPress={onStart}
            onSecondaryPress={onDismiss}
        />
    );
}
