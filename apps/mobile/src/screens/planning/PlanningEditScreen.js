import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView, TextInput } from 'react-native';
import ScreenHeader from '../../components/ScreenHeader';
import { planningApi } from '../../api';

const WEEKDAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const INTENSITY_LABELS = { low: 'Baja', medium: 'Media', high: 'Alta' };
const INTENSITY_ORDER = ['low', 'medium', 'high'];

export default function PlanningEditScreen({ navigation }) {
    const [testsPerDay, setTestsPerDay] = useState(3);
    const [studyDays, setStudyDays] = useState([1, 2, 3, 4, 5]);
    const [intensity, setIntensity] = useState('medium');
    const [examDate, setExamDate] = useState('');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        planningApi.getPlan().then(({ data }) => {
            if (!data) return;
            setTestsPerDay(data.testsPerDay);
            setStudyDays(data.studyDays);
            setIntensity(data.intensity);
            setExamDate(data.examDate || '');
        });
    }, []);

    const toggleDay = (weekday) => {
        setStudyDays((prev) => (prev.includes(weekday) ? prev.filter((d) => d !== weekday) : [...prev, weekday].sort()));
    };

    const cycleIntensity = () => {
        const i = INTENSITY_ORDER.indexOf(intensity);
        setIntensity(INTENSITY_ORDER[(i + 1) % INTENSITY_ORDER.length]);
    };

    const handleSave = async () => {
        const examDateValid = /^\d{4}-\d{2}-\d{2}$/.test(examDate);
        await planningApi.updatePlan({
            testsPerDay,
            studyDays,
            intensity,
            examDate: examDateValid ? examDate : examDate === '' ? null : undefined,
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
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
                        <TouchableOpacity
                            style={styles.stepperBtn}
                            onPress={() => setTestsPerDay((n) => Math.max(1, n - 1))}
                        >
                            <Text style={styles.stepperBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.stepperValue}>{testsPerDay} test{testsPerDay === 1 ? '' : 's'}</Text>
                        <TouchableOpacity
                            style={styles.stepperBtn}
                            onPress={() => setTestsPerDay((n) => Math.min(6, n + 1))}
                        >
                            <Text style={styles.stepperBtnText}>+</Text>
                        </TouchableOpacity>
                    </View>
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

                <TouchableOpacity style={styles.card} onPress={cycleIntensity} activeOpacity={0.7}>
                    <View style={styles.intensityRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.cardTitle}>Intensidad</Text>
                            <Text style={styles.muted}>Reparte la carga entre tus días de estudio</Text>
                        </View>
                        <Text style={styles.intensityPill}>{INTENSITY_LABELS[intensity]} ›</Text>
                    </View>
                </TouchableOpacity>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Fecha de examen (opcional)</Text>
                    <Text style={[styles.muted, { marginBottom: 8 }]}>Se usa para la cuenta atrás del horizonte macro.</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#AEB5C2"
                        value={examDate}
                        onChangeText={setExamDate}
                    />
                </View>
            </ScrollView>

            <View style={styles.btnRow}>
                <TouchableOpacity style={styles.btn} onPress={handleSave} activeOpacity={0.85}>
                    <Text style={styles.btnText}>{saved ? 'Guardado ✓' : 'Guardar cambios'}</Text>
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
    intensityRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    intensityPill: { fontSize: 11, fontWeight: '700', color: '#FF6B4A', backgroundColor: '#FFF1EC', paddingVertical: 5, paddingHorizontal: 11, borderRadius: 9 },
    input: { borderWidth: 1.5, borderColor: '#E4E8F0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: '#1B2A4A' },
    btnRow: { position: 'absolute', bottom: 16, left: 18, right: 18 },
    btn: { backgroundColor: '#FF6B4A', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
    btnText: { color: '#fff', fontSize: 13.5, fontWeight: '700' },
});
