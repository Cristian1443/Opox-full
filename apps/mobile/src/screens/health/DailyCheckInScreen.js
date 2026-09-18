// Bloque 3 · Salud — Pantalla · Check-in diario
// 30 segundos · mood 1-10 (slider) + horas de sueño (stepper) + energía
// (pills) + factores (chips opcionales).
// Upsert idempotente por día — si abre otra vez, se pre-cargan los valores.
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Text from '../../components/AppText';
import HealthScreenHeader from '../../components/HealthScreenHeader';
import AccentSlider from '../../components/AccentSlider';
import { colors, spacing } from '../../theme';
import {
    dailyCheckInApi,
    CHECKIN_FACTORS,
    CHECKIN_FACTOR_LABELS,
    moodLabel,
} from '../../api';

const FIGMA = {
    cardBorder: 'rgba(65,41,80,0.3)',
    cardFill: 'rgba(255,255,255,0.5)',
    subtitleMuted: 'rgba(65,41,80,0.5)',
    energyLow: '#FF2638',
    energyMed: '#F69624',
    energyHigh: '#24bd90',
};

const SLEEP_MIN = 4;
const SLEEP_MAX = 10;
const SLEEP_STEP = 0.5;

function todayLocalIso() {
    return new Date().toLocaleDateString('sv');
}

function longDate(iso) {
    const d = new Date(`${iso}T00:00:00`);
    return d.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });
}

export default function DailyCheckInScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [existing, setExisting] = useState(false);

    const [mood, setMood] = useState(7);           // 1-10
    const [sleep, setSleep] = useState(7.5);       // horas
    const [energy, setEnergy] = useState('medium'); // low|medium|high
    const [factors, setFactors] = useState([]);

    const localDate = useMemo(() => todayLocalIso(), []);

    // Cargar el check-in del día si ya existe (modo edición)
    useEffect(() => {
        let cancelled = false;
        (async () => {
            const res = await dailyCheckInApi.getForDate(localDate);
            if (cancelled) return;
            const data = res?.data?.checkin;
            if (data) {
                setMood(clamp(Number(data.moodScore), 1, 10));
                setSleep(clamp(Number(data.sleepHours), SLEEP_MIN, SLEEP_MAX));
                setEnergy(['low','medium','high'].includes(data.energyLevel) ? data.energyLevel : 'medium');
                setFactors(Array.isArray(data.factors) ? data.factors : []);
                setExisting(true);
            }
            setLoading(false);
        })();
        return () => { cancelled = true; };
    }, [localDate]);

    const toggleFactor = useCallback((factor) => {
        setFactors((prev) => prev.includes(factor)
            ? prev.filter((f) => f !== factor)
            : [...prev, factor]);
    }, []);

    const handleSave = useCallback(async () => {
        if (saving) return;
        setSaving(true);
        const res = await dailyCheckInApi.save({
            localDate,
            moodScore: mood,
            sleepHours: sleep,
            energyLevel: energy,
            factors,
        });
        setSaving(false);
        if (res?.error) {
            Alert.alert('No se pudo guardar', res.error.message ?? 'Inténtalo de nuevo.');
            return;
        }
        navigation.goBack();
    }, [saving, localDate, mood, sleep, energy, factors, navigation]);

    const { emoji, label } = moodLabel(mood);

    return (
        <SafeAreaView style={styles.container} edges={['top','left','right']}>
            <StatusBar barStyle="dark-content" />
            <HealthScreenHeader
                title="Estado del día"
                subtitle={capitalize(longDate(localDate))}
                onBack={() => navigation.goBack()}
            />

            {loading ? (
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="large" color={colors.ctaGreen} />
                </View>
            ) : (
                <>
                    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                        {/* ── ¿Cómo te sientes hoy? ─────────────────────────── */}
                        <Text style={styles.sectionTitle}>¿Cómo te sientes hoy?</Text>

                        <View style={styles.moodBadge}>
                            <Text style={styles.moodEmoji}>{emoji}</Text>
                        </View>

                        <View style={{ paddingHorizontal: spacing.md, marginTop: spacing.md }}>
                            <AccentSlider
                                steps={10}
                                valueIdx={mood - 1}
                                onChange={(idx) => setMood(idx + 1)}
                                accentColor={colors.accentOrange}
                                trackColor="#E5E7EB"
                            />
                            <View style={styles.sliderScale}>
                                <Text style={styles.scaleTick}>1</Text>
                                <Text style={styles.scaleTick}>10</Text>
                            </View>
                        </View>

                        <Text style={styles.moodLabel}>«{label}»</Text>

                        <View style={styles.divider} />

                        {/* ── Horas de sueño ────────────────────────────────── */}
                        <Text style={styles.sectionTitleSmall}>💤 ¿Cuántas horas dormiste?</Text>

                        <View style={styles.stepperRow}>
                            <StepperBtn
                                label="−"
                                disabled={sleep <= SLEEP_MIN}
                                onPress={() => setSleep((s) => Math.max(SLEEP_MIN, +(s - SLEEP_STEP).toFixed(1)))}
                            />
                            <View style={styles.stepperValueWrap}>
                                <Text style={styles.stepperValue}>{sleep} h</Text>
                            </View>
                            <StepperBtn
                                label="+"
                                disabled={sleep >= SLEEP_MAX}
                                onPress={() => setSleep((s) => Math.min(SLEEP_MAX, +(s + SLEEP_STEP).toFixed(1)))}
                            />
                        </View>

                        <View style={styles.sleepBarWrap}>
                            <View style={styles.sleepBarBg}>
                                <View style={[styles.sleepBarFill, {
                                    width: `${((sleep - SLEEP_MIN) / (SLEEP_MAX - SLEEP_MIN)) * 100}%`,
                                    backgroundColor: sleep >= 7 ? colors.ctaGreen : sleep >= 5.5 ? colors.accentOrange : colors.statRed,
                                }]} />
                            </View>
                            <View style={styles.sleepBarLabels}>
                                <Text style={styles.scaleTick}>menos</Text>
                                <Text style={styles.scaleTick}>óptimo</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        {/* ── Nivel de energía ──────────────────────────────── */}
                        <Text style={styles.sectionTitleSmall}>⚡ Nivel de energía</Text>

                        <View style={styles.pillsRow}>
                            <EnergyPill label="Baja"  color={FIGMA.energyLow}  active={energy === 'low'}    onPress={() => setEnergy('low')} />
                            <EnergyPill label="Media" color={FIGMA.energyMed}  active={energy === 'medium'} onPress={() => setEnergy('medium')} />
                            <EnergyPill label="Alta"  color={FIGMA.energyHigh} active={energy === 'high'}   onPress={() => setEnergy('high')} />
                        </View>

                        <View style={styles.divider} />

                        {/* ── Factores (opcional) ───────────────────────────── */}
                        <Text style={styles.sectionTitleSmall}>Factores de hoy (opcional)</Text>

                        <View style={styles.chipsWrap}>
                            {CHECKIN_FACTORS.map((factor) => {
                                const active = factors.includes(factor);
                                return (
                                    <TouchableOpacity
                                        key={factor}
                                        onPress={() => toggleFactor(factor)}
                                        style={[styles.chip, active && styles.chipActive]}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.chipText, active && styles.chipTextActive]}>
                                            {CHECKIN_FACTOR_LABELS[factor]}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <View style={{ height: spacing.lg }} />
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[styles.cta, saving && { opacity: 0.6 }]}
                            onPress={handleSave}
                            activeOpacity={0.85}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator size="small" color={colors.white} />
                            ) : (
                                <Text style={styles.ctaText}>
                                    {existing ? 'Actualizar mi estado' : 'Guardar mi estado'}
                                </Text>
                            )}
                        </TouchableOpacity>
                        <Text style={styles.footerNote}>« Solo te toma 20 segundos »</Text>
                    </View>
                </>
            )}
        </SafeAreaView>
    );
}

