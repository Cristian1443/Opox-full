import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    StatusBar, ScrollView, PanResponder, Animated, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import ConfirmExitModal from '../../components/ConfirmExitModal';
import { colors } from '../../theme';
import { api, trainingApi, boeApi } from '../../api';
import { adaptGeneratedQuestions } from '../../utils/questionAdapter';

// Icono exacto exportado de Figma para el engranaje. El botón de volver usa
// el mismo patrón (círculo morado @10% + Feather chevron-left) que
// TrainingHomeScreen.js, la referencia por defecto para toda la app.
function IconGear({ size = 22, color = colors.textDark }) {
    return (
        <Svg width={size} height={size} viewBox="740 0 52 55" fill="none">
            <Path d="M789.75 31.0005V23.9205L783.54 23.4005C783.118 21.1364 782.288 18.9678 781.09 17.0005L785.24 12.0005L780.3 7.00055L775.55 11.0705C773.663 9.7728 771.555 8.83066 769.33 8.29055L768.8 1.81055H761.8L761.28 8.09055C759.053 8.5372 756.925 9.38425 755 10.5905L750.1 6.39055L745.16 11.3905L749.16 16.2005C747.871 18.1175 746.939 20.2519 746.41 22.5005L740 23.0005V30.0705L746.21 30.5905C746.63 32.86 747.457 35.0349 748.65 37.0105L744.51 42.0105L749.44 47.0105L754.2 42.9405C756.082 44.2404 758.187 45.1827 760.41 45.7205L761 52.2005H768L768.52 45.9205C770.764 45.4889 772.91 44.6483 774.85 43.4405L779.75 47.6405L784.69 42.6405L780.69 37.8305C781.979 35.9136 782.911 33.7792 783.44 31.5305L789.75 31.0005Z" stroke={color} strokeWidth={3.38} />
            <Path d="M772.62 27.0004C772.6 28.5288 772.129 30.0172 771.266 31.2785C770.402 32.5397 769.185 33.5175 767.767 34.0888C766.349 34.66 764.794 34.7993 763.298 34.4891C761.801 34.1789 760.429 33.433 759.356 32.3452C758.282 31.2575 757.553 29.8765 757.262 28.3759C756.971 26.8754 757.131 25.3223 757.72 23.912C758.309 22.5016 759.303 21.2971 760.575 20.4499C761.847 19.6026 763.341 19.1505 764.87 19.1504C765.894 19.1569 766.907 19.3652 767.851 19.7632C768.795 20.1613 769.651 20.7413 770.371 21.4703C771.09 22.1992 771.659 23.0628 772.045 24.0116C772.431 24.9605 772.627 25.9761 772.62 27.0004Z" stroke={color} strokeWidth={3.38} />
        </Svg>
    );
}

// ─── Constantes de configuración ─────────────────────────────────────────────

const DIFF_STEPS = ['easy', 'medium', 'hard'];
const DIFF_LABELS = ['Fácil', 'Medio', 'Difícil'];

const COUNT_MIN = 10;
const COUNT_MAX = 100;
const COUNT_STEP = 5;

const THUMB = 30;
const THUMB_BORDER = 3;
const TRACK_H = 6;

const DEFAULTS = { difficulty: 'medium', count: 30, timed: true };

// ─── Slider de pasos (Nivel de dificultad) ───────────────────────────────────
function StepSlider({ labels, index, onChange }) {
    const [width, setWidth] = useState(0);
    const usable = Math.max(width - THUMB, 1);
    const startX = useRef(0);
    const [pos, setPos] = useState(0);

    useEffect(() => {
        setPos((index / (labels.length - 1)) * usable);
    }, [index, usable]);

    const responder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderGrant: () => { startX.current = pos; },
            onPanResponderMove: (_, g) => {
                const next = Math.max(0, Math.min(usable, startX.current + g.dx));
                setPos(next);
            },
            onPanResponderRelease: (_, g) => {
                const next = Math.max(0, Math.min(usable, startX.current + g.dx));
                const idx = Math.round((next / usable) * (labels.length - 1));
                onChange(idx);
            },
        })
    ).current;

    const fillWidth = pos + THUMB / 2;

    return (
        <View style={{ marginTop: 18 }}>
            <View style={styles.trackWrapper} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
                <View style={styles.trackBg} />
                <View style={[styles.trackFill, { width: fillWidth }]} />
                <View {...responder.panHandlers} style={[styles.thumb, { left: pos }]} />
            </View>

            <View style={styles.stepLabelsRow}>
                {labels.map((label, i) => (
                    <Text key={label} style={i === index ? styles.stepLabelActive : styles.stepLabelEdge}>
                        {label}
                    </Text>
                ))}
            </View>
        </View>
    );
}

