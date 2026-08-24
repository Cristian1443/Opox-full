import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../../components/ScreenHeader';
import { planningApi } from '../../api';

const WEEKDAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const INTENSITY_LABELS = { low: 'Baja', medium: 'Media', high: 'Alta' };
const INTENSITY_ORDER = ['low', 'medium', 'high'];
const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function DateInput({ year, month, day, onYearChange, onMonthChange, onDayChange }) {
    const monthRef = useRef(null);
    const dayRef = useRef(null);

    const hasDate = year.length === 4 && month && day;
    const displayLabel = hasDate
        ? `${day.padStart(2, '0')} ${MONTH_NAMES[(parseInt(month, 10) - 1) % 12]} ${year}`
        : null;

    return (
        <View>
            {displayLabel && (
                <Text style={styles.datePreview}>{displayLabel}</Text>
            )}
            <View style={styles.dateRow}>
                <View style={styles.dateField}>
                    <TextInput
                        style={styles.dateInput}
                        placeholder="AAAA"
                        placeholderTextColor="#AEB5C2"
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
                        placeholderTextColor="#AEB5C2"
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
                        placeholderTextColor="#AEB5C2"
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

    const effectiveGoal = Math.max(
        1,
        Math.round(testsPerDay * (intensity === 'low' ? 0.75 : intensity === 'high' ? 1.25 : 1)),
    );

    const toggleDay = (weekday) => {
        setStudyDays((prev) =>
            prev.includes(weekday) ? prev.filter((d) => d !== weekday) : [...prev, weekday].sort(),
        );
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
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F4F6FA" />
            <View style={styles.statusBar}><Text style={styles.statusBarTime}>9:41</Text></View>
            <ScreenHeader title="Ajustar mi plan" onBack={() => navigation.goBack()} />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Tests por día</Text>
                    <View style={styles.stepperRow}>
                        <TouchableOpacity style={styles.stepperBtn} onPress={() => setTestsPerDay((n) => Math.max(1, n - 1))}>
                            <Text style={styles.stepperBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.stepperValue}>{testsPerDay} test{testsPerDay === 1 ? '' : 's'}</Text>
                        <TouchableOpacity style={styles.stepperBtn} onPress={() => setTestsPerDay((n) => Math.min(6, n + 1))}>
                            <Text style={styles.stepperBtnText}>+</Text>
                        </TouchableOpacity>
                    </View>
                    {effectiveGoal !== testsPerDay && (
                        <Text style={styles.effectiveGoal}>
                            Con intensidad {INTENSITY_LABELS[intensity].toLowerCase()}: objetivo real{' '}
                            <Text style={styles.effectiveGoalBold}>{effectiveGoal} tests/día</Text>
                        </Text>
                    )}
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Días de estudio a la semana</Text>
                    <View style={styles.daysRow}>
                        {WEEKDAY_LABELS.map((label, i) => {
                            const weekday = i + 1;
                            const active = studyDays.includes(weekday);
                            return (
                                <TouchableOpacity
                                    key={weekday}
                                    style={[styles.dayCirc, active && styles.dayCircActive]}
                                    onPress={() => toggleDay(weekday)}
                                >
                                    <Text style={[styles.dayCircText, active && styles.dayCircTextActive]}>{label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Intensidad</Text>
                    <Text style={styles.muted}>Ajusta la carga diaria según tu energía</Text>
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
                </View>

                <View style={styles.card}>
                    <View style={styles.dateHeader}>
                        <View>
                            <Text style={styles.cardTitle}>Fecha de examen</Text>
                            <Text style={styles.muted}>Activa la cuenta atrás y el horizonte macro</Text>
                        </View>
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
                </View>
            </ScrollView>

            <View style={styles.btnRow}>
                <TouchableOpacity style={styles.btn} onPress={handleSave} activeOpacity={0.85}>
                    <Text style={styles.btnText}>Guardar cambios</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F6FA' },
    statusBar: { height: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 16 },
    statusBarTime: { fontSize: 10, fontWeight: '700', color: '#1B2A4A', marginRight: 'auto' },
    scroll: { flex: 1 },
    body: { paddingHorizontal: 16, paddingBottom: 90 },
    card: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#EEF1F7', borderRadius: 14, padding: 13, marginBottom: 11 },
    cardTitle: { fontSize: 12, fontWeight: '700', color: '#1B2A4A' },
    muted: { fontSize: 11, color: '#8A92A0' },
    stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginTop: 12 },
    stepperBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFF1EC', alignItems: 'center', justifyContent: 'center' },
    stepperBtnText: { fontSize: 18, fontWeight: '800', color: '#FF6B4A' },
    stepperValue: { fontSize: 13, fontWeight: '800', color: '#FF6B4A', minWidth: 70, textAlign: 'center' },
    daysRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    dayCirc: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, borderColor: '#E4E8F0', alignItems: 'center', justifyContent: 'center' },
    dayCircActive: { backgroundColor: '#FF6B4A', borderColor: '#FF6B4A' },
    dayCircText: { fontSize: 11, fontWeight: '700', color: '#9AA2B1' },
    dayCircTextActive: { color: '#fff' },
    intensityBtns: { flexDirection: 'row', gap: 8, marginTop: 12, marginBottom: 8 },
    intensityBtn: { flex: 1, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, borderColor: '#E4E8F0', alignItems: 'center' },
    intensityBtnActive: { backgroundColor: '#FF6B4A', borderColor: '#FF6B4A' },
    intensityBtnText: { fontSize: 12, fontWeight: '700', color: '#9AA2B1' },
    intensityBtnTextActive: { color: '#fff' },
    effectiveGoal: { fontSize: 10.5, color: '#8A92A0', textAlign: 'center', marginTop: 8 },
    effectiveGoalBold: { fontWeight: '700', color: '#FF6B4A' },
    intensityHint: { fontSize: 10, color: '#AEB5C2' },
    dateHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 },
    clearBtn: { backgroundColor: '#F4F6FA', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10 },
    clearBtnText: { fontSize: 11, fontWeight: '700', color: '#8A92A0' },
    datePreview: { fontSize: 16, fontWeight: '800', color: '#FF6B4A', textAlign: 'center', marginBottom: 10 },
    dateRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
    dateField: { flex: 1, alignItems: 'center' },
    dateInput: { borderWidth: 1.5, borderColor: '#E4E8F0', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 10, fontSize: 15, fontWeight: '700', color: '#1B2A4A', textAlign: 'center', width: '100%' },
    dateFieldLabel: { fontSize: 9, color: '#AEB5C2', fontWeight: '600', marginTop: 4, textAlign: 'center' },
    dateSep: { fontSize: 18, fontWeight: '300', color: '#D4DAE6', marginBottom: 22 },
    btnRow: { position: 'absolute', bottom: 16, left: 18, right: 18 },
    btn: { backgroundColor: '#FF6B4A', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
    btnText: { color: '#fff', fontSize: 13.5, fontWeight: '700' },
});
