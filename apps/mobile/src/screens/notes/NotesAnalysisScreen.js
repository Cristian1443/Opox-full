import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    Animated,
    TouchableOpacity,
    BackHandler,
    Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import NotesDigitizedModal from '../../components/NotesDigitizedModal';
import NotesOcrErrorModal from '../../components/NotesOcrErrorModal';
import AlertCardModal from '../../components/AlertCardModal';
import { notesApi } from '../../api';

// Bloque 9 · Análisis IA — pantalla inmersiva navy con card central y línea escáner.

const NAVY = '#0D1B2A';
const NAVY_CARD = '#152438';
const NAVY_PILL = '#1B2A44';
const NAVY_SUB = '#4A5A75';

// 3 fases visibles al usuario. Los estados se derivan del progreso simulado.
const PHASES = [
    { id: 'ocr', label: 'Texto reconocido', labelActive: 'Reconociendo texto...' },
    { id: 'topics', label: 'Temas identificados', labelActive: 'Identificando temas...' },
    { id: 'questions', label: 'Generando preguntas', labelActive: 'Generando preguntas...' },
];

// Timeline mock (se sustituye por polling al backend cuando exista).
const MOCK_TIMELINE = [
    { at: 0, phaseIdx: 0 },
    { at: 1500, phaseIdx: 1 }, // OCR completo
    { at: 3000, phaseIdx: 2 }, // Temas completos
    { at: 5000, phaseIdx: 3 }, // Todo completo (>= PHASES.length)
];

function ScanCard({ children }) {
    // Card rectangular navy con line-scanner naranja que sube y baja.
    const scan = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(scan, {
                    toValue: 1,
                    duration: 1600,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(scan, {
                    toValue: 0,
                    duration: 1600,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ]),
        );
        loop.start();
        return () => loop.stop();
    }, [scan]);

    const translateY = scan.interpolate({
        inputRange: [0, 1],
        outputRange: [-70, 70],
    });

    return (
        <View style={styles.scanCard}>
            {/* Icono texto abstracto centrado como "documento a analizar" */}
            <View style={styles.scanIcon}>
                <View style={[styles.scanLine, { width: 34 }]} />
                <View style={[styles.scanLine, { width: 44, marginTop: 6 }]} />
                <View style={[styles.scanLine, { width: 28, marginTop: 6 }]} />
            </View>
            {/* Línea escáner horizontal naranja con glow */}
            <Animated.View
                style={[
                    styles.scanBeam,
                    { transform: [{ translateY }] },
                ]}
            />
            {children}
        </View>
    );
}

function StatusPill({ text }) {
    // Pill navy oscuro con "+" naranja al lado izquierdo del texto.
    return (
        <View style={styles.statusPill}>
            <View style={styles.statusPlus}>
                <Ionicons name="add" size={16} color={colors.primary} />
            </View>
            <Text style={styles.statusPillText}>{text}</Text>
        </View>
    );
}

function PhaseRow({ label, status }) {
    // status: 'done' (check verde) | 'active' (loader naranja) | 'pending' (guión gris)
    if (status === 'done') {
        return (
            <View style={styles.phaseRow}>
                <Ionicons name="checkmark" size={18} color="#22C55E" />
                <Text style={styles.phaseText}>{label}</Text>
            </View>
        );
    }
    if (status === 'active') {
        return (
            <View style={styles.phaseRow}>
                <ActiveSpinner />
                <Text style={[styles.phaseText, { color: colors.primary }]}>{label}</Text>
            </View>
        );
    }
    return (
        <View style={styles.phaseRow}>
            <Text style={styles.phaseDash}>–</Text>
            <Text style={[styles.phaseText, { color: NAVY_SUB }]}>{label}</Text>
        </View>
    );
}

