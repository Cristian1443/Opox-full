import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme';
import AlertCardModal from './AlertCardModal';

// ─── 9.2 · err · Formato no soportado ────────────────────────────────────────
// Se lanza cuando el usuario intenta subir un archivo que no es JPG/PNG/PDF
// (por ejemplo docx, mp4, zip, etc.) desde cualquiera de las 3 fuentes de 9.2.

const MUTED_ICON = '#E8E8E8';

// Icono exacto exportado de Figma (círculo + exclamación), gris — mismo
// path que IconAlertCircleGray de ConfirmExitModal.js.
function UnsupportedFormatIcon({ size = 76, color = MUTED_ICON }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 185 185" fill="none">
            <Path d="M92.4995 175C138.063 175 175 138.063 175 92.5C175 46.9365 138.063 10 92.4995 10C46.936 10 9.99951 46.9365 9.99951 92.5C9.99951 138.063 46.936 175 92.4995 175Z" stroke={color} strokeWidth={15.32} strokeMiterlimit={10} />
            <Path d="M75.9995 42L84.2495 115H100.75L109 42H75.9995Z" fill={color} />
            <Path d="M106 138.5C106 131.044 99.9554 125 92.4995 125C85.0437 125 78.9995 131.044 78.9995 138.5C78.9995 145.956 85.0437 152 92.4995 152C99.9554 152 106 145.956 106 138.5Z" fill={color} />
        </Svg>
    );
}

export default function NotesFormatErrorModal({
    visible,
    onRetry,
    onCancel,
}) {
    return (
        <AlertCardModal
            visible={visible}
            iconBg="transparent"
            icon={<UnsupportedFormatIcon />}
            title="Formato no soportado"
            description="Solo admitimos imágenes (JPG, PNG) y PDF. Ese archivo no podemos procesarlo."
            primaryLabel="Elegir otro"
            primaryColor={colors.ctaGreen}
            onPrimaryPress={onRetry}
            // Figma no muestra un botón/enlace "Cancelar" visible en este
            // modal (el único texto de salida queda oculto tras la tarjeta
            // en el archivo original). Se omite visualmente, pero se
            // conserva onSecondaryPress para que cerrar tocando fuera o con
            // el botón atrás siga cancelando en vez de reintentar.
            onSecondaryPress={onCancel}
        />
    );
}
