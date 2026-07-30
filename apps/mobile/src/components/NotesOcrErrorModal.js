import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AlertCardModal from './AlertCardModal';

// ─── 9.3 · err · No hemos podido leer bien ───────────────────────────────────
// Advertencia (no error crítico) durante el análisis IA cuando el OCR devuelve
// baja confianza en algunas páginas o no encuentra texto reconocible.
//
// Dos rutas para el usuario:
//   · Revisar páginas  → NoteDetail con las páginas problemáticas destacadas.
//   · Volver a subir   → cerrar y devolver a NotesUpload (9.2).

const WARNING_COLOR = '#F59E0B';
const WARNING_BG = '#FFFBEB';
const WARNING_BORDER = '#FCD34D';

function WarningIcon() {
    return (
        <View style={styles.iconInner}>
            <Ionicons name="warning" size={30} color={WARNING_COLOR} />
        </View>
    );
}

function HintBox() {
    return (
        <View style={styles.hint}>
            <Text style={styles.hintText}>
                💡 <Text style={styles.hintStrong}>Consejo:</Text> revisa el resultado o vuelve a
                subirlas con más luz y sin sombras.
            </Text>
        </View>
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
            iconBg={WARNING_BG}
            icon={<WarningIcon />}
            title="No hemos podido leer bien"
            description={
                'Algunas páginas están borrosas o con mala iluminación. El sistema no pudo extraer el texto correctamente.'
            }
            extraContent={<HintBox />}
            primaryLabel="Revisar páginas"
            primaryColor={WARNING_COLOR}
            onPrimaryPress={onReview}
            secondaryLabel="Volver a subir"
            onSecondaryPress={onReupload}
        />
    );
}

const styles = StyleSheet.create({
    // Círculo del icono con borde ámbar tenue — refuerza el look de warning.
    iconInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: WARNING_BORDER,
        backgroundColor: WARNING_BG,
        alignItems: 'center',
        justifyContent: 'center',
    },
    hint: {
        backgroundColor: '#F3F4F6',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    hintText: {
        fontSize: 13,
        color: '#1F2937',
        lineHeight: 19,
        textAlign: 'center',
    },
    hintStrong: {
        fontWeight: '700',
    },
});
