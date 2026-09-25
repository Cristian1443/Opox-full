// Bloque 3 · Salud — Pantalla 3.4b · Motor de fatiga
import React, { useState, useEffect } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import Text from '../../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, spacing } from '../../theme';
import HealthScreenHeader from '../../components/HealthScreenHeader';
import { healthApi, dailyCheckInApi, moodLabel } from '../../api';

export const FATIGUE_LEVEL_KEY = 'opox.health.fatigueLevel';

// Colores confirmados contra Figma (frame MOTOR DE FATIGA, Bloque 3) sin
// equivalente exacto en theme.js.
const FIGMA = {
    textNote: '#343A3D',
    separator: 'rgba(65,41,80,0.5)',
    featuredBgHigh: '#FF2638',
    featuredBgLow: '#5FD9A4',
    unknownBadge: '#A7ADB8',
};

// Construye las señales del motor combinando métricas del wearable (HealthKit/
// Health Connect) con las señales manuales del check-in diario. Cuando NO hay
// wearable, el check-in aporta mood y energía percibida — así el usuario ve
// un diagnóstico real (no todo en gris "Sin datos").
//
// Sleep prefiere wearable > check-in.
function buildSignals(metrics, checkin) {
    const hrv = metrics?.hrv;
    const restHr = metrics?.restingHeartRate;
    const spo2 = metrics?.spo2;
    // Forzar numérico: HealthKit/HC pueden devolver objetos en algunas versiones.
    const rawSleep = metrics?.sleepHours;
    const wearableSleep = rawSleep != null && !Number.isNaN(+rawSleep) ? +rawSleep : null;
    const checkinSleep = checkin?.sleepHours != null ? Number(checkin.sleepHours) : null;
    const sleep = wearableSleep ?? checkinSleep;
    const mood = checkin?.moodScore != null ? Number(checkin.moodScore) : null;
    const perceivedEnergy = checkin?.energyLevel ?? null;
    const factors = Array.isArray(checkin?.factors) ? checkin.factors : [];

    const HRV_BASE = 50;
    const HR_BASE = 61;

    const signals = [
        {
            id: 1,
            label: 'HRV por debajo de tu base',
            note: 'Señal principal',
            value: hrv != null ? `${hrv}/${HRV_BASE}` : 'Requiere wearable',
            status: hrv == null ? 'unknown' : hrv < HRV_BASE ? 'alert' : 'ok',
            severity: hrv == null ? 'unknown' : hrv < HRV_BASE * 0.8 ? 'critical' : hrv < HRV_BASE ? 'warning' : 'ok',
        },
        {
            id: 2,
            label: 'FC reposo elevada',
            note: 'Cuerpo no recuperado',
            value: restHr != null ? `${restHr > HR_BASE ? '+' : ''}${restHr - HR_BASE}` : 'Requiere wearable',
            status: restHr == null ? 'unknown' : restHr > HR_BASE ? 'alert' : 'ok',
            severity: restHr == null ? 'unknown' : restHr > HR_BASE + 6 ? 'critical' : restHr > HR_BASE ? 'warning' : 'ok',
        },
    ];

    // Estrés: HRV (wearable) prioritario; fallback al mood inverso del check-in.
    if (hrv != null) {
        signals.push({
            id: 3,
            label: 'Estrés sostenido en la sesión',
            note: 'Derivado de HRV',
            value: hrv < 40 ? 'Alto' : hrv < 55 ? 'Medio' : 'Bajo',
            status: hrv < 55 ? 'alert' : 'ok',
            severity: hrv < 40 ? 'critical' : hrv < 55 ? 'warning' : 'ok',
        });
    } else if (mood != null) {
        signals.push({
            id: 3,
            label: 'Estrés estimado',
            note: 'Según Estado del día',
            value: mood <= 3 ? 'Alto' : mood <= 6 ? 'Medio' : 'Bajo',
            status: mood <= 5 ? 'alert' : 'ok',
            severity: mood <= 3 ? 'critical' : mood <= 5 ? 'warning' : 'ok',
        });
    } else {
        signals.push({
            id: 3,
            label: 'Estrés sostenido',
            value: 'Sin datos',
            status: 'unknown',
            severity: 'unknown',
        });
    }

    // Energía: SpO2 (wearable) prioritario; fallback a energía percibida del check-in.
    if (spo2 != null) {
        signals.push({
            id: 4,
            label: 'Energía corporal',
            note: 'Derivado de SpO₂',
            value: spo2 >= 95 ? 'OK' : 'Baja',
            status: spo2 >= 95 ? 'ok' : 'alert',
            severity: spo2 >= 95 ? 'ok' : 'warning',
        });
    } else if (perceivedEnergy) {
        const map = { low: 'Baja', medium: 'Media', high: 'Alta' };
        const sev = perceivedEnergy === 'low' ? 'warning' : 'ok';
        signals.push({
            id: 4,
            label: 'Energía percibida',
            note: 'Según Estado del día',
            value: map[perceivedEnergy] ?? '—',
            status: perceivedEnergy === 'low' ? 'alert' : 'ok',
            severity: sev,
        });
    } else {
        signals.push({
            id: 4,
            label: 'Energía corporal',
            value: 'Sin datos',
            status: 'unknown',
            severity: 'unknown',
        });
    }

    // Sueño: wearable > check-in.
    signals.push({
        id: 5,
        label: 'Sueño noche anterior',
        note: wearableSleep == null && checkinSleep != null ? 'De tu Estado del día' : undefined,
        value: sleep != null ? `${sleep}h` : 'Sin datos',
        status: sleep == null ? 'unknown' : sleep >= 7 ? 'ok' : 'alert',
        severity: sleep == null ? 'unknown' : sleep >= 7 ? 'ok' : sleep >= 5.5 ? 'warning' : 'critical',
    });

    // Cómo te sientes hoy — señal derivada exclusivamente del check-in.
    if (mood != null) {
        const { emoji, label } = moodLabel(mood);
        signals.push({
            id: 6,
            label: 'Cómo te sientes hoy',
            note: 'De tu Estado del día',
            value: `${emoji} ${mood}/10`,
            status: mood <= 4 ? 'alert' : 'ok',
            severity: mood <= 3 ? 'critical' : mood <= 5 ? 'warning' : 'ok',
            _customLabel: label,
        });
    }

    // Factores negativos declarados en el check-in.
    const NEGATIVE = new Set(['estres','mala_noche','ansiedad_examen','dolor_cabeza','vista_cansada','digestion']);
    const negFactors = factors.filter((f) => NEGATIVE.has(f));
    if (negFactors.length > 0) {
        signals.push({
            id: 7,
            label: 'Factores que restan hoy',
            note: 'De tu Estado del día',
            value: `${negFactors.length} activo${negFactors.length === 1 ? '' : 's'}`,
            status: 'alert',
            severity: negFactors.length >= 3 ? 'critical' : negFactors.length >= 2 ? 'warning' : 'ok',
        });
    }

    return signals;
}

