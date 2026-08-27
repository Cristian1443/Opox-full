import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../theme';
import AlertCardModal from './AlertCardModal';

// ─── 9.3 · ok · Apuntes digitalizados ────────────────────────────────────────
// Se muestra al completar el análisis IA de un apunte. Da al usuario dos rutas:
//   · Hacer test ahora → generar test con las preguntas recién creadas.
//   · Ver documento    → abrir NoteDetail para inspeccionar el apunte digitalizado.

// Ícono confirmado en Figma: círculo + check verde, sin círculo de fondo
// adicional detrás (a diferencia del resto de la app).
function SuccessCheckIcon({ size = 48, color = colors.ctaGreen }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 48 48">
            <Circle cx={24} cy={24} r={22} stroke={color} strokeWidth={3} fill="none" />
            <Path d="M14 24.5L20.5 31L34 16.5" stroke={color} strokeWidth={3.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

export default function NotesDigitizedModal({
    visible,
    questionsCount = 0,
    pagesCount = 0,
    onStartTest,
    onViewDocument,
}) {
    return (
        <AlertCardModal
            visible={visible}
            iconBg="transparent"
            icon={<SuccessCheckIcon />}
            title="Apuntes digitalizados"
            description={`Hemos creado ${questionsCount} preguntas a partir de tus ${pagesCount} ${pagesCount === 1 ? 'página' : 'páginas'}.`}
            primaryLabel="Hacer test ahora"
            primaryColor={colors.ctaGreen}
            onPrimaryPress={onStartTest}
            secondaryLabel="Ver documento"
            onSecondaryPress={onViewDocument}
        />
    );
}
