import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import Text from '../../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing } from '../../theme';
import { notesApi } from '../../api';

// Colores confirmados contra Figma (frame HOME FACTORIA, Bloque 9) sin
// equivalente exacto en theme.js.
const FIGMA = {
    cardBorder: 'rgba(65,41,80,0.3)',
    separator: 'rgba(65,41,80,0.5)',
    textNote: '#343A3D',
    textNoteMuted: 'rgba(52,58,61,0.5)',
};

// Icono exacto exportado de Figma — documento con esquina doblada + líneas.
function DocumentIcon({ width = 55, height = 72, color = colors.accentOrange }) {
    return (
        <Svg width={width} height={height} viewBox="0 0 72 94" fill="none">
            <Path d="M40.0012 93.9998H2.00193H0V91.9985V12.0286V10.0327H2.00193H61.9957H63.9976V12.0286V68.0102H59.9991V14.0299H3.99852V90.0026H40.0012V93.9998Z" fill={color} />
            <Path d="M42.0566 88.8608V70.0063H64.1793L61.0883 73.3578L45.5266 90.1896L42.0566 93.9253V88.8181V88.8608ZM46.0552 74.0088V83.7536L55.0558 74.0088H46.0552Z" fill={color} />
            <Path d="M50.0002 23.0063H12.001V27.0035H50.0002V23.0063Z" fill={color} />
            <Path d="M50.0002 39.0005H12.001V42.9976H50.0002V39.0005Z" fill={color} />
            <Path d="M50.0002 54.9995H12.001V58.9967H50.0002V54.9995Z" fill={color} />
            <Path d="M7.99707 5.99841V2.00125V0H9.999H69.9981H72V2.00125V52.0165H67.9962V3.99716H12.0009V5.99841H7.99707Z" fill={color} />
        </Svg>
    );
}

// Icono exacto exportado de Figma para el botón "+" de subir apuntes.
function PlusIcon({ size = 22, color = colors.accentOrange }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 49 49" fill="none">
            <Path d="M48.96 26.4H26.496V48.96H22.368V26.4H2.36034e-05V22.56H22.368V-2.47955e-05H26.496V22.56H48.96V26.4Z" fill={color} />
        </Svg>
    );
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
    return (
        <View style={styles.kpiCard}>
            <DocumentIcon />
            <Text style={styles.kpiPrimary}>{totalNotes} apuntes digitalizados</Text>
            <Text style={styles.kpiSecondary}>{totalQuestions} preguntas generadas</Text>
        </View>
    );
}

function DocItem({ note, isLast, onPress }) {
    return (
        <TouchableOpacity
            style={[styles.docItem, !isLast && styles.docItemSeparator]}
            onPress={onPress}
            activeOpacity={0.7}
            accessibilityLabel={`Abrir ${note.title}`}
            accessibilityRole="button"
        >
            <View style={styles.docInfo}>
                <Text style={styles.docTitle} numberOfLines={1}>{note.title}</Text>
                <Text style={styles.docMeta} numberOfLines={1}>
                    {note.kind === 'photo' ? 'Foto' : 'PDF'} · {note.pages} {note.pages === 1 ? 'pág' : 'págs'} · {note.questionsCount} preguntas
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textDark} />
        </TouchableOpacity>
    );
}

function EmptyState({ onUpload }) {
    return (
        <View style={styles.stateBlock}>
            <View style={styles.stateIconWrap}>
                <Ionicons name="folder-open-outline" size={44} color={colors.accentOrange} />
            </View>
            <Text style={styles.stateTitle}>Aún no tienes apuntes</Text>
            <Text style={styles.stateDesc}>
                Sube tu primer PDF o foto y la IA te generará preguntas listas para practicar.
            </Text>
            <TouchableOpacity
                style={styles.uploadButton}
                onPress={onUpload}
                activeOpacity={0.85}
                accessibilityLabel="Subir mi primer apunte"
                accessibilityRole="button"
            >
                <Text style={styles.uploadButtonText}>Subir mi primer apunte</Text>
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
                style={[styles.uploadButton, { backgroundColor: colors.textDark }]}
                onPress={onRetry}
                activeOpacity={0.85}
            >
                <Text style={styles.uploadButtonText}>Reintentar</Text>
            </TouchableOpacity>
        </View>
    );
}

