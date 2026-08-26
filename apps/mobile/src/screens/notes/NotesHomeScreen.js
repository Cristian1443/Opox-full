import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import { notesApi } from '../../api';

// Paleta suave por documento — pasteles OPOX (rotan por índice cuando el kind es igual).
const DOC_PALETTES = {
    pdf: [
        { iconColor: '#5AA2E5', bg: '#E8F2FC' },   // azul claro
        { iconColor: '#5BB59A', bg: '#E6F5EF' },   // verde pastel
    ],
    photo: [
        { iconColor: '#E9825E', bg: '#FCE5D9' },   // naranja pastel
        { iconColor: '#C48BD1', bg: '#F0E4F5' },   // lila pastel
    ],
};

function paletteFor(note, idx) {
    const list = DOC_PALETTES[note.kind] ?? DOC_PALETTES.pdf;
    return list[idx % list.length];
}

function iconFor(kind) {
    return kind === 'photo' ? 'camera' : 'document-text';
}

// Fallback mock si el backend aún no está disponible (Supabase sin configurar).
const MOCK_STATE = {
    stats: { totalNotes: 0, totalQuestions: 0, ingestStatus: 'ok' },
    notes: [],
};

// Llama al backend real; si el backend responde error o no está accesible,
// cae al mock para no romper la pantalla en dev sin backend.
async function fetchNotes() {
    const res = await notesApi.list();
    if (res?.error || !res?.data) {
        // Bloque 9 aún no cableado en backend o Supabase sin configurar.
        return MOCK_STATE;
    }
    return res.data;
}

function KpiCard({ totalNotes, totalQuestions }) {
    // Card navy con icono cuadrado a la izquierda y textos apilados a la derecha.
    return (
        <View style={styles.kpiCard}>
            <View style={styles.kpiIconBox}>
                <Ionicons name="document-text-outline" size={22} color={colors.white} />
            </View>
            <View style={styles.kpiTexts}>
                <Text style={styles.kpiPrimary}>{totalNotes} apuntes digitalizados</Text>
                <Text style={styles.kpiSecondary}>{totalQuestions} preguntas generadas</Text>
            </View>
        </View>
    );
}

function DocItem({ note, idx, onPress }) {
    const palette = paletteFor(note, idx);
    return (
        <TouchableOpacity
            style={styles.docItem}
            onPress={onPress}
            activeOpacity={0.75}
            accessibilityLabel={`Abrir ${note.title}`}
            accessibilityRole="button"
        >
            <View style={[styles.docIcon, { backgroundColor: palette.bg }]}>
                <Ionicons name={iconFor(note.kind)} size={22} color={palette.iconColor} />
            </View>
            <View style={styles.docInfo}>
                <Text style={styles.docTitle} numberOfLines={1}>{note.title}</Text>
                <Text style={styles.docMeta} numberOfLines={1}>
                    {note.kind === 'photo' ? 'Foto' : 'PDF'} · {note.pages} {note.pages === 1 ? 'pág' : 'págs'}
                    {'  ·  '}
                    {note.questionsCount} preguntas
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.grayText} />
        </TouchableOpacity>
    );
}

function EmptyState({ onUpload }) {
    return (
        <View style={styles.stateBlock}>
            <View style={styles.stateIconWrap}>
                <Ionicons name="folder-open-outline" size={44} color={colors.primary} />
            </View>
            <Text style={styles.stateTitle}>Aún no tienes apuntes</Text>
            <Text style={styles.stateDesc}>
                Sube tu primer PDF o foto y la IA te generará preguntas listas para practicar.
            </Text>
            <TouchableOpacity
                style={styles.orangeCta}
                onPress={onUpload}
                activeOpacity={0.85}
                accessibilityLabel="Subir mi primer apunte"
                accessibilityRole="button"
            >
                <Ionicons name="add" size={18} color={colors.white} />
                <Text style={styles.orangeCtaText}>Subir mi primer apunte</Text>
            </TouchableOpacity>
        </View>
    );
}

