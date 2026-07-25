import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
import AlertCardModal from './AlertCardModal';

// ─── Pop-up de error de captura (6.3 · err) ──────────────────────────────────
// Dos variantes centradas según mockups "ERROR FOTO BORROSA" y
// "ERROR TEXTO NO DETECTADO":
//  - blur: icono cámara tachada gris, un solo CTA "Repetir foto".
//  - no-text: texto "Abc" tachado gris, CTA "Reintentar" + link "Cancelar".

function IconCameraOff({ color = '#B4BAC5' }) {
    return (
        <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
            <Path d="M4 8h3l2-3h6l2 3h3v11H4z" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
            <Circle cx={12} cy={13} r={3.5} stroke={color} strokeWidth={1.6} />
            <Path d="M4 4l16 16" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
    );
}

function IconAbcOff({ color = '#B4BAC5' }) {
    return (
        <Svg width={54} height={30} viewBox="0 0 54 30" fill="none">
            <Path d="M4 22 L10 4 L16 22 M6 16 H14" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M22 4 h5 a4 4 0 0 1 0 8 h-5 z M22 12 h6 a4 4 0 0 1 0 10 h-6 z" stroke={color} strokeWidth={2} strokeLinejoin="round" />
            <Path d="M46 8 a6 6 0 1 0 0 10" stroke={color} strokeWidth={2} strokeLinecap="round" />
            <Path d="M2 4 L52 28" stroke={color} strokeWidth={2} strokeLinecap="round" />
        </Svg>
    );
}

export default function PhotoErrorModal({
    visible,
    variant = 'blur',
    onRetry,
    onCancel,
}) {
    const isBlur = variant === 'blur';
    return (
        <AlertCardModal
            visible={visible}
            iconBg="transparent"
            icon={isBlur ? <IconCameraOff /> : <IconAbcOff />}
            title={isBlur ? 'Imagen poco nítida' : 'Texto no encontrado'}
            description={
                isBlur
                    ? 'No leemos bien el texto. Acerca la cámara y evita sombras.'
                    : 'Asegúrate de fotografiar un apunte o pregunta con texto legible.'
            }
            primaryLabel={isBlur ? 'Repetir foto' : 'Reintentar'}
            secondaryLabel={isBlur ? null : 'Cancelar'}
            onPrimaryPress={onRetry}
            onSecondaryPress={onCancel}
        />
    );
}
