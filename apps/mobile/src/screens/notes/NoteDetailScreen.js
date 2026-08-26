import React, { useState, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Image,
    Modal,
    Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Rect } from 'react-native-svg';
import { colors, spacing } from '../../theme';
import NotesDeleteConfirmModal from '../../components/NotesDeleteConfirmModal';
import NotesTagsEditorModal from '../../components/NotesTagsEditorModal';
import { notesApi } from '../../api';

// Colores confirmados contra Figma (frame SUBIR APUNTES · detalle, Bloque
// 9) sin equivalente exacto en theme.js.
const FIGMA = {
    cardBorder: 'rgba(65,41,80,0.3)',
};

const WARNING_COLOR = '#F59E0B';

// Paleta rotativa para chips de etiquetas. Figma confirma colores fijos
// solo para las 2 etiquetas de su ejemplo (verde/morado) — como las
// etiquetas son texto libre editable por el usuario (NotesTagsEditorModal),
// no hay un color "correcto" por significado; se mantiene una paleta
// rotativa pero con los tonos confirmados + 2 acentos ya usados en el
// resto de la app para cuando haya más de 2 etiquetas.
const TAG_PALETTE = [colors.ctaGreen, colors.selectionBorder, colors.accentOrange, colors.purple];

function DocumentIcon({ width = 32, height = 42, color = colors.accentOrange }) {
    return (
        <Svg width={width} height={height} viewBox="0 0 32 42">
            <Path
                d="M4 2H20L28 10V38C28 39.1 27.1 40 26 40H4C2.9 40 2 39.1 2 38V4C2 2.9 2.9 2 4 2Z"
                fill="none"
                stroke={color}
                strokeWidth={2.2}
                strokeLinejoin="round"
            />
            <Path d="M20 2V10H28" fill="none" stroke={color} strokeWidth={2.2} strokeLinejoin="round" />
            <Rect x={8} y={20} width={16} height={2.2} rx={1.1} fill={color} />
            <Rect x={8} y={26} width={16} height={2.2} rx={1.1} fill={color} />
            <Rect x={8} y={32} width={10} height={2.2} rx={1.1} fill={color} />
        </Svg>
    );
}

function PageThumbnailIcon({ size = 24, color = colors.textDark }) {
    return (
        <Svg width={size} height={size * 1.2} viewBox="0 0 24 29">
            <Path
                d="M3 2H16L21 7V26C21 26.6 20.6 27 20 27H3C2.4 27 2 26.6 2 26V3C2 2.4 2.4 2 3 2Z"
                fill="none"
                stroke={color}
                strokeWidth={1.4}
                strokeLinejoin="round"
            />
            <Path d="M16 2V7H21" fill="none" stroke={color} strokeWidth={1.4} strokeLinejoin="round" />
        </Svg>
    );
}

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
    return (
        <View style={styles.metaCard}>
            <DocumentIcon />
            <Text style={styles.metaTitle} numberOfLines={1}>{note.fileName}</Text>
            <Text style={styles.metaSubtitle}>
                {note.pages} {note.pages === 1 ? 'página' : 'páginas'} · subido el {formatDate(note.uploadedAt)}
            </Text>
        </View>
    );
}

function TagChip({ label, color }) {
    return (
        <View style={[styles.tag, { borderColor: color, backgroundColor: `${color}26` }]}>
            <Text style={[styles.tagText, { color }]}>{label}</Text>
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
                <PageThumbnailIcon />
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
    // Menú contextual anclado abajo del icono kebab del header. No está en
    // el frame de Figma, pero es la única forma real de editar etiquetas o
    // eliminar el apunte — sin esto quedarían sin ningún punto de acceso.
    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <Pressable style={styles.menuOverlay} onPress={onClose}>
                <View style={[styles.menuCard, { top: anchorTop }]}>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={onEditTags}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="pricetag-outline" size={18} color={colors.textDark} />
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
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.iconBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Volver"
                >
                    <Ionicons name="chevron-back" size={24} color={colors.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{note.title}</Text>
                <TouchableOpacity
                    onPress={() => setMenuVisible(true)}
                    style={styles.iconBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Más opciones"
                    disabled={deleting}
                >
                    <Ionicons name="ellipsis-vertical" size={22} color={colors.textDark} />
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
                                <TagChip key={t} label={t} color={TAG_PALETTE[i % TAG_PALETTE.length]} />
                            ))
                        )}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>PÁGINAS DIGITALIZADAS</Text>
                    <View style={styles.pagesRow}>
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
    container: { flex: 1, backgroundColor: colors.white },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
    },
    iconBtn: { width: 32, alignItems: 'center' },
    headerTitle: {
        flex: 1,
        fontFamily: 'Poppins-SemiBold',
        fontSize: 21.3,
        color: colors.textDark,
        textAlign: 'center',
    },

    scroll: { flex: 1 },
    content: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.xs,
        paddingBottom: spacing.md,
    },

    // Ficha de documento — outline, sin relleno
    metaCard: {
        borderWidth: 0.32,
        borderColor: FIGMA.cardBorder,
        borderRadius: 10.7,
        alignItems: 'center',
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.lg,
    },
    metaTitle: {
        marginTop: 12,
        fontFamily: 'Poppins-SemiBold',
        fontSize: 21.3,
        color: colors.textDark,
        textAlign: 'center',
    },
    metaSubtitle: {
        marginTop: 4,
        fontFamily: 'Poppins-Regular',
        fontSize: 8.9,
        color: colors.textDark,
    },

    section: {
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: colors.textDark,
        marginBottom: spacing.sm + 4,
    },

    // Tags — outline con fondo tenue
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    tag: {
        borderWidth: 0.9,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 6,
    },
    tagText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 12.2,
    },
    tagsEmpty: {
        fontFamily: 'Poppins-Regular',
        fontSize: 13,
        color: colors.textDark,
        fontStyle: 'italic',
    },

    // Miniaturas de página — fila de cajas outline pequeñas
    pagesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    pageItem: {
        width: 60,
        height: 72,
        borderRadius: 3.6,
        borderWidth: 0.32,
        borderColor: FIGMA.cardBorder,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    pageItemProblem: {
        borderWidth: 2,
        borderColor: WARNING_COLOR,
    },
    pageImage: {
        width: '100%',
        height: '100%',
    },
    pageBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: WARNING_COLOR,
        width: 16,
        height: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },

    actionSection: {
        padding: spacing.md,
        paddingBottom: spacing.md,
        backgroundColor: colors.white,
    },
    btnPrimary: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 61.3,
        backgroundColor: colors.ctaGreen,
        borderRadius: 14.2,
    },
    btnPrimaryText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: colors.white,
    },
    btnPrimaryDisabled: {
        backgroundColor: colors.gray,
    },
    noQuestionsHint: {
        fontFamily: 'Poppins-Regular',
        fontSize: 12,
        color: colors.textDark,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },

    // Menú kebab — sin dato de Figma, restyleado mínimamente
    menuOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    menuCard: {
        position: 'absolute',
        right: spacing.md,
        backgroundColor: colors.white,
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
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
        color: colors.textDark,
    },
    menuSeparator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: FIGMA.cardBorder,
    },
});
