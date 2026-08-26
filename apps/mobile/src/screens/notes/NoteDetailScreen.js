import React, { useState, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Alert,
    Image,
    Modal,
    Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import NotesDeleteConfirmModal from '../../components/NotesDeleteConfirmModal';
import NotesTagsEditorModal from '../../components/NotesTagsEditorModal';
import { notesApi } from '../../api';

const WARNING_COLOR = '#F59E0B';

// Paleta rotativa para chips de etiquetas — 4 tonos suaves OPOX.
const TAG_PALETTES = [
    { text: '#2563EB', bg: '#E8F2FC' },  // azul
    { text: '#7B4BC4', bg: '#EEE5F7' },  // morado
    { text: '#1F9D6B', bg: '#DEF2E7' },  // verde
    { text: '#E9825E', bg: '#FCE5D9' },  // naranja
];

// Mock local — cuando exista backend: GET /notes/:noteId devuelve NoteDetail.
const MOCK_NOTE_DETAIL = {
    id: 'mock-note-id',
    title: 'Esquema Constitución',
    fileName: 'Esquema Constitución.pdf',
    kind: 'pdf',
    pages: 8,
    uploadedAt: '2026-06-12',
    tags: ['Constitución', 'Derechos fundamentales', 'Título I'],
    questionsCount: 24,
    pageThumbnails: Array.from({ length: 3 }).map((_, i) => ({
        pageNumber: i + 1,
        thumbnailUrl: null,
        ocrConfidence: 0.92,
    })),
};

function MetaCard({ note }) {
    // Card con icono azul + nombre.pdf + subtítulo con páginas y fecha.
    return (
        <View style={styles.metaCard}>
            <View style={styles.metaIcon}>
                <Ionicons name="document-text" size={22} color="#5AA2E5" />
            </View>
            <View style={styles.metaTexts}>
                <Text style={styles.metaTitle} numberOfLines={1}>{note.fileName}</Text>
                <Text style={styles.metaSubtitle}>
                    {note.pages} {note.pages === 1 ? 'página' : 'páginas'} · subido el {formatDate(note.createdAt ?? note.uploadedAt)}
                </Text>
            </View>
        </View>
    );
}

function TagChip({ label, palette }) {
    return (
        <View style={[styles.tag, { backgroundColor: palette.bg }]}>
            <Text style={[styles.tagText, { color: palette.text }]}>{label}</Text>
        </View>
    );
}

function PageThumbnail({ page, needsReview, onPress }) {
    const isProblematic = needsReview && page.ocrConfidence < 0.6;
    return (
        <TouchableOpacity
            style={[styles.pageItem, isProblematic && styles.pageItemProblem]}
            onPress={onPress}
            activeOpacity={0.85}
            accessibilityLabel={`Página ${page.pageNumber}`}
            accessibilityRole="button"
        >
            {page.thumbnailUrl ? (
                <Image source={{ uri: page.thumbnailUrl }} style={styles.pageImage} />
            ) : (
                <View style={styles.pagePlaceholder}>
                    <Ionicons name="document-outline" size={28} color="#C5CDD8" />
                </View>
            )}
            {isProblematic ? (
                <View style={styles.pageBadge}>
                    <Ionicons name="warning" size={10} color={colors.white} />
                </View>
            ) : null}
        </TouchableOpacity>
    );
}

function KebabMenu({ visible, anchorTop, onClose, onEditTags, onDelete }) {
    // Menú contextual anclado abajo del icono kebab del header.
    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <Pressable style={styles.menuOverlay} onPress={onClose}>
                <View style={[styles.menuCard, { top: anchorTop }]}>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={onEditTags}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="pricetag-outline" size={18} color={colors.dark} />
                        <Text style={styles.menuItemText}>Editar etiquetas</Text>
                    </TouchableOpacity>
                    <View style={styles.menuSeparator} />
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={onDelete}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="trash-outline" size={18} color="#DC2626" />
                        <Text style={[styles.menuItemText, { color: '#DC2626' }]}>Eliminar apunte</Text>
                    </TouchableOpacity>
                </View>
            </Pressable>
        </Modal>
    );
}

