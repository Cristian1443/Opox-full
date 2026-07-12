import React from 'react';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import NudgeModal from './NudgeModal';

// ─── Pop-up de error de captura (6.3 · err) ──────────────────────────────────
// Dos variantes con el mismo layout: la foto es ilegible o no contiene texto.
// Envuelve NudgeModal para heredar el bottom-sheet estándar del app.

const VARIANTS = {
    blur: {
        title: 'Imagen poco nítida',
        description: 'No leemos bien el texto. Acerca la cámara y evita sombras.',
        retryLabel: 'Repetir foto',
        Icon: IconBlur,
    },
    'no-text': {
        title: 'No hemos encontrado texto',
        description: 'Asegúrate de fotografiar un apunte o pregunta con texto legible.',
        retryLabel: 'Reintentar',
        Icon: IconNoText,
    },
};

function IconBlur({ color = '#E2483D' }) {
    return (
        <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
            <Circle cx={7} cy={12} r={3} stroke={color} strokeWidth={1.7} strokeDasharray="2 2" />
            <Circle cx={17} cy={12} r={3} stroke={color} strokeWidth={1.7} strokeDasharray="2 2" />
            <Path d="M12 5v14" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeDasharray="2 2" />
        </Svg>
    );
}

function IconNoText({ color = '#E2483D' }) {
    return (
        <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
            <Rect x={4} y={4} width={16} height={16} rx={2} stroke={color} strokeWidth={1.7} />
            <Path d="M5 5l14 14" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
        </Svg>
    );
}

export default function PhotoErrorModal({
    visible,
    variant = 'blur',
    onRetry,
    onCancel,
    retryLabel,
    cancelLabel = 'Cancelar',
}) {
    const config = VARIANTS[variant] ?? VARIANTS.blur;
    const Icon = config.Icon;

    return (
        <NudgeModal
            visible={visible}
            iconBg="#FDEBE9"
            icon={<Icon />}
            title={config.title}
            description={config.description}
            primaryLabel={retryLabel ?? config.retryLabel}
            secondaryLabel={cancelLabel}
            onPrimaryPress={onRetry}
            onSecondaryPress={onCancel}
        />
    );
}
