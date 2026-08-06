import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import AlertCardModal from './AlertCardModal';

// ─── Pop-up de error de captura (6.3 · err) ──────────────────────────────────
// Dos variantes centradas según mockups "ERROR FOTO BORROSA" y
// "ERROR TEXTO NO DETECTADO":
//  - blur: icono de cámara gris, un solo CTA "Repetir foto".
//  - no-text: icono de escaneo gris, CTA "Reintentar" + link "Cancelar".

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
            iconSize={isBlur ? 74 : 84}
            icon={
                isBlur
                    ? <Ionicons name="camera-outline" size={34} color="#B9B9B9" />
                    : <Ionicons name="scan-outline" size={38} color="#B9B9B9" />
            }
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
