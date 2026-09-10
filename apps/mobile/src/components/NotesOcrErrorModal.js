import React from 'react';
import Svg, { Path } from 'react-native-svg';
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

// Icono exacto exportado de Figma ("Abc" tachado) — mismo path que
// IconAbcCrossed de PhotoErrorModal.js.
function UnreadableIcon({ size = 84, color = MUTED_ICON }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 245 245" fill="none">
            <Path d="M72.5095 141.941H44.3295L39.6695 155.421H24.7695L50.2095 84.5605H66.7295L92.1795 155.421H77.1795L72.5095 141.941ZM68.7595 130.891L58.4195 101.001L48.0795 130.891H68.7595Z" fill={color} />
            <Path d="M122.84 100.88C126.245 99.1506 130.021 98.282 133.84 98.3497C138.419 98.2967 142.922 99.5264 146.84 101.9C150.803 104.34 154.007 107.838 156.09 112C158.432 116.704 159.598 121.906 159.49 127.16C159.591 132.442 158.425 137.671 156.09 142.41C154.018 146.62 150.829 150.18 146.87 152.7C142.975 155.135 138.463 156.402 133.87 156.35C130.055 156.435 126.278 155.583 122.87 153.87C119.882 152.345 117.296 150.139 115.32 147.43V155.43H101.1V80.4297H115.29V107.49C117.213 104.689 119.809 102.416 122.84 100.88ZM142.91 118.37C141.643 116.023 139.749 114.074 137.44 112.74C135.2 111.468 132.665 110.806 130.09 110.82C127.537 110.825 125.033 111.515 122.84 112.82C120.526 114.192 118.633 116.175 117.37 118.55C116.002 121.289 115.29 124.308 115.29 127.37C115.29 130.431 116.002 133.451 117.37 136.19C118.633 138.565 120.526 140.547 122.84 141.92C125.051 143.226 127.572 143.915 130.14 143.915C132.708 143.915 135.229 143.226 137.44 141.92C139.75 140.521 141.64 138.524 142.91 136.14C144.356 133.394 145.073 130.322 144.99 127.22C145.084 124.138 144.366 121.086 142.91 118.37Z" fill={color} />
            <Path d="M169.11 112.08C171.389 107.854 174.818 104.359 179 102C183.393 99.5477 188.359 98.3054 193.39 98.3995C200.35 98.3995 206.113 100.14 210.68 103.62C215.246 107.1 218.303 111.983 219.85 118.269H204.49C203.774 115.968 202.337 113.959 200.39 112.54C198.287 111.106 195.783 110.377 193.24 110.459C191.401 110.387 189.571 110.748 187.898 111.515C186.225 112.281 184.756 113.43 183.61 114.87C181.236 117.81 180.053 121.983 180.06 127.389C180.066 132.796 181.25 136.936 183.61 139.809C184.756 141.249 186.225 142.398 187.898 143.164C189.571 143.931 191.401 144.292 193.24 144.22C198.98 144.22 202.73 141.649 204.49 136.509H219.8C218.464 142.253 215.208 147.368 210.57 151.009C205.983 154.589 200.24 156.38 193.34 156.38C188.309 156.474 183.343 155.231 178.95 152.779C174.775 150.404 171.362 146.891 169.11 142.649C166.667 137.941 165.449 132.693 165.57 127.389C165.441 122.069 166.658 116.803 169.11 112.08Z" fill={color} />
            <Path d="M36 210.53L212.067 34.4629" stroke={color} strokeWidth={5.67} strokeMiterlimit={10} />
            <Path d="M36 34.4629L212.067 210.53" stroke={color} strokeWidth={5.67} strokeMiterlimit={10} />
        </Svg>
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
