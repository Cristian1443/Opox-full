import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AlertCardModal from './AlertCardModal';

// ─── 9.2 · err · Formato no soportado ────────────────────────────────────────
// Se lanza cuando el usuario intenta subir un archivo que no es JPG/PNG/PDF
// (por ejemplo docx, mp4, zip, etc.) desde cualquiera de las 3 fuentes de 9.2.
// Reutiliza AlertCardModal con CTA rojo (primaryColor prop).

const ERROR_COLOR = '#DC2626';
const ERROR_BG = '#FEE2E2';

function ErrorIcon() {
    return (
        <View style={styles.iconInner}>
            <Ionicons name="close" size={32} color={ERROR_COLOR} />
        </View>
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
            iconBg={ERROR_BG}
            icon={<ErrorIcon />}
            title="Formato no soportado"
            description={
                'Solo admitimos imágenes (JPG, PNG) y PDF. Ese archivo no podemos procesarlo.'
            }
            primaryLabel="Elegir otro"
            primaryColor={ERROR_COLOR}
            onPrimaryPress={onRetry}
            secondaryLabel="Cancelar"
            onSecondaryPress={onCancel}
        />
    );
}

const styles = StyleSheet.create({
    // Círculo interior 40x40 con borde para que el X quede como icono "prohibido".
    // AlertCardModal ya provee el círculo exterior de 60x60 con iconBg.
    iconInner: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2.5,
        borderColor: ERROR_COLOR,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
