import React, { useState, useMemo, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Image,
    Modal,
    Pressable,
} from 'react-native';
import Text from '../../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
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

// Icono exacto exportado de Figma — mismo documento que NotesHomeScreen.
function DocumentIcon({ width = 55, height = 72, color = colors.accentOrange }) {
    return (
        <Svg width={width} height={height} viewBox="0 0 72 94" fill="none">
            <Path d="M40.0012 93.9998H2.00193H0V91.9985V12.0286V10.0327H2.00193H61.9957H63.9976V12.0286V68.0102H59.9991V14.0299H3.99852V90.0026H40.0012V93.9998Z" fill={color} />
            <Path d="M42.0564 88.8608V70.0063H64.179L61.0881 73.3578L45.5264 90.1896L42.0564 93.9253V88.8181V88.8608ZM46.0549 74.0088V83.7536L55.0556 74.0088H46.0549Z" fill={color} />
            <Path d="M50.0002 23.0063H12.001V27.0035H50.0002V23.0063Z" fill={color} />
            <Path d="M50.0002 39.0005H12.001V42.9976H50.0002V39.0005Z" fill={color} />
            <Path d="M50.0002 54.9995H12.001V58.9967H50.0002V54.9995Z" fill={color} />
            <Path d="M7.99707 5.99841V2.00125V0H9.999H69.9981H72V2.00125V52.0165H67.9962V3.99716H12.0009V5.99841H7.99707Z" fill={color} />
        </Svg>
    );
}

// Icono exacto exportado de Figma para las miniaturas de página sin thumbnail
// (documento morado al 30% de opacidad, tono placeholder).
function PageThumbnailIcon({ height = 40, color = colors.textDark }) {
    return (
        <Svg width={(height * 74) / 96} height={height} viewBox="0 0 74 96" fill="none">
            <Path d="M46.1161 96H2.30827H0V93.7181V2.28804V0H2.30827H71.4824H73.7907V2.28804V66.286H69.1803V4.56998H4.61038V91.43H46.1161V96Z" fill={color} fillOpacity={0.3} />
            <Path d="M48.4922 90.1245V68.5742H74.0001L70.4361 72.4059L52.4932 91.6682L48.4922 95.9392V90.1001V90.1245ZM53.1026 73.1442V84.2854L63.4805 73.1442H53.1026Z" fill={color} fillOpacity={0.3} />
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
                {note.pages} {note.pages === 1 ? 'página' : 'páginas'} · subido el {formatDate(note.createdAt ?? note.uploadedAt)}
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
                    style={styles.backBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Volver"
                >
                    <Feather name="chevron-left" size={22} color={colors.textDark} />
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
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(65, 41, 80, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
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
