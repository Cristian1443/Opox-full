import React from 'react';
import { Ionicons } from '@expo/vector-icons';
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
            iconSize={76}
            icon={<Ionicons name="alert-circle-outline" size={34} color="#B9B9B9" />}
            title={title}
            description={description}
            primaryLabel={stayLabel}
            secondaryLabel={leaveLabel}
            onPrimaryPress={onStay}
            onSecondaryPress={onLeave}
        />
    );
}

