import React from 'react';
import Svg, { Path } from 'react-native-svg';
import NudgeModal from './NudgeModal';

// ─── Pop-up "Salir sin guardar" (6.2 · alerta) ───────────────────────────────
// Reutilizable en cualquier pantalla de configuración del Bloque 6 (Generador,
// Foto-Test, Simulacros, Laboratorio). Envuelve NudgeModal con la copia y el
// ícono correctos, y expone una API limpia: onStay / onLeave.
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
        <NudgeModal
            visible={visible}
            iconBg="#FFF4E5"
            icon={
                <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
                    <Path d="M12 3l9 16H3z" stroke="#E89B2C" strokeWidth={1.7} strokeLinejoin="round" />
                    <Path d="M12 9v4M12 16v.3" stroke="#E89B2C" strokeWidth={1.9} strokeLinecap="round" />
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
