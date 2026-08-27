import React from 'react';
import Svg, { Path } from 'react-native-svg';
import AlertCardModal from './AlertCardModal';

// ─── 9.4 · alerta · Eliminar documento ───────────────────────────────────────
// Confirmación destructiva antes de borrar un apunte. Se dispara desde el
// menú "⋮" de NoteDetailScreen.

const DANGER_COLOR = '#FF2638';

// Ícono de papelera confirmado en Figma (color rojo destructivo, sin
// círculo de fondo detrás — a diferencia del resto de modales de la app).
function TrashIcon({ size = 42, color = DANGER_COLOR }) {
    return (
        <Svg width={size} height={(size * 94) / 90} viewBox="0 0 40 42">
            <Path d="M6 10H34" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
            <Path d="M15 10V5.5C15 4.7 15.7 4 16.5 4H23.5C24.3 4 25 4.7 25 5.5V10" stroke={color} strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M9 10L10.8 36.5C10.9 37.9 12 39 13.4 39H26.6C28 39 29.1 37.9 29.2 36.5L31 10" stroke={color} strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M17 17V32" stroke={color} strokeWidth={2} strokeLinecap="round" />
            <Path d="M23 17V32" stroke={color} strokeWidth={2} strokeLinecap="round" />
        </Svg>
    );
}

export default function NotesDeleteConfirmModal({
    visible,
    questionsCount = 0,
    onConfirm,
    onCancel,
}) {
    return (
        <AlertCardModal
            visible={visible}
            iconBg="transparent"
            icon={<TrashIcon />}
            title="¿Eliminar documento?"
            description={`Se borrarán también las ${questionsCount} ${questionsCount === 1 ? 'pregunta' : 'preguntas'} generadas a partir de él. No se puede deshacer.`}
            primaryLabel="Eliminar"
            primaryColor={DANGER_COLOR}
            onPrimaryPress={onConfirm}
            secondaryLabel="Cancelar"
            secondaryVariant="button"
            onSecondaryPress={onCancel}
        />
    );
}
