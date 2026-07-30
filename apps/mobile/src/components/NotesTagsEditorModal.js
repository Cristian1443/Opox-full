import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';

// ─── 9.4 · Gestor de etiquetas ───────────────────────────────────────────────
// Modal que permite añadir/quitar etiquetas del apunte. Sale desde el chip
// "Editar" al final de la sección Etiquetas de NoteDetailScreen.

const NOTES_ACCENT = '#2563EB';
const NOTES_ACCENT_BG = '#EFF6FF';
const MAX_TAG_LEN = 30;
const MAX_TAGS = 12;

export default function NotesTagsEditorModal({
    visible,
    initialTags = [],
    onSave,
    onCancel,
}) {
    const [tags, setTags] = useState(initialTags);
    const [draft, setDraft] = useState('');

    // Re-sincronizamos si el usuario reabre el modal con etiquetas distintas.
    useEffect(() => {
        if (visible) {
            setTags(initialTags);
            setDraft('');
        }
    }, [visible, initialTags]);

    const addDraft = () => {
        const t = draft.trim();
        if (!t) return;
        if (t.length > MAX_TAG_LEN) return;
        if (tags.length >= MAX_TAGS) return;
        if (tags.some((x) => x.toLowerCase() === t.toLowerCase())) {
            setDraft('');
            return;
        }
        setTags((prev) => [...prev, t]);
        setDraft('');
    };

    const removeTag = (tag) => setTags((prev) => prev.filter((t) => t !== tag));

    const save = () => onSave(tags);

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onCancel}
        >
            <View style={styles.overlay}>
                <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    activeOpacity={1}
                    onPress={onCancel}
                />
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.cardWrap}
                >
                    <View style={styles.card}>
                        <View style={styles.head}>
                            <Text style={styles.title}>Etiquetas</Text>
                            <TouchableOpacity
                                onPress={onCancel}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                accessibilityLabel="Cerrar"
                            >
                                <Ionicons name="close" size={22} color={colors.dark} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            style={styles.tagsScroll}
                            contentContainerStyle={styles.tagsWrap}
                            keyboardShouldPersistTaps="handled"
                        >
                            {tags.length === 0 ? (
                                <Text style={styles.empty}>
                                    Añade la primera etiqueta.
                                </Text>
                            ) : (
                                tags.map((t) => (
                                    <View key={t} style={styles.tag}>
                                        <Text style={styles.tagText}>{t}</Text>
                                        <TouchableOpacity
                                            onPress={() => removeTag(t)}
                                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                                            accessibilityLabel={`Quitar etiqueta ${t}`}
                                        >
                                            <Ionicons name="close-circle" size={16} color={NOTES_ACCENT} />
                                        </TouchableOpacity>
                                    </View>
                                ))
                            )}
                        </ScrollView>

                        <View style={styles.inputRow}>
                            <TextInput
                                value={draft}
                                onChangeText={setDraft}
                                placeholder={
                                    tags.length >= MAX_TAGS
                                        ? `Máximo ${MAX_TAGS} etiquetas`
                                        : 'Nueva etiqueta'
                                }
                                placeholderTextColor={colors.textSecondary}
                                style={styles.input}
                                maxLength={MAX_TAG_LEN}
                                editable={tags.length < MAX_TAGS}
                                onSubmitEditing={addDraft}
                                returnKeyType="done"
                                accessibilityLabel="Nueva etiqueta"
                            />
                            <TouchableOpacity
                                style={[
                                    styles.addBtn,
                                    (!draft.trim() || tags.length >= MAX_TAGS) && styles.addBtnDisabled,
                                ]}
                                onPress={addDraft}
                                disabled={!draft.trim() || tags.length >= MAX_TAGS}
                                accessibilityLabel="Añadir etiqueta"
                            >
                                <Ionicons name="add" size={20} color={colors.white} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={styles.btnSecondary}
                                onPress={onCancel}
                                activeOpacity={0.75}
                            >
                                <Text style={styles.btnSecondaryText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.btnPrimary}
                                onPress={save}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.btnPrimaryText}>Guardar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 27, 51, 0.55)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    cardWrap: {
        width: '100%',
        alignItems: 'center',
    },
    card: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: colors.card,
        borderRadius: 20,
        paddingHorizontal: spacing.md + 4,
        paddingTop: spacing.md,
        paddingBottom: spacing.md,
        shadowColor: '#0F1B33',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.2,
        shadowRadius: 28,
        elevation: 20,
    },
    head: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    title: {
        fontSize: 17,
        fontWeight: '800',
        color: colors.dark,
    },
    tagsScroll: {
        maxHeight: 180,
        marginBottom: spacing.sm + 4,
    },
    tagsWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: NOTES_ACCENT_BG,
        borderWidth: 1,
        borderColor: NOTES_ACCENT,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
    },
    tagText: {
        fontSize: 13,
        color: NOTES_ACCENT,
        fontWeight: '700',
    },
    empty: {
        fontSize: 13,
        color: colors.textSecondary,
        paddingVertical: spacing.sm,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    input: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: Platform.OS === 'ios' ? 12 : 8,
        fontSize: 14,
        color: colors.dark,
    },
    addBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: NOTES_ACCENT,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addBtnDisabled: {
        opacity: 0.4,
    },
    footer: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    btnSecondary: {
        flex: 1,
        borderWidth: 1,
        borderColor: colors.separator,
        paddingVertical: 13,
        borderRadius: 12,
        alignItems: 'center',
    },
    btnSecondaryText: {
        color: colors.dark,
        fontWeight: '700',
        fontSize: 14,
    },
    btnPrimary: {
        flex: 1,
        backgroundColor: NOTES_ACCENT,
        paddingVertical: 13,
        borderRadius: 12,
        alignItems: 'center',
    },
    btnPrimaryText: {
        color: colors.white,
        fontWeight: '700',
        fontSize: 14,
    },
});