// ─── Slider numérico (Número de preguntas) ───────────────────────────────────
function RangeSlider({ min, max, step, value, onChange }) {
    const [width, setWidth] = useState(0);
    const usable = Math.max(width - THUMB, 1);
    const startX = useRef(0);
    const [pos, setPos] = useState(0);

    const valueToPos = (v) => ((v - min) / (max - min)) * usable;
    const posToValue = (p) => {
        const raw = min + (p / usable) * (max - min);
        return Math.round(raw / step) * step;
    };

    useEffect(() => setPos(valueToPos(value)), [value, usable]);

    const responder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderGrant: () => { startX.current = pos; },
            onPanResponderMove: (_, g) => {
                const next = Math.max(0, Math.min(usable, startX.current + g.dx));
                setPos(next);
            },
            onPanResponderRelease: (_, g) => {
                const next = Math.max(0, Math.min(usable, startX.current + g.dx));
                onChange(posToValue(next));
            },
        })
    ).current;

    const fillWidth = pos + THUMB / 2;

    return (
        <View style={styles.rangeRow}>
            <View style={[styles.trackWrapper, { flex: 1 }]} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
                <View style={styles.trackBg} />
                <View style={[styles.trackFill, { width: fillWidth }]} />
                <View {...responder.panHandlers} style={[styles.thumb, { left: pos }]} />
            </View>

            <View style={styles.badge}>
                <Text style={styles.badgeText}>{value}</Text>
            </View>
        </View>
    );
}

// ─── Toggle (Control de fatiga) ──────────────────────────────────────────────
function FatigueToggle({ value, onValueChange }) {
    const TRACK_W = 60;
    const TRACK_H2 = 28;
    const KNOB = 22;
    const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(anim, { toValue: value ? 1 : 0, duration: 160, useNativeDriver: false }).start();
    }, [value]);

    const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [3, TRACK_W - KNOB - 3] });

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onValueChange(!value)}
            style={[
                styles.toggleTrack,
                {
                    width: TRACK_W,
                    height: TRACK_H2,
                    borderRadius: TRACK_H2 / 2,
                    backgroundColor: COLORS.toggleOff,
                },
            ]}
        >
            <Animated.View
                style={[
                    styles.toggleKnob,
                    {
                        width: KNOB,
                        height: KNOB,
                        borderRadius: KNOB / 2,
                        transform: [{ translateX }],
                        backgroundColor: value ? COLORS.purple : COLORS.purpleBorder50,
                    },
                ]}
            />
        </TouchableOpacity>
    );
}

const TTL_WARN_MS  = 30_000;
const TTL_KILL_MS  = 240_000;

