import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AlertCardModal from './AlertCardModal';

// ─── 9.4 · alerta · Eliminar documento ───────────────────────────────────────
// Confirmación destructiva antes de borrar un apunte. Se dispara desde el
// botón "Eliminar" del header de NoteDetailScreen.

const WARNING_COLOR = '#F59E0B';
const WARNING_BG = '#FFFBEB';
const WARNING_BORDER = '#FCD34D';
const ERROR_COLOR = '#DC2626';

function WarningIcon() {
    return (
        <View style={styles.iconInner}>
            <Ionicons name="warning" size={30} color={WARNING_COLOR} />
        </View>
    );
}

function DangerDescription({ questionsCount }) {
    return (
        <Text style={styles.description}>
            Se borrarán también las{' '}
            <Text style={styles.strong}>
                {questionsCount} {questionsCount === 1 ? 'pregunta' : 'preguntas'}
            </Text>
            {' '}generadas a partir de él.
            {'\n'}
            <Text style={styles.danger}>No se puede deshacer.</Text>
        </Text>
    );
}

export default function NotesDeleteConfirmModal({
    visible,
    questionsCount = 0,
    onConfirm,
    onCancel,
}) {
    return (
        <AlertCardModal
            visible={visible}
            iconBg={WARNING_BG}
            icon={<WarningIcon />}
            title="¿Eliminar este documento?"
            description={<DangerDescription questionsCount={questionsCount} />}
            primaryLabel="Eliminar"
            primaryColor={ERROR_COLOR}
            onPrimaryPress={onConfirm}
            secondaryLabel="Cancelar"
            onSecondaryPress={onCancel}
        />
    );
}

const styles = StyleSheet.create({
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
    description: {
        fontSize: 14,
        color: '#5A6373',
        textAlign: 'center',
        lineHeight: 21,
    },
    strong: {
        fontWeight: '700',
        color: '#1F2937',
    },
    danger: {
        color: ERROR_COLOR,
        fontWeight: '700',
    },
});
