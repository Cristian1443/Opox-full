import React from 'react';
import AppHeader from './AppHeader';

/** Alias histórico de AppHeader (mismo contrato: title, subtitle, onBack, right). */
export default function ScreenHeader(props) {
    return <AppHeader {...props} />;
}