function ActiveSpinner() {
    // Loader circular naranja rotando (evitamos ActivityIndicator para respetar el color).
    const rot = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        const loop = Animated.loop(
            Animated.timing(rot, {
                toValue: 1,
                duration: 900,
                easing: Easing.linear,
                useNativeDriver: true,
            }),
        );
        loop.start();
        return () => loop.stop();
    }, [rot]);
    const rotate = rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
    return (
        <Animated.View style={{ transform: [{ rotate }] }}>
            <Ionicons name="reload-outline" size={18} color={colors.primary} />
        </Animated.View>
    );
}

export default function NotesAnalysisScreen({ navigation, route }) {
    const { noteId, pageCount = 3 } = route?.params ?? {};

    const [phaseIdx, setPhaseIdx] = useState(0);
    const [successVisible, setSuccessVisible] = useState(false);
    const [ocrErrorVisible, setOcrErrorVisible] = useState(false);
    const [cancelVisible, setCancelVisible] = useState(false);
    const [questionsCount, setQuestionsCount] = useState(0);
    const timersRef = useRef({ timers: [], doneTimer: null });

    useEffect(() => {
        // Si tenemos noteId real, polling al backend cada 1.2s. Si no, timeline mock.
        const backSub = BackHandler.addEventListener('hardwareBackPress', () => {
            setCancelVisible(true);
            return true;
        });

        if (noteId) {
            // Mapeo de status del backend → phaseIdx del UI.
            const phaseOfStatus = {
                'processing_ocr': 0,
                'processing_topics': 1,
                'processing_questions': 2,
                'ready': 3,
                'error': -1,
            };
            let cancelled = false;
            const poll = async () => {
                if (cancelled) return;
                const res = await notesApi.getStatus(noteId);
                const s = res?.data;
                if (s) {
                    const idx = phaseOfStatus[s.status] ?? 0;
                    setPhaseIdx(idx);
                    if (s.status === 'ready') {
                        setQuestionsCount(s.questionsGenerated ?? 0);
                        setSuccessVisible(true);
                        return; // paramos el polling
                    }
                    if (s.status === 'error') {
                        setOcrErrorVisible(true);
                        return;
                    }
                }
                setTimeout(poll, 1200);
            };
            poll();
            return () => {
                cancelled = true;
                backSub.remove();
            };
        }

        // Fallback local (backend no disponible)
        const timers = MOCK_TIMELINE.slice(1).map((step) =>
            setTimeout(() => setPhaseIdx(step.phaseIdx), step.at),
        );
        const doneTimer = setTimeout(() => {
            setQuestionsCount(24);
            setSuccessVisible(true);
        }, 5200);
        timersRef.current = { timers, doneTimer };

        return () => {
            timers.forEach(clearTimeout);
            clearTimeout(doneTimer);
            backSub.remove();
        };
    }, [noteId]); // eslint-disable-line react-hooks/exhaustive-deps

    const stopAllTimers = () => {
        const t = timersRef.current;
        t.timers?.forEach(clearTimeout);
        clearTimeout(t.doneTimer);
    };

    const confirmCancel = () => {
        stopAllTimers();
        setCancelVisible(false);
        navigation.navigate('NotesHome', { toast: 'Análisis cancelado' });
    };

    const getPhaseStatus = (idx) => {
        if (idx < phaseIdx) return 'done';
        if (idx === phaseIdx && phaseIdx < PHASES.length) return 'active';
        return 'pending';
    };

    // Etiqueta del pill: si aún hay fase activa muestra "Digitalizando N páginas...".
    const pillText =
        phaseIdx < PHASES.length
            ? `Digitalizando ${pageCount} ${pageCount === 1 ? 'página' : 'páginas'}...`
            : `¡${pageCount} ${pageCount === 1 ? 'página lista' : 'páginas listas'}!`;

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="light-content" backgroundColor={NAVY} />

            {/* Cancelación en esquina superior derecha */}
            <View style={styles.topBar}>
                <TouchableOpacity
                    onPress={() => setCancelVisible(true)}
                    style={styles.cancelBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityLabel="Cancelar análisis"
                >
                    <Ionicons name="close" size={22} color={colors.white} />
                </TouchableOpacity>
            </View>

            <View style={styles.body}>
                {/* Card central con línea escáner naranja */}
                <ScanCard />

                {/* Pill de estado bajo el card */}
                <StatusPill text={pillText} />

                {/* Lista de 3 fases con checks / loader */}
                <View style={styles.phaseList}>
                    {PHASES.map((p, i) => (
                        <PhaseRow
                            key={p.id}
                            status={getPhaseStatus(i)}
                            label={getPhaseStatus(i) === 'active' ? p.labelActive : p.label}
                        />
                    ))}
                </View>
            </View>

            <AlertCardModal
                visible={cancelVisible}
                iconBg="#FEF3C7"
                icon={<Ionicons name="warning" size={30} color="#F59E0B" />}
                title="¿Cancelar análisis?"
                description="Si sales ahora, tus apuntes no se digitalizarán. Puedes volver a subirlos más tarde."
                primaryLabel="Sí, cancelar"
                primaryColor="#DC2626"
                onPrimaryPress={confirmCancel}
                secondaryLabel="Seguir esperando"
                onSecondaryPress={() => setCancelVisible(false)}
            />

            <NotesOcrErrorModal
                visible={ocrErrorVisible}
                onReview={() => {
                    setOcrErrorVisible(false);
                    navigation.replace('NoteDetail', {
                        noteId: noteId ?? 'mock-note-id',
                        justCreated: true,
                        needsReview: true,
                    });
                }}
                onReupload={() => {
                    setOcrErrorVisible(false);
                    navigation.replace('NotesUpload');
                }}
            />

            <NotesDigitizedModal
                visible={successVisible}
                questionsCount={questionsCount}
                pagesCount={pageCount}
                onStartTest={() => {
                    setSuccessVisible(false);
                    navigation.replace('NotesTestConfig', {
                        noteId: noteId ?? 'mock-note-id',
                    });
                }}
                onViewDocument={() => {
                    setSuccessVisible(false);
                    navigation.replace('NoteDetail', {
                        noteId: noteId ?? 'mock-note-id',
                        justCreated: true,
                    });
                }}
                onRequestClose={() => {
                    setSuccessVisible(false);
                    navigation.replace('NoteDetail', {
                        noteId: noteId ?? 'mock-note-id',
                        justCreated: true,
                    });
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: NAVY,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
    },
    cancelBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    body: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
        gap: spacing.lg,
    },

    // Scan card
    scanCard: {
        width: 180,
        height: 210,
        backgroundColor: NAVY_CARD,
        borderRadius: 20,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.35,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8,
    },
    scanIcon: {
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    scanLine: {
        height: 4,
        borderRadius: 2,
        backgroundColor: NAVY_SUB,
    },
    scanBeam: {
        position: 'absolute',
        left: 12,
        right: 12,
        height: 2,
        backgroundColor: colors.primary,
        borderRadius: 2,
        shadowColor: colors.primary,
        shadowOpacity: 0.9,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 0 },
        elevation: 6,
    },

    // Pill de estado
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: NAVY_PILL,
        paddingLeft: 6,
        paddingRight: 20,
        paddingVertical: 8,
        borderRadius: 24,
    },
    statusPlus: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(242, 101, 53, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusPillText: {
        color: colors.white,
        fontSize: 14,
        fontWeight: '700',
    },

    // Lista de fases
    phaseList: {
        alignSelf: 'stretch',
        gap: spacing.sm + 4,
        marginTop: spacing.md,
        paddingHorizontal: spacing.md,
    },
    phaseRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    phaseText: {
        color: colors.white,
        fontSize: 14,
        fontWeight: '600',
    },
    phaseDash: {
        color: NAVY_SUB,
        fontSize: 20,
        fontWeight: '700',
        width: 18,
        textAlign: 'center',
    },
});