function DotIcon({ size = 18, color = colors.white }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Circle cx={12} cy={12} r={7} fill={color} />
        </Svg>
    );
}

function CheckMarkIcon({ size = 18, color = colors.white }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M4 13l5 5L20 6" stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function SignalRow({ signal, isFirst }) {
    const badgeColor = signal.status === 'alert' ? colors.statRed : signal.status === 'unknown' ? FIGMA.unknownBadge : colors.ctaGreen;

    return (
        <View style={[styles.signalRow, !isFirst && styles.signalRowSeparator]}>
            <View style={[styles.badge, { backgroundColor: badgeColor }]}>
                {signal.status === 'alert' ? <DotIcon /> : signal.status === 'ok' ? <CheckMarkIcon /> : null}
            </View>
            <View style={styles.signalTextWrap}>
                <Text style={styles.signalLabel}>{signal.label}</Text>
                {signal.note ? <Text style={styles.signalNote}>{signal.note}</Text> : null}
            </View>
            <Text style={[styles.signalValue, { color: badgeColor }]}>
                {typeof signal.value === 'string' || typeof signal.value === 'number'
                    ? String(signal.value)
                    : stringifySignalValue(signal.value)}
            </Text>
        </View>
    );
}

// Convierte las señales del Motor al shape que espera SignalRow.
// `valor` puede venir como string ('8h') o como objeto complejo si el Motor
// externo devuelve la métrica cruda. `stringifySignalValue` protege el render
// para que nunca se muestre "[object Object]" en la UI.
function stringifySignalValue(v) {
    if (v == null) return '—';
    if (typeof v === 'string' || typeof v === 'number') return String(v);
    // Objeto: intentar campos comunes del Motor antes de rendirse.
    if (typeof v === 'object') {
        if (typeof v.valor === 'string' || typeof v.valor === 'number') return String(v.valor);
        if (typeof v.value === 'string' || typeof v.value === 'number') return String(v.value);
        if (typeof v.label === 'string') return v.label;
        // Fallback: primer valor string/número del objeto (evita "[object Object]").
        const first = Object.values(v).find((x) => typeof x === 'string' || typeof x === 'number');
        if (first != null) return String(first);
    }
    return '—';
}

