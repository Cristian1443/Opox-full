import React from 'react';
import { Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AlertCardModal from './AlertCardModal';

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
            icon={<Ionicons name="checkmark" size={40} color="#B9B9B9" />}
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