function ErrorState({ onRetry }) {
    return (
        <View style={styles.stateBlock}>
            <View style={[styles.stateIconWrap, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="cloud-offline-outline" size={44} color="#DC2626" />
            </View>
            <Text style={styles.stateTitle}>No pudimos cargar tus apuntes</Text>
            <Text style={styles.stateDesc}>Comprueba tu conexión y vuelve a intentarlo.</Text>
            <TouchableOpacity
                style={[styles.orangeCta, { backgroundColor: colors.dark }]}
                onPress={onRetry}
                activeOpacity={0.85}
            >
                <Ionicons name="refresh-outline" size={18} color={colors.white} />
                <Text style={styles.orangeCtaText}>Reintentar</Text>
            </TouchableOpacity>
        </View>
    );
}

function LoadingState() {
    return (
        <View style={styles.stateBlock}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={[styles.stateDesc, { marginTop: spacing.md }]}>Cargando tus apuntes...</Text>
        </View>
    );
}

function Toast({ message }) {
    if (!message) return null;
    return (
        <View style={styles.toast} pointerEvents="none">
            <Ionicons name="checkmark-circle" size={18} color={colors.white} />
            <Text style={styles.toastText}>{message}</Text>
        </View>
    );
}

export default function NotesHomeScreen({ navigation, route }) {
    const [status, setStatus] = useState('loading');
    const [data, setData] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [toastMessage, setToastMessage] = useState(route?.params?.toast ?? null);

    const load = useCallback(async () => {
        try {
            const res = await fetchNotes();
            setData(res);
            setStatus('ready');
        } catch {
            setStatus('error');
        }
    }, []);

    useFocusEffect(load);

    useEffect(() => {
        if (!toastMessage) return;
        const t = setTimeout(() => setToastMessage(null), 2500);
        return () => clearTimeout(t);
    }, [toastMessage]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            const res = await fetchNotes();
            setData(res);
            setStatus('ready');
        } catch {
            setStatus('error');
        } finally {
            setRefreshing(false);
        }
    }, []);

    const goUpload = () => navigation.navigate('NotesUpload');
    const openNote = (note) => navigation.navigate('NoteDetail', { noteId: note.id });

    const isEmpty = status === 'ready' && (!data?.notes || data.notes.length === 0);
    const stats = data?.stats ?? { totalNotes: 0, totalQuestions: 0 };
    const notes = data?.notes ?? [];

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

            {/* Header con chevron naranja + título negrita + botón "+" outline naranja */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Volver"
                >
                    <Text style={styles.backChevron}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Mis apuntes</Text>
                <TouchableOpacity
                    onPress={goUpload}
                    style={styles.headerPlusBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Subir apuntes"
                >
                    <Ionicons name="add" size={26} color={colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={[
                    styles.body,
                    (isEmpty || status !== 'ready') && styles.bodyStateCentered,
                ]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
            >
                {status === 'loading' && <LoadingState />}
                {status === 'error' && <ErrorState onRetry={load} />}
                {status === 'ready' && isEmpty && <EmptyState onUpload={goUpload} />}

                {status === 'ready' && !isEmpty && (
                    <>
                        <KpiCard
                            totalNotes={stats.totalNotes}
                            totalQuestions={stats.totalQuestions}
                        />

                        <Text style={styles.listHeader}>MIS DOCUMENTOS</Text>

                        <View style={styles.list}>
                            {notes.map((n, i) => (
                                <DocItem key={n.id} note={n} idx={i} onPress={() => openNote(n)} />
                            ))}
                        </View>

                        {/* CTA grande naranja al final de la lista */}
                        <TouchableOpacity
                            style={styles.orangeCta}
                            onPress={goUpload}
                            activeOpacity={0.85}
                            accessibilityLabel="Subir nuevos apuntes"
                            accessibilityRole="button"
                        >
                            <Ionicons name="add" size={20} color={colors.white} />
                            <Text style={styles.orangeCtaText}>Subir nuevos apuntes</Text>
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>

            <Toast message={toastMessage} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing.sm,
        backgroundColor: colors.background,
    },
    backBtn: {
        paddingRight: spacing.xs,
    },
    backChevron: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.primary,
        lineHeight: 32,
        marginRight: spacing.sm,
    },
    title: {
        flex: 1,
        fontSize: 20,
        fontWeight: '800',
        color: colors.dark,
    },
    headerPlusBtn: {
        padding: 4,
    },

    // Cuerpo
    scroll: { flex: 1 },
    body: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing.xl,
    },
    bodyStateCentered: {
        flexGrow: 1,
        justifyContent: 'center',
    },

    // KPI navy
    kpiCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.dark,
        borderRadius: 16,
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    kpiIconBox: {
        width: 46,
        height: 46,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    kpiTexts: {
        flex: 1,
    },
    kpiPrimary: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 2,
    },
    kpiSecondary: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        fontWeight: '500',
    },

    // Lista
    listHeader: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
        color: colors.grayText,
        marginTop: spacing.sm,
        marginBottom: spacing.sm,
        textTransform: 'uppercase',
    },
    list: {
        gap: spacing.sm + 2,
        marginBottom: spacing.lg,
    },

    // Doc item
    docItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 14,
        paddingVertical: spacing.sm + 4,
        paddingHorizontal: spacing.sm + 4,
    },
    docIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm + 4,
    },
    docInfo: {
        flex: 1,
        marginRight: spacing.xs,
    },
    docTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.dark,
        marginBottom: 3,
    },
    docMeta: {
        fontSize: 12,
        color: colors.grayText,
    },

    // CTA naranja grande (usado como footer y en empty state)
    orangeCta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        backgroundColor: colors.primary,
        borderRadius: 14,
        paddingVertical: 15,
        marginTop: spacing.xs,
        shadowColor: colors.primary,
        shadowOpacity: 0.25,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
    },
    orangeCtaText: {
        color: colors.white,
        fontWeight: '800',
        fontSize: 15,
    },

    // States (loading / empty / error)
    stateBlock: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
    },
    stateIconWrap: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: '#FDE7D8',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
    },
    stateTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: colors.dark,
        textAlign: 'center',
    },
    stateDesc: {
        fontSize: 13,
        color: colors.grayText,
        textAlign: 'center',
        lineHeight: 19,
        marginBottom: spacing.md,
    },

    // Toast
    toast: {
        position: 'absolute',
        bottom: 24,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: colors.dark,
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
    },
    toastText: {
        color: colors.white,
        fontSize: 13,
        fontWeight: '600',
    },
});