function mapMotorSignals(motorSenales) {
    return motorSenales.map((s, i) => ({
        id: i + 1,
        label: s.label,
        note: s.nota,
        value: stringifySignalValue(s.valor),
        status: s.estado === 'alerta' ? 'alert' : s.estado === 'desconocido' ? 'unknown' : 'ok',
        severity: s.severidad,
    }));
}

export default function FatigueEngineScreen({ navigation, route }) {
    const metrics = route?.params?.metrics ?? null;
    const [checkin, setCheckin] = useState(null);
    const [motorResult, setMotorResult] = useState(null);
    const [loading, setLoading] = useState(true);

    // Cargar el check-in del día en paralelo — es la fuente primaria de señales
    // cuando no hay wearable. Sin esto, buildSignals recibía todo null y el motor
    // devolvía siempre "Fatiga baja" con TODAS las señales grises.
    useEffect(() => {
        let cancelled = false;
        const today = new Date().toLocaleDateString('sv');
        (async () => {
            const checkinRes = await dailyCheckInApi.getForDate(today).catch(() => null);
            const loadedCheckin = checkinRes?.data?.checkin ?? null;
            if (cancelled) return;
            setCheckin(loadedCheckin);

            // Llamar al backend con TODAS las señales disponibles (wearable + manual).
            // Aunque metrics sea null, si hay check-in tenemos datos que mandar.
            const hasAnyInput = !!metrics || !!loadedCheckin;
            if (!hasAnyInput) {
                setLoading(false);
                return;
            }
            const payload = {
                ...(metrics ?? {}),
                moodScore: loadedCheckin?.moodScore ?? null,
                perceivedEnergy: loadedCheckin?.energyLevel ?? null,
                factors: loadedCheckin?.factors ?? null,
                // sleepHours: si el wearable no lo tiene, usar el del check-in.
                sleepHours: metrics?.sleepHours ?? loadedCheckin?.sleepHours ?? null,
            };
            const res = await healthApi.analyzeFatigue(payload).catch(() => null);
            if (cancelled) return;
            if (res && !res.error && res.data) setMotorResult(res.data);
            setLoading(false);
        })();
        return () => { cancelled = true; };
    }, []);

    // Persistir nivel de fatiga para que MenusScreen, StudyTipsScreen y
    // MeditationListScreen lo lean sin necesitar params de navegación.
    useEffect(() => {
        if (motorResult) {
            // El Motor ya da 'bajo'|'medio'|'alto'
            AsyncStorage.setItem(FATIGUE_LEVEL_KEY, motorResult.nivel ?? 'bajo');
        } else if (metrics || checkin) {
            const sigs = buildSignals(metrics, checkin);
            const crit = sigs.filter((s) => s.severity === 'critical').length;
            const warn = sigs.filter((s) => s.severity === 'warning').length;
            const level = crit >= 2 ? 'alto' : (crit === 1 || warn >= 2) ? 'medio' : 'bajo';
            AsyncStorage.setItem(FATIGUE_LEVEL_KEY, level);
        }
    }, [motorResult, metrics, checkin]);

    // Motor disponible → usa sus datos; sin Motor → cálculo local con check-in.
    const SIGNALS = motorResult
        ? mapMotorSignals(motorResult.senales ?? [])
        : buildSignals(metrics, checkin);

    const motorFatigueLevel = motorResult
        ? ({ alto: 'high', medio: 'medium', bajo: 'low' }[motorResult.nivel] ?? 'low')
        : null;

    const criticalCount = SIGNALS.filter((s) => s.severity === 'critical').length;
    const warningCount = SIGNALS.filter((s) => s.severity === 'warning').length;
    const activeSignalsCount = SIGNALS.filter((s) => s.status === 'alert').length;
    const knownSignalsCount = SIGNALS.filter((s) => s.status !== 'unknown').length;
    const fatigueLevel = motorFatigueLevel
        ?? (criticalCount >= 2 ? 'high' : criticalCount === 1 || warningCount >= 2 ? 'medium' : 'low');
    const isHigh = fatigueLevel !== 'low';
    // Sin ningún dato (ni wearable ni check-in) el motor no debe mentir con
    // "Fatiga baja" — mostrar estado explícito.
    const hasAnyData = !!metrics || !!checkin;

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <HealthScreenHeader title="Estado de fatiga" onBack={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Tarjeta destacada — 3 estados: sin datos / baja / media-alta */}
                <View style={[
                    styles.featuredCard,
                    {
                        backgroundColor: !hasAnyData
                            ? FIGMA.unknownBadge
                            : isHigh ? FIGMA.featuredBgHigh : FIGMA.featuredBgLow,
                    },
                ]}>
                    <Text style={styles.featuredTitle}>
                        {!hasAnyData
                            ? 'Sin datos suficientes'
                            : fatigueLevel === 'high' ? 'Fatiga alta detectada'
                            : fatigueLevel === 'medium' ? 'Fatiga media'
                            : 'Fatiga baja'}
                    </Text>
                    <Text style={styles.featuredSubtitle}>
                        {!hasAnyData
                            ? 'Guarda tu Estado del día o conecta un wearable.'
                            : `${activeSignalsCount} de ${knownSignalsCount} señales activas${checkin && !metrics ? ' · según tu Estado del día' : ''}`}
                    </Text>
                </View>

                {/* Lista de señales */}
                <Text style={styles.sectionHeader}>SEÑALES QUE LO DISPARAN</Text>
                <View style={styles.signalsList}>
                    {SIGNALS.map((signal, index) => (
                        <SignalRow key={signal.id} signal={signal} isFirst={index === 0} />
                    ))}
                </View>

                {motorResult?.recomendaciones?.length > 0 && (
                    <View style={styles.recommendationsWrap}>
                        <Text style={styles.sectionHeader}>RECOMENDACIONES</Text>
                        {motorResult.recomendaciones.map((rec, i) => (
                            <Text key={i} style={styles.recommendationItem}>{'· '}{rec}</Text>
                        ))}
                    </View>
                )}

                {/* CTA */}
                <TouchableOpacity
                    style={styles.ctaButton}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('BreathingExercise')}
                >
                    <Text style={styles.ctaButtonText}>Hacer pausa guiada</Text>
                </TouchableOpacity>

                <View style={{ height: spacing.lg }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
    scrollContent: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
    },
    featuredCard: {
        borderRadius: 24,
        paddingVertical: 24,
        paddingHorizontal: 20,
        alignItems: 'center',
        marginBottom: 24,
    },
    featuredTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 19,
        color: colors.white,
    },
    featuredSubtitle: {
        marginTop: 4,
        fontFamily: 'Poppins-Light',
        fontSize: 11.5,
        color: colors.white,
    },
    sectionHeader: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: colors.textDark,
        marginBottom: 4,
    },
    signalsList: {
        marginBottom: 28,
    },
    signalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 24,
    },
    signalRowSeparator: {
        borderTopWidth: 0.5,
        borderTopColor: FIGMA.separator,
    },
    badge: {
        width: 40,
        height: 40,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    signalTextWrap: {
        flex: 1,
    },
    signalLabel: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: colors.textDark,
    },
    signalNote: {
        marginTop: 2,
        fontFamily: 'Poppins-Regular',
        fontSize: 11.5,
        color: FIGMA.textNote,
    },
    signalValue: {
        fontFamily: 'Poppins-Bold',
        fontSize: 15,
    },
    ctaButton: {
        height: 61,
        borderRadius: 14,
        backgroundColor: colors.accentOrange,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ctaButtonText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: colors.white,
    },
    recommendationsWrap: {
        marginBottom: 24,
    },
    recommendationItem: {
        fontFamily: 'Poppins-Regular',
        fontSize: 12.5,
        color: FIGMA.textNote,
        marginTop: 6,
        lineHeight: 18,
    },
});