// ─── Pantalla 6.2 · Generador infinito ───────────────────────────────────────
export default function GeneratorConfigScreen({ navigation, route }) {
    // Cuando se llega desde un reto de clan, estos params vienen precargados.
    const {
        challengeId = null,
        clanId: challengeClanId = null,
        topicId: challengeTopicId = null,
        questionCount: challengeQuestionCount = null,
        taskId = null,
    } = route?.params ?? {};

    const isChallengeMode = !!challengeId;

    const [difficulty, setDifficulty] = useState(DEFAULTS.difficulty);
    const [count, setCount] = useState(challengeQuestionCount ?? DEFAULTS.count);
    const [fatigueMode, setFatigueMode] = useState(DEFAULTS.timed);

    // Multi-selección de temas — 'all' es el valor especial "Todos los temas"
    const [selectedTopicIds, setSelectedTopicIds] = useState(
        challengeTopicId ? new Set([challengeTopicId]) : new Set(['all'])
    );
    const [topics, setTopics] = useState([]);
    const [topicOpen, setTopicOpen] = useState(!isChallengeMode); // cerrado en modo reto

    const [exitOpen, setExitOpen] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [slowWarning, setSlowWarning] = useState(false);
    const [generateError, setGenerateError] = useState(false);

    const cancelledRef = useRef(false);
    const allowExitRef = useRef(false);
    const warnTimerRef = useRef(null);
    const killTimerRef = useRef(null);

    const hasChanges =
        difficulty !== DEFAULTS.difficulty ||
        count !== DEFAULTS.count ||
        fatigueMode !== DEFAULTS.timed;

    const handleBack = () => {
        if (hasChanges) setExitOpen(true);
        else navigation.goBack();
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e) => {
            if (!hasChanges || allowExitRef.current) return;
            e.preventDefault();
            setExitOpen(true);
        });
        return unsubscribe;
    }, [navigation, hasChanges]);

    useEffect(() => {
        (async () => {
            const session = await api.loadSession();
            const oposicion =
                session?.user?.oposicion ??
                session?.user?.user_metadata?.oposicion ??
                'justicia-tramitacion';
            let res = await boeApi.listTopics(oposicion);
            if (!res?.data?.length && oposicion !== 'justicia-tramitacion') {
                res = await boeApi.listTopics('justicia-tramitacion');
            }
            if (res?.data?.length) {
                setTopics(res.data);
            }
        })();
    }, []);

    // Limpiar timers si el componente se desmonta durante la generación
    useEffect(() => () => {
        clearTimeout(warnTimerRef.current);
        clearTimeout(killTimerRef.current);
    }, []);

    const confirmLeave = () => {
        allowExitRef.current = true;
        setExitOpen(false);
        navigation.goBack();
    };

    function toggleTopic(id) {
        setSelectedTopicIds(prev => {
            const next = new Set(prev);
            if (id === 'all') {
                return new Set(['all']);
            }
            next.delete('all');
            if (next.has(id)) {
                next.delete(id);
                if (next.size === 0) return new Set(['all']);
            } else {
                next.add(id);
            }
            return next;
        });
    }

    const generate = async () => {
        if (generating) return;

        setGenerating(true);
        setSlowWarning(false);
        setGenerateError(false);
        cancelledRef.current = false;

        warnTimerRef.current = setTimeout(() => {
            if (!cancelledRef.current) setSlowWarning(true);
        }, TTL_WARN_MS);

        killTimerRef.current = setTimeout(() => {
            cancelledRef.current = true;
            setGenerating(false);
            setSlowWarning(false);
            setGenerateError(true);
        }, TTL_KILL_MS);

        try {
            const session = await api.loadSession();
            const oposicion =
                session?.user?.oposicion ??
                session?.user?.user_metadata?.oposicion ??
                'justicia-tramitacion';

            const backendTopicId =
                selectedTopicIds.has('all') || selectedTopicIds.size === topics.length
                    ? 'all'
                    : [...selectedTopicIds].join(',');

            const { data, error } = await trainingApi.generateQuestions({
                oposicion,
                topicId: backendTopicId,
                difficulty,
                count,
            });

            clearTimeout(warnTimerRef.current);
            clearTimeout(killTimerRef.current);

            if (cancelledRef.current) return;

            setGenerating(false);
            setSlowWarning(false);

            if (error || !Array.isArray(data) || data.length === 0) {
                setGenerateError(true);
                return;
            }

            allowExitRef.current = true;
            navigation.navigate('TrainingSession', {
                source: 'generator',
                questions: adaptGeneratedQuestions(data),
                examTitle: isChallengeMode ? 'Reto de clan' : 'Generador infinito',
                timedMode: fatigueMode,
                oposicion,
                ...(challengeId && { challengeId }),
                ...(challengeClanId && { clanId: challengeClanId }),
                ...(taskId && { taskId }),
            });
        } catch {
            clearTimeout(warnTimerRef.current);
            clearTimeout(killTimerRef.current);
            if (!cancelledRef.current) {
                setGenerating(false);
                setSlowWarning(false);
                setGenerateError(true);
            }
        }
    };

    const diffIdx = DIFF_STEPS.indexOf(difficulty);

    const selectionLabel = selectedTopicIds.has('all')
        ? 'Todos los temas'
        : `${selectedTopicIds.size} tema${selectedTopicIds.size > 1 ? 's' : ''} seleccionado${selectedTopicIds.size > 1 ? 's' : ''}`;

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Header */}
                <View style={styles.headerRow}>
                    <TouchableOpacity style={styles.backButton} onPress={handleBack} hitSlop={12}>
                        <Feather name="chevron-left" size={22} color={COLORS.purple} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle} numberOfLines={1}>Zona de entrenamiento</Text>
                    <TouchableOpacity style={styles.settingsButton} hitSlop={12} onPress={() => navigation.navigate('Settings')}>
                        <IconGear size={20} color={COLORS.purple} />
                    </TouchableOpacity>
                </View>
                <Text style={styles.headerSubtitle}>Generador infinito</Text>

                <View style={styles.divider} />

                {/* Nivel de dificultad */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Nivel de dificultad</Text>
                    <Text style={styles.sectionDesc}>Selecciona el nivel de dificultad de tus pruebas</Text>
                    <StepSlider
                        labels={DIFF_LABELS}
                        index={diffIdx}
                        onChange={(i) => setDifficulty(DIFF_STEPS[i])}
                    />
                </View>

                <View style={styles.divider} />

                {/* Número de preguntas */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Número de preguntas</Text>
                    <Text style={styles.sectionDesc}>Selecciona el número de preguntas por test</Text>
                    <RangeSlider
                        min={COUNT_MIN}
                        max={COUNT_MAX}
                        step={COUNT_STEP}
                        value={count}
                        onChange={setCount}
                    />
                </View>

                <View style={styles.divider} />

                {/* Control de fatiga */}
                <View style={[styles.section, styles.rowBetween]}>
                    <View style={{ flex: 1, paddingRight: 16 }}>
                        <Text style={[styles.sectionTitle, { textAlign: 'left' }]}>Control de fatiga</Text>
                        <Text style={[styles.sectionDesc, { textAlign: 'left' }]}>Monitoreo continuo de tus constantes vitales</Text>
                    </View>
                    <FatigueToggle value={fatigueMode} onValueChange={setFatigueMode} />
                </View>

                <View style={styles.divider} />

                {/* Temario — multi-selección */}
                <View style={styles.temarioCard}>
                    <TouchableOpacity
                        style={styles.temarioHeader}
                        activeOpacity={0.7}
                        onPress={() => setTopicOpen((v) => !v)}
                    >
                        <View>
                            <Text style={styles.temarioLabel}>Temario</Text>
                            <Text style={styles.temarioSublabel}>{selectionLabel}</Text>
                        </View>
                        <Ionicons
                            name={topicOpen ? 'chevron-up' : 'chevron-down'}
                            size={18}
                            color={COLORS.purple}
                        />
                    </TouchableOpacity>

                    {topicOpen && (
                        <View style={styles.temarioList}>
                            {topics.length === 0 ? (
                                <ActivityIndicator
                                    size="small"
                                    color={COLORS.purple}
                                    style={{ marginVertical: 12 }}
                                />
                            ) : (
                                <>
                                    {/* Opción "Todos los temas" */}
                                    <TouchableOpacity
                                        onPress={() => toggleTopic('all')}
                                        style={[styles.topicItem, selectedTopicIds.has('all') && styles.topicItemActive]}
                                    >
                                        <View style={styles.topicRow}>
                                            <Text style={[styles.topicText, selectedTopicIds.has('all') && styles.topicTextActive]}>
                                                Todos los temas
                                            </Text>
                                            {selectedTopicIds.has('all') && (
                                                <Ionicons name="checkmark" size={16} color={COLORS.purple} />
                                            )}
                                        </View>
                                    </TouchableOpacity>

                                    <View style={styles.topicDivider} />

                                    {topics.map((t) => {
                                        const active = selectedTopicIds.has(t.topicId);
                                        return (
                                            <TouchableOpacity
                                                key={t.id}
                                                onPress={() => toggleTopic(t.topicId)}
                                                style={[styles.topicItem, active && styles.topicItemActive]}
                                            >
                                                <View style={styles.topicRow}>
                                                    <Text style={[styles.topicText, active && styles.topicTextActive, { flex: 1 }]}>
                                                        {t.label}
                                                    </Text>
                                                    {active && (
                                                        <Ionicons name="checkmark" size={16} color={COLORS.purple} />
                                                    )}
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </>
                            )}
                        </View>
                    )}
                </View>

                {/* Botón generar / estado error */}
                {generateError ? (
                    <View style={styles.errorCard}>
                        <Ionicons name="alert-circle-outline" size={22} color="#C0392B" />
                        <Text style={styles.errorText}>
                            La IA tardó demasiado o encontró un error. Inténtalo de nuevo.
                        </Text>
                        <TouchableOpacity
                            style={styles.retryBtn}
                            onPress={() => { setGenerateError(false); generate(); }}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.retryBtnText}>Reintentar</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <TouchableOpacity
                            style={[styles.button, generating && { opacity: 0.7 }]}
                            onPress={generate}
                            activeOpacity={0.85}
                            disabled={generating}
                        >
                            {generating ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <ActivityIndicator color="#fff" size="small" />
                                    <Text style={styles.buttonText}>
                                        {slowWarning ? 'La IA está pensando…' : 'Generando preguntas…'}
                                    </Text>
                                </View>
                            ) : (
                                <Text style={styles.buttonText}>Generar test</Text>
                            )}
                        </TouchableOpacity>

                        {slowWarning && (
                            <View style={styles.slowWarningRow}>
                                <Ionicons name="time-outline" size={14} color={COLORS.grayText} />
                                <Text style={styles.slowWarningText}>
                                    Esto está tardando más de lo normal. Por favor espera…
                                </Text>
                            </View>
                        )}
                    </>
                )}
            </ScrollView>

            <ConfirmExitModal
                visible={exitOpen}
                onStay={() => setExitOpen(false)}
                onLeave={confirmLeave}
            />
        </SafeAreaView>
    );
}

/* ------------------------------------------------------------------ */
/*  DESIGN TOKENS — extraídos directamente del archivo Figma          */
/* ------------------------------------------------------------------ */
const COLORS = {
    purple: colors.textDark,
    purpleBorder30: 'rgba(65,41,80,0.3)',
    purpleBorder50: 'rgba(65,41,80,0.5)',
    orange: colors.accentOrange,
    orangeBg15: 'rgba(246,150,36,0.15)',
    green: colors.ctaGreen,
    grayText: 'rgba(52,58,61,0.55)',
    toggleOff: '#EFEFEF',
    divider: '#ECECEC',
    white: colors.white,
    black: '#000000',
};

const FONTS = {
    light: 'Poppins-Light',
    regular: 'Poppins-Regular',
    medium: 'Poppins-Medium',
    semiBold: 'Poppins-SemiBold',
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.white },
    scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },

    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(65, 41, 80, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingsButton: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        flex: 1,
        fontFamily: FONTS.semiBold,
        fontSize: 20,
        color: COLORS.purple,
        marginLeft: 12,
    },
    headerSubtitle: {
        fontFamily: FONTS.light,
        fontSize: 20,
        color: COLORS.purple,
        textAlign: 'center',
        marginTop: 2,
    },

    divider: {
        height: 1,
        backgroundColor: COLORS.divider,
        marginVertical: 18,
    },

    section: { width: '100%' },
    rowBetween: { flexDirection: 'row', alignItems: 'flex-start' },

    sectionTitle: {
        fontFamily: FONTS.semiBold,
        fontSize: 19,
        color: COLORS.purple,
        marginBottom: 4,
        textAlign: 'center',
    },
    sectionDesc: {
        fontFamily: FONTS.regular,
        fontSize: 13,
        color: COLORS.grayText,
        lineHeight: 17,
        textAlign: 'center',
    },

    /* Slider genérico */
    trackWrapper: { height: THUMB, justifyContent: 'center' },
    trackBg: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: TRACK_H,
        borderRadius: TRACK_H / 2,
        backgroundColor: COLORS.orangeBg15,
    },
    trackFill: {
        position: 'absolute',
        left: 0,
        height: TRACK_H,
        borderRadius: TRACK_H / 2,
        backgroundColor: COLORS.orange,
    },
    thumb: {
        position: 'absolute',
        width: THUMB,
        height: THUMB,
        borderRadius: THUMB / 2,
        backgroundColor: COLORS.white,
        borderWidth: THUMB_BORDER,
        borderColor: COLORS.purple,
    },

    stepLabelsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    stepLabelEdge: {
        fontFamily: FONTS.regular,
        fontSize: 12,
        color: COLORS.black,
    },
    stepLabelActive: {
        fontFamily: FONTS.medium,
        fontSize: 12,
        color: COLORS.black,
    },

    rangeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 18 },
    badge: {
        marginLeft: 14,
        minWidth: 48,
        height: 30,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.purpleBorder30,
        backgroundColor: 'rgba(255,255,255,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    badgeText: {
        fontFamily: FONTS.semiBold,
        fontSize: 14,
        color: COLORS.purple,
    },

    /* Toggle */
    toggleTrack: {
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.purpleBorder50,
    },
    toggleKnob: {
        position: 'absolute',
    },

    /* Temario */
    temarioCard: {
        marginTop: 4,
        backgroundColor: '#F5F5F5',
        borderWidth: 1,
        borderColor: COLORS.purpleBorder30,
        borderRadius: 14,
        overflow: 'hidden',
    },
    temarioHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    temarioLabel: {
        fontFamily: FONTS.medium,
        fontSize: 16,
        color: COLORS.purple,
    },
    temarioSublabel: {
        fontFamily: FONTS.regular,
        fontSize: 12,
        color: COLORS.grayText,
        marginTop: 1,
    },
    temarioList: {
        paddingHorizontal: 8,
        paddingBottom: 8,
    },
    topicItem: {
        paddingVertical: 11,
        paddingHorizontal: 12,
        borderRadius: 10,
        marginBottom: 2,
    },
    topicItemActive: {
        backgroundColor: COLORS.orangeBg15,
    },
    topicRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    topicDivider: {
        height: 1,
        backgroundColor: COLORS.divider,
        marginVertical: 4,
        marginHorizontal: 4,
    },
    topicText: {
        fontFamily: FONTS.regular,
        fontSize: 14,
        color: COLORS.black,
    },
    topicTextActive: {
        fontFamily: FONTS.medium,
        color: COLORS.purple,
    },

    /* Botón */
    button: {
        marginTop: 28,
        height: 56,
        borderRadius: 16,
        backgroundColor: COLORS.green,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontFamily: FONTS.semiBold,
        fontSize: 16,
        color: COLORS.white,
    },

    /* TTL — aviso de lentitud */
    slowWarningRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 10,
        justifyContent: 'center',
    },
    slowWarningText: {
        fontFamily: FONTS.regular,
        fontSize: 12,
        color: COLORS.grayText,
    },

    /* Error de generación */
    errorCard: {
        marginTop: 28,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#F5C6C0',
        backgroundColor: '#FFF5F5',
        padding: 16,
        alignItems: 'center',
        gap: 10,
    },
    errorText: {
        fontFamily: FONTS.regular,
        fontSize: 14,
        color: '#C0392B',
        textAlign: 'center',
        lineHeight: 20,
    },
    retryBtn: {
        marginTop: 4,
        paddingHorizontal: 28,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: COLORS.green,
    },
    retryBtnText: {
        fontFamily: FONTS.semiBold,
        fontSize: 15,
        color: COLORS.white,
    },
});