function LoadingState() {
    return (
        <View style={styles.stateBlock}>
            <ActivityIndicator color={colors.accentOrange} size="large" />
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

    useFocusEffect(useCallback(() => { load(); }, [load]));

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
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Volver"
                >
                    <Feather name="chevron-left" size={22} color={colors.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mis apuntes</Text>
                <TouchableOpacity
                    onPress={goUpload}
                    style={styles.addBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Subir apuntes"
                >
                    <PlusIcon />
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
                        tintColor={colors.accentOrange}
                        colors={[colors.accentOrange]}
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
                                <DocItem key={n.id} note={n} isLast={i === notes.length - 1} onPress={() => openNote(n)} />
                            ))}
                        </View>

                        <TouchableOpacity
                            style={styles.uploadButton}
                            onPress={goUpload}
                            activeOpacity={0.85}
                            accessibilityLabel="Subir nuevos apuntes"
                            accessibilityRole="button"
                        >
                            <Text style={styles.uploadButtonText}>Subir nuevos apuntes</Text>
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
        backgroundColor: colors.white,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(65, 41, 80, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addBtn: {
        width: 44,
        height: 44,
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
    body: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.xs,
        paddingBottom: spacing.md,
    },
    bodyStateCentered: {
        flexGrow: 1,
        justifyContent: 'center',
    },

    // Tarjeta de estadísticas — outline, sin relleno
    kpiCard: {
        borderWidth: 0.32,
        borderColor: FIGMA.cardBorder,
        borderRadius: 10.7,
        alignItems: 'center',
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.lg,
    },
    kpiPrimary: {
        marginTop: 12,
        fontFamily: 'Poppins-SemiBold',
        fontSize: 21.3,
        color: colors.textDark,
    },
    kpiSecondary: {
        marginTop: 4,
        fontFamily: 'Poppins-Regular',
        fontSize: 8.9,
        color: colors.textDark,
    },

    // Lista
    listHeader: {
        fontFamily: 'Poppins-Medium',
        fontSize: 10.7,
        color: FIGMA.textNoteMuted,
        letterSpacing: 0.5,
        marginBottom: spacing.sm,
    },
    list: {
        marginBottom: spacing.lg,
    },

    // Fila de documento — plana, sin ícono ni tarjeta
    docItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
    },
    docItemSeparator: {
        borderBottomWidth: 0.44,
        borderBottomColor: FIGMA.separator,
    },
    docInfo: {
        flex: 1,
        marginRight: spacing.xs,
    },
    docTitle: {
        fontFamily: 'Poppins-Bold',
        fontSize: 17.8,
        color: colors.textDark,
    },
    docMeta: {
        marginTop: 2,
        fontFamily: 'Poppins-Regular',
        fontSize: 11.6,
        color: FIGMA.textNoteMuted,
    },

    uploadButton: {
        height: 61,
        borderRadius: 14.2,
        backgroundColor: colors.ctaGreen,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.xs,
        alignSelf: 'stretch',
    },
    uploadButtonText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: colors.white,
    },

    // Estados (loading / empty / error) — sin dato de Figma, restyleados
    // mínimamente a los tokens del sistema.
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
        backgroundColor: 'rgba(246,150,36,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
    },
    stateTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 17,
        color: colors.textDark,
        textAlign: 'center',
    },
    stateDesc: {
        fontFamily: 'Poppins-Regular',
        fontSize: 13,
        color: FIGMA.textNote,
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
        backgroundColor: colors.textDark,
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
        fontFamily: 'Poppins-SemiBold',
        color: colors.white,
        fontSize: 13,
    },
});