function StepperBtn({ label, onPress, disabled }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled}
            style={[styles.stepperBtn, disabled && { opacity: 0.35 }]}
            activeOpacity={0.7}
        >
            <Text style={styles.stepperBtnText}>{label}</Text>
        </TouchableOpacity>
    );
}

function EnergyPill({ label, color, active, onPress }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[styles.pill, active && { borderColor: color, backgroundColor: color + '20' }]}
            activeOpacity={0.7}
        >
            <Text style={[styles.pillText, active && { color, fontFamily: 'Poppins-SemiBold' }]}>
                {label}
            </Text>
        </TouchableOpacity>
    );
}

function clamp(n, min, max) {
    if (!Number.isFinite(n)) return min;
    return Math.max(min, Math.min(max, n));
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.white },
    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scroll: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.lg,
    },

    sectionTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 21,
        color: colors.textDark,
        textAlign: 'center',
        marginTop: spacing.md,
    },
    sectionTitleSmall: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 15,
        color: colors.textDark,
        marginBottom: spacing.md,
    },

    moodBadge: {
        alignSelf: 'center',
        width: 108,
        height: 108,
        borderRadius: 54,
        backgroundColor: 'rgba(128,76,201,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.md,
    },
    moodEmoji: {
        fontSize: 66,
        lineHeight: 78,
    },
    moodLabel: {
        marginTop: 6,
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
        color: FIGMA.subtitleMuted,
        textAlign: 'center',
    },
    sliderScale: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 6,
    },
    scaleTick: {
        fontFamily: 'Poppins-Regular',
        fontSize: 11,
        color: FIGMA.subtitleMuted,
    },

    divider: {
        height: 1,
        backgroundColor: FIGMA.cardBorder,
        marginVertical: spacing.lg,
    },

    stepperRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    stepperBtn: {
        width: 56, height: 56, borderRadius: 28,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: FIGMA.cardBorder,
    },
    stepperBtnText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 26,
        color: colors.accentOrange,
    },
    stepperValueWrap: { flex: 1, alignItems: 'center' },
    stepperValue: {
        fontFamily: 'Poppins-Bold',
        fontSize: 32,
        color: colors.textDark,
    },
    sleepBarWrap: { paddingHorizontal: spacing.sm },
    sleepBarBg: {
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E5E7EB',
        overflow: 'hidden',
    },
    sleepBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    sleepBarLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 6,
    },

    pillsRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    pill: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: FIGMA.cardBorder,
        backgroundColor: FIGMA.cardFill,
        alignItems: 'center',
    },
    pillText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
        color: colors.textDark,
    },

    chipsWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    chip: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: FIGMA.cardBorder,
        backgroundColor: FIGMA.cardFill,
    },
    chipActive: {
        borderColor: colors.bannerPurple,
        backgroundColor: 'rgba(128,76,201,0.12)',
    },
    chipText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 12.5,
        color: colors.textDark,
    },
    chipTextActive: {
        fontFamily: 'Poppins-SemiBold',
        color: colors.bannerPurple,
    },

    footer: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
        borderTopWidth: 1,
        borderTopColor: FIGMA.cardBorder,
        backgroundColor: colors.white,
    },
    cta: {
        height: 56,
        borderRadius: 14,
        backgroundColor: colors.ctaGreen,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ctaText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: colors.white,
    },
    footerNote: {
        marginTop: 6,
        textAlign: 'center',
        fontFamily: 'Poppins-Regular',
        fontSize: 11,
        color: FIGMA.subtitleMuted,
    },
});
