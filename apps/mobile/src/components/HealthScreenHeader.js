// Header del bloque 3 · Salud — delega en el header estándar de la app para que
// el botón volver, el título y la separación con el contenido sean idénticos al
// resto de pantallas. Conserva su contrato (title, subtitle, onBack, right, variant).
import React from 'react';
import AppHeader from './AppHeader';

export default function HealthScreenHeader(props) {
    return <AppHeader {...props} />;
}
