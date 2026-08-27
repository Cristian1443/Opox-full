import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../theme';
import AlertCardModal from './AlertCardModal';

// ─── 9.2 · err · Formato no soportado ────────────────────────────────────────
// Se lanza cuando el usuario intenta subir un archivo que no es JPG/PNG/PDF
// (por ejemplo docx, mp4, zip, etc.) desde cualquiera de las 3 fuentes de 9.2.

const MUTED_ICON = '#E8E8E8';

// Ícono confirmado en Figma: círculo + exclamación, en gris neutro (no rojo
// como el resto de la app suele usar para errores) — sin círculo de fondo.
function UnsupportedFormatIcon({ size = 42, color = MUTED_ICON }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 42 42">
            <Circle cx={21} cy={21} r={19} stroke={color} strokeWidth={2.4} fill="none" />
            <Path d="M21 12V24" stroke={color} strokeWidth={2.6} strokeLinecap="round" />
            <Circle cx={21} cy={30} r={1.6} fill={color} />
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
