import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { planningApi } from '../../api';
import { colors, spacing } from '../../theme';

const WEEKDAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const INTENSITY_LABELS = { low: 'Baja', medium: 'Media', high: 'Alta' };
const INTENSITY_ORDER = ['low', 'medium', 'high'];
const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// Colores confirmados contra Figma (frame EDITAR PLAN, Bloque 4) sin
// equivalente exacto en theme.js.
const FIGMA = {
    sliderTrackFaded: 'rgba(246,150,36,0.15)',
    dayOutline: '#D9D9D9',
    textNote: '#343A3D',
};

// Fecha de examen — sin datos de Figma para este control (ver nota más
// abajo), pero es real y necesario: sin él el CTA "Añádela en el ajuste
// del plan" de PlanningMacroScreen queda sin destino. Reemplaza el input
// libre "YYYY-MM-DD" por 3 campos (Año/Mes/Día) tras pruebas reales en
// dispositivo — más difícil de escribir mal.
function DateInput({ year, month, day, onYearChange, onMonthChange, onDayChange }) {
    const monthRef = useRef(null);
    const dayRef = useRef(null);

    const hasDate = year.length === 4 && month && day;
    const displayLabel = hasDate
        ? `${day.padStart(2, '0')} ${MONTH_NAMES[(parseInt(month, 10) - 1) % 12]} ${year}`
        : null;

    return (
        <View>
            {displayLabel && <Text style={styles.datePreview}>{displayLabel}</Text>}
            <View style={styles.dateRow}>
                <View style={styles.dateField}>
                    <TextInput
                        style={styles.dateInput}
                        placeholder="AAAA"
                        placeholderTextColor={FIGMA.textNote}
                        value={year}
                        onChangeText={(v) => {
                            const cleaned = v.replace(/\D/g, '').slice(0, 4);
                            onYearChange(cleaned);
                            if (cleaned.length === 4) monthRef.current?.focus();
                        }}
                        keyboardType="numeric"
                        maxLength={4}
                        returnKeyType="next"
                        onSubmitEditing={() => monthRef.current?.focus()}
                    />
                    <Text style={styles.dateFieldLabel}>Año</Text>
                </View>
                <Text style={styles.dateSep}>/</Text>
                <View style={styles.dateField}>
                    <TextInput
                        ref={monthRef}
                        style={styles.dateInput}
                        placeholder="MM"
                        placeholderTextColor={FIGMA.textNote}
                        value={month}
                        onChangeText={(v) => {
                            const cleaned = v.replace(/\D/g, '').slice(0, 2);
                            onMonthChange(cleaned);
                            if (cleaned.length === 2) dayRef.current?.focus();
                        }}
                        keyboardType="numeric"
                        maxLength={2}
                        returnKeyType="next"
                        onSubmitEditing={() => dayRef.current?.focus()}
                    />
                    <Text style={styles.dateFieldLabel}>Mes</Text>
                </View>
                <Text style={styles.dateSep}>/</Text>
                <View style={styles.dateField}>
                    <TextInput
                        ref={dayRef}
                        style={styles.dateInput}
                        placeholder="DD"
                        placeholderTextColor={FIGMA.textNote}
                        value={day}
                        onChangeText={(v) => onDayChange(v.replace(/\D/g, '').slice(0, 2))}
                        keyboardType="numeric"
                        maxLength={2}
                        returnKeyType="done"
                    />
                    <Text style={styles.dateFieldLabel}>Día</Text>
                </View>
            </View>
        </View>
    );
}