export default function NoteDetailScreen({ navigation, route }) {
    const { noteId, needsReview = false } = route?.params ?? {};

    const baseNote = useMemo(
        () => ({ ...MOCK_NOTE_DETAIL, id: noteId ?? MOCK_NOTE_DETAIL.id }),
        [noteId],
    );

    // Estado que puede sobrescribir el mock cuando llegue la respuesta del backend.
    const [remoteNote, setRemoteNote] = useState(null);
    const [tags, setTags] = useState(baseNote.tags);
    const note = useMemo(
        () => remoteNote ?? { ...baseNote, tags },
        [remoteNote, baseNote, tags],
    );

    // Carga real del backend. Si falla, seguimos con el mock (útil en dev).
    useEffect(() => {
        if (!noteId) return;
        let cancelled = false;
        (async () => {
            const res = await notesApi.get(noteId);
            if (cancelled || !res?.data) return;
            setRemoteNote(res.data);
            setTags(res.data.tags ?? []);
        })();
        return () => { cancelled = true; };
    }, [noteId]);

    const [deleting, setDeleting] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [tagsEditorVisible, setTagsEditorVisible] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);

    const openDeleteModal = () => {
        setMenuVisible(false);
        setDeleteModalVisible(true);
    };
    const openTagsEditor = () => {
        setMenuVisible(false);
        setTagsEditorVisible(true);
    };
    const closeDeleteModal = () => setDeleteModalVisible(false);

    const doDelete = async () => {
        closeDeleteModal();
        setDeleting(true);
        if (noteId) await notesApi.remove(noteId);
        setDeleting(false);
        navigation.navigate('NotesHome', { toast: 'Apunte eliminado' });
    };

    const saveTags = async (nextTags) => {
        setTags(nextTags);
        setTagsEditorVisible(false);
        if (noteId) await notesApi.updateTags(noteId, nextTags);
    };

    const startTest = () => {
        navigation.navigate('NotesTestConfig', {
            noteId: note.id,
            noteData: note,
        });
    };

    const openPage = (page) => {
        Alert.alert(
            `Página ${page.pageNumber}`,
            'Vista ampliada de la página pendiente de implementar.',
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

            {/* Header: chevron naranja + título + kebab (⋮) */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Volver"
                >
                    <Text style={styles.backChevron}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{note.title}</Text>
                <TouchableOpacity
                    onPress={() => setMenuVisible(true)}
                    style={styles.kebabBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Más opciones"
                    disabled={deleting}
                >
                    <Ionicons name="ellipsis-vertical" size={22} color={colors.dark} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <MetaCard note={note} />

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ETIQUETAS AUTOMÁTICAS</Text>
                    <View style={styles.tagsContainer}>
                        {note.tags.length === 0 ? (
                            <Text style={styles.tagsEmpty}>
                                Sin etiquetas. Abre el menú ⋮ para editarlas.
                            </Text>
                        ) : (
                            note.tags.map((t, i) => (
                                <TagChip
                                    key={t}
                                    label={t}
                                    palette={TAG_PALETTES[i % TAG_PALETTES.length]}
                                />
                            ))
                        )}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>PÁGINAS DIGITALIZADAS</Text>
                    <View style={styles.pagesGrid}>
                        {note.pageThumbnails.map((p) => (
                            <PageThumbnail
                                key={p.pageNumber}
                                page={p}
                                needsReview={needsReview}
                                onPress={() => openPage(p)}
                            />
                        ))}
                    </View>
                </View>
            </ScrollView>

            <View style={styles.actionSection}>
                {note.questionsCount === 0 ? (
                    <Text style={styles.noQuestionsHint}>
                        Este apunte aún no tiene preguntas generadas.
                    </Text>
                ) : null}
                <TouchableOpacity
                    style={[
                        styles.btnPrimary,
                        note.questionsCount === 0 && styles.btnPrimaryDisabled,
                    ]}
                    onPress={startTest}
                    disabled={note.questionsCount === 0}
                    activeOpacity={0.85}
                    accessibilityLabel="Generar test de estos apuntes"
                    accessibilityRole="button"
                >
                    <Text style={styles.btnPrimaryText}>Generar test de estos apuntes</Text>
                </TouchableOpacity>
            </View>

            <KebabMenu
                visible={menuVisible}
                anchorTop={54}
                onClose={() => setMenuVisible(false)}
                onEditTags={openTagsEditor}
                onDelete={openDeleteModal}
            />

            <NotesDeleteConfirmModal
                visible={deleteModalVisible}
                questionsCount={note.questionsCount}
                onConfirm={doDelete}
                onCancel={closeDeleteModal}
            />

            <NotesTagsEditorModal
                visible={tagsEditorVisible}
                initialTags={note.tags}
                onSave={saveTags}
                onCancel={() => setTagsEditorVisible(false)}
            />
        </SafeAreaView>
    );
}

function formatDate(iso) {
    if (!iso) return '';
    try {
        const d = new Date(iso);
        return d
            .toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
            .replace('.', '');
    } catch {
        return iso;
    }
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing.sm,
    },
    backBtn: { paddingRight: spacing.xs },
    backChevron: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.primary,
        lineHeight: 32,
        marginRight: spacing.sm,
    },
    headerTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: '800',
        color: colors.dark,
    },
    kebabBtn: {
        padding: 4,
    },

    // Scroll
    scroll: { flex: 1 },
    content: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.xs,
        paddingBottom: spacing.md,
    },

    // Meta card
    metaCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 14,
        padding: spacing.sm + 4,
        marginBottom: spacing.lg,
    },
    metaIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#E8F2FC',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm + 4,
    },
    metaTexts: { flex: 1 },
    metaTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.dark,
        marginBottom: 3,
    },
    metaSubtitle: {
        fontSize: 12,
        color: colors.grayText,
    },

    // Section
    section: {
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
        color: colors.grayText,
        marginBottom: spacing.sm + 4,
        textTransform: 'uppercase',
    },

    // Tags
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    tag: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
    },
    tagText: {
        fontSize: 12,
        fontWeight: '700',
    },
    tagsEmpty: {
        fontSize: 13,
        color: colors.grayText,
        fontStyle: 'italic',
    },

    // Pages grid — 3 columnas grandes con borde blanco y placeholder centrado
    pagesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm + 4,
    },
    pageItem: {
        width: '31%',
        aspectRatio: 3 / 4,
        borderRadius: 12,
        backgroundColor: colors.card,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#EEF1F5',
    },
    pageItemProblem: {
        borderWidth: 2,
        borderColor: WARNING_COLOR,
    },
    pageImage: {
        width: '100%',
        height: '100%',
    },
    pagePlaceholder: {
        flex: 1,
        alignSelf: 'stretch',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pageBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: WARNING_COLOR,
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // CTA
    actionSection: {
        padding: spacing.md,
        paddingBottom: spacing.md,
        backgroundColor: colors.background,
    },
    btnPrimary: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        borderRadius: 14,
        paddingVertical: 16,
        shadowColor: colors.primary,
        shadowOpacity: 0.25,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
    },
    btnPrimaryText: {
        color: colors.white,
        fontSize: 15,
        fontWeight: '800',
    },
    btnPrimaryDisabled: {
        backgroundColor: colors.grayMid,
        shadowOpacity: 0,
    },
    noQuestionsHint: {
        fontSize: 12,
        color: colors.grayText,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },

    // Kebab menu
    menuOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    menuCard: {
        position: 'absolute',
        right: spacing.md,
        backgroundColor: colors.card,
        borderRadius: 12,
        paddingVertical: 4,
        minWidth: 200,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm + 2,
        paddingVertical: 12,
        paddingHorizontal: spacing.md,
    },
    menuItemText: {
        fontSize: 14,
        color: colors.dark,
        fontWeight: '600',
    },
    menuSeparator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.separator,
    },
});
