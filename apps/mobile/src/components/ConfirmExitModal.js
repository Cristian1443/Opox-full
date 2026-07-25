import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import AlertCardModal from './AlertCardModal';

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
            iconBg="#F1F3F7"
            icon={
                <Svg width={30} height={30} viewBox="0 0 24 24" fill="none">
                    <Circle cx={12} cy={12} r={10} stroke="#B4BAC5" strokeWidth={1.7} />
                    <Path d="M12 7v6M12 16v.3" stroke="#B4BAC5" strokeWidth={2} strokeLinecap="round" />
                </Svg>
            }
            title={title}
            description={description}
            primaryLabel={stayLabel}
            secondaryLabel={leaveLabel}
            onPrimaryPress={onStay}
            onSecondaryPress={onLeave}
        />
    );
}