export default function PlanningEditScreen({ navigation }) {
    const [testsPerDay, setTestsPerDay] = useState(3);
    const [studyDays, setStudyDays] = useState([1, 2, 3, 4, 5]);
    const [intensity, setIntensity] = useState('medium');
    const [examYear, setExamYear] = useState('');
    const [examMonth, setExamMonth] = useState('');
    const [examDay, setExamDay] = useState('');

    useEffect(() => {
        planningApi.getPlan().then(({ data }) => {
            if (!data) return;
            setTestsPerDay(data.testsPerDay);
            setStudyDays(data.studyDays);
            setIntensity(data.intensity);
            if (data.examDate) {
                const [y = '', m = '', d = ''] = data.examDate.split('-');
                setExamYear(y);
                setExamMonth(m);
                setExamDay(d);
            }
        });
    }, []);

    const examDate =
        examYear.length === 4 && examMonth && examDay
            ? `${examYear}-${examMonth.padStart(2, '0')}-${examDay.padStart(2, '0')}`
            : '';

    // Mismo cálculo que applyIntensity() en el backend (low=0.75×, high=1.25×).
    const effectiveGoal = Math.max(
        1,
        Math.round(testsPerDay * (intensity === 'low' ? 0.75 : intensity === 'high' ? 1.25 : 1)),
    );

    const toggleDay = (weekday) => {
        setStudyDays((prev) => (prev.includes(weekday) ? prev.filter((d) => d !== weekday) : [...prev, weekday].sort()));
    };

    const clearDate = () => { setExamYear(''); setExamMonth(''); setExamDay(''); };

    const handleSave = async () => {
        const examDateValid = /^\d{4}-\d{2}-\d{2}$/.test(examDate);
        const { error } = await planningApi.updatePlan({
            testsPerDay,
            studyDays,
            intensity,
            examDate: examDateValid ? examDate : null,
        });
        if (!error) navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.iconBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Ionicons name="chevron-back" size={24} color={colors.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Ajustar mi plan</Text>
                <View style={styles.iconBtn} />
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                {/* Nota: en Figma esta sección repite "RUTAS POR FASES" (copiado
                    de "Rumbo a la plaza") aunque aquí el contenido real es el
                    selector de tests diarios. Se usa una etiqueta funcional
                    propia en vez de propagar el mismo texto equivocado. */}
                <Text style={styles.sectionLabel}>TESTS DIARIOS</Text>
                <View style={styles.sliderBlock}>
                    <Slider
                        style={styles.slider}
                        minimumValue={1}
                        maximumValue={6}
                        step={1}
                        value={testsPerDay}
                        onValueChange={setTestsPerDay}
                        minimumTrackTintColor={colors.accentOrange}
                        maximumTrackTintColor={FIGMA.sliderTrackFaded}
                        thumbTintColor={colors.accentOrange}
                    />
                    <View style={styles.sliderLabelsRow}>
                        <Text style={styles.sliderMinMaxLabel}>1</Text>
                        <Text style={styles.sliderValueLabel}>{testsPerDay} test{testsPerDay === 1 ? '' : 's'}</Text>
                        <Text style={styles.sliderMinMaxLabel}>6</Text>
                    </View>
                    {effectiveGoal !== testsPerDay && (
                        <Text style={styles.effectiveGoal}>
                            Con intensidad {INTENSITY_LABELS[intensity].toLowerCase()}: objetivo real{' '}
                            <Text style={styles.effectiveGoalBold}>{effectiveGoal} tests/día</Text>
                        </Text>
                    )}
                </View>

                <Text style={[styles.sectionLabel, styles.sectionSpacingTop]}>DÍAS DE ESTUDIO A LA SEMANA</Text>
                <View style={styles.daysRow}>
                    {WEEKDAY_LABELS.map((label, i) => {
                        const weekday = i + 1;
                        const active = studyDays.includes(weekday);
                        return (
                            <TouchableOpacity
                                key={weekday}
                                style={[styles.dayCirc, active && styles.dayCircActive]}
                                onPress={() => toggleDay(weekday)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.dayCircText, active && styles.dayCircTextActive]}>{label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <Text style={[styles.sectionLabel, styles.sectionSpacingTop]}>INTENSIDAD</Text>
                <Text style={styles.intensitySubtitle}>La IA reparte la carga</Text>
                <View style={styles.intensityBtns}>
                    {INTENSITY_ORDER.map((level) => (
                        <TouchableOpacity
                            key={level}
                            style={[styles.intensityBtn, intensity === level && styles.intensityBtnActive]}
                            onPress={() => setIntensity(level)}
                            activeOpacity={0.75}
                        >
                            <Text style={[styles.intensityBtnText, intensity === level && styles.intensityBtnTextActive]}>
                                {INTENSITY_LABELS[level]}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <Text style={styles.intensityHint}>Baja = 75% · Media = 100% · Alta = 125%</Text>

                {/* No presente en el frame de Figma inspeccionado, pero es la
                    única pantalla real donde se puede fijar la fecha de examen
                    que usa el horizonte macro — quitarla dejaría el CTA "Añádela
                    en el ajuste del plan" de PlanningMacroScreen sin destino. */}
                <View style={[styles.dateHeader, styles.sectionSpacingTop]}>
                    <Text style={styles.sectionLabel}>Fecha de examen (opcional)</Text>
                    {(examYear || examMonth || examDay) && (
                        <TouchableOpacity onPress={clearDate} style={styles.clearBtn}>
                            <Text style={styles.clearBtnText}>Quitar</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <DateInput
                    year={examYear}
                    month={examMonth}
                    day={examDay}
                    onYearChange={setExamYear}
                    onMonthChange={setExamMonth}
                    onDayChange={setExamDay}
                />

                <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.85}>
                    <Text style={styles.saveButtonText}>Guardar cambios</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.white },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: 4,
    },
    iconBtn: { width: 32, padding: 4 },
    headerTitle: {
        flex: 1,
        fontFamily: 'Poppins-SemiBold',
        fontSize: 21,
        color: colors.textDark,
        textAlign: 'center',
    },
    scroll: { flex: 1 },
    body: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: 40 },
    sectionLabel: { fontFamily: 'Poppins-SemiBold', fontSize: 16, color: colors.textDark, marginBottom: 16 },
    sectionSpacingTop: { marginTop: 40 },
    sliderBlock: {},
    slider: { width: '100%', height: 32 },
    sliderLabelsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
    sliderMinMaxLabel: { fontFamily: 'Poppins-Regular', fontSize: 12.7, color: colors.textDark },
    sliderValueLabel: { fontFamily: 'Poppins-SemiBold', fontSize: 12.7, color: colors.accentOrange },
    effectiveGoal: { marginTop: 12, fontFamily: 'Poppins-Regular', fontSize: 10.5, color: FIGMA.textNote, textAlign: 'center' },
    effectiveGoalBold: { fontFamily: 'Poppins-SemiBold', color: colors.accentOrange },
    daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
    dayCirc: { width: 42.9, height: 42.9, borderRadius: 21.45, borderWidth: 0.44, borderColor: FIGMA.dayOutline, alignItems: 'center', justifyContent: 'center' },
    dayCircActive: { backgroundColor: colors.selectionBorder, borderWidth: 0 },
    dayCircText: { fontFamily: 'Poppins-SemiBold', fontSize: 18.7, color: colors.textDark },
    dayCircTextActive: { color: colors.white },
    intensitySubtitle: { fontFamily: 'Poppins-Regular', fontSize: 11.6, color: FIGMA.textNote, marginBottom: 12 },
    intensityBtns: { flexDirection: 'row', gap: 8 },
    intensityBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 0.44, borderColor: FIGMA.dayOutline, alignItems: 'center' },
    intensityBtnActive: { backgroundColor: colors.selectionBorder, borderWidth: 0 },
    intensityBtnText: { fontFamily: 'Poppins-SemiBold', fontSize: 12.5, color: colors.textDark },
    intensityBtnTextActive: { color: colors.white },
    intensityHint: { marginTop: 8, fontFamily: 'Poppins-Regular', fontSize: 10, color: FIGMA.textNote },
    dateHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    clearBtn: { backgroundColor: FIGMA.sliderTrackFaded, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10 },
    clearBtnText: { fontFamily: 'Poppins-SemiBold', fontSize: 11, color: colors.accentOrange },
    datePreview: { fontFamily: 'Poppins-SemiBold', fontSize: 16, color: colors.accentOrange, textAlign: 'center', marginBottom: 10 },
    dateRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
    dateField: { flex: 1, alignItems: 'center' },
    dateInput: { borderWidth: 0.44, borderColor: FIGMA.dayOutline, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 10, fontFamily: 'Poppins-SemiBold', fontSize: 15, color: colors.textDark, textAlign: 'center', width: '100%' },
    dateFieldLabel: { fontFamily: 'Poppins-Medium', fontSize: 9, color: FIGMA.textNote, marginTop: 4, textAlign: 'center' },
    dateSep: { fontFamily: 'Poppins-Light', fontSize: 18, color: FIGMA.dayOutline, marginBottom: 22 },
    saveButton: {
        marginTop: 40,
        width: 322,
        height: 61,
        borderRadius: 14.2,
        backgroundColor: colors.ctaGreen,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
    },
    saveButtonText: { fontFamily: 'Poppins-SemiBold', fontSize: 16, color: colors.white },
});
