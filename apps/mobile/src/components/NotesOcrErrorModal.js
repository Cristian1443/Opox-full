import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { colors } from '../theme';
import AlertCardModal from './AlertCardModal';

// ─── 9.3 · err · No se pudo leer ─────────────────────────────────────────────
// Advertencia (no error crítico) durante el análisis IA cuando el OCR devuelve
// baja confianza en algunas páginas o no encuentra texto reconocible.
//
// Dos rutas para el usuario:
//   · Revisar páginas  → NoteDetail con las páginas problemáticas destacadas.
//   · Volver a subir   → cerrar y devolver a NotesUpload (9.2).

const MUTED_ICON = '#E8E8E8';

// Ícono confirmado en Figma: "Abc" tachado, representando contenido no
// legible — gris neutro, sin círculo de fondo.
function UnreadableIcon({ size = 42, color = MUTED_ICON }) {
    return (
        <View style={{ width: size * 1.5, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: 'Poppins-SemiBold', fontSize: size * 0.6, color }}>Abc</Text>
            <Svg width={size * 1.5} height={size} style={StyleSheet.absoluteFill} viewBox={`0 0 ${size * 1.5} ${size}`}>
                <Line x1={size * 0.15} y1={size * 0.55} x2={size * 1.35} y2={size * 0.55} stroke={color} strokeWidth={2} />
            </Svg>
        </View>
    );
}

export default function NotesOcrErrorModal({
    visible,
    onReview,
    onReupload,
}) {
    return (
        <AlertCardModal
            visible={visible}
            iconBg="transparent"
            icon={<UnreadableIcon />}
            title="No se pudo leer"
            description="Algunas páginas están borrosas. Revisa el resultado o vuelve a subirlas con más luz."
            primaryLabel="Revisar páginas"
            primaryColor={colors.ctaGreen}
            onPrimaryPress={onReview}
            secondaryLabel="Volver a subir"
            onSecondaryPress={onReupload}
        />
    );
}
