import React from 'react';
import Svg, { Path } from 'react-native-svg';
import AlertCardModal from './AlertCardModal';

// Icono exacto exportado de Figma (círculo + exclamación), gris — no lleva
// chip de fondo, el propio SVG ya incluye el círculo.
function IconAlertCircleGray({ size = 76, color = '#E8E8E8' }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 185 185" fill="none">
            <Path d="M92.4995 175C138.063 175 175 138.063 175 92.5C175 46.9365 138.063 10 92.4995 10C46.936 10 9.99951 46.9365 9.99951 92.5C9.99951 138.063 46.936 175 92.4995 175Z" stroke={color} strokeWidth={15.32} strokeMiterlimit={10} />
            <Path d="M75.9995 42L84.2495 115H100.75L109 42H75.9995Z" fill={color} />
            <Path d="M106 138.5C106 131.044 99.9554 125 92.4995 125C85.0437 125 78.9995 131.044 78.9995 138.5C78.9995 145.956 85.0437 152 92.4995 152C99.9554 152 106 145.956 106 138.5Z" fill={color} />
        </Svg>
    );
}

// ─── Pop-up "Salir sin generar el test" (mockup SALIR GENERAR TEST) ──────────
// Modal centrado con icono círculo ! gris + CTA verde "Seguir configurando".
// La acción secundaria "Salir igualmente" queda como link textual.
export default function ConfirmExitModal({
    visible,
    onStay,
    onLeave,
    title = '¿Salir sin generar el test?',
    description = 'Perderás la configuración que has elegido.',
    leaveLabel = 'Salir igualmente',
    stayLabel = 'Seguir configurando',
}) {
    return (
        <AlertCardModal
            visible={visible}
            iconBg="transparent"
            iconSize={76}
            icon={<IconAlertCircleGray size={76} />}
            title={title}
            description={description}
            primaryLabel={stayLabel}
            secondaryLabel={leaveLabel}
            onPrimaryPress={onStay}
            onSecondaryPress={onLeave}
        />
    );
}
