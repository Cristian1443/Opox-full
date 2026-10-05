import React from 'react';
import AppHeader, { HeaderSettingsButton } from './AppHeader';

// Cabecera de Bloque 6 · Entrenamiento — delega en el header estándar de la app
// (mismo botón volver, engranaje de 22 y título) para que sea coherente con el
// resto de pantallas. `eyebrow` = línea superior de sección (p.ej. "Zona de
// entrenamiento") sobre el título de la pantalla actual.
export default function TrainingHeader({ eyebrow, title, onBack, onSettings }) {
    return (
        <AppHeader
            eyebrow={eyebrow}
            title={title}
            onBack={onBack}
            right={onSettings ? <HeaderSettingsButton onPress={onSettings} /> : null}
        />
    );
}
