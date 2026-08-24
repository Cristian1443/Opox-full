import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { planningApi } from '../../api';
import { colors, spacing } from '../../theme';

const WEEKDAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const INTENSITY_LABELS = { low: 'Baja', medium: 'Media', high: 'Alta' };
const INTENSITY_ORDER = ['low', 'medium', 'high'];

// Colores confirmados contra Figma (frame EDITAR PLAN, Bloque 4) sin
// equivalente exacto en theme.js.
const FIGMA = {
    sliderTrackFaded: 'rgba(246,150,36,0.15)',
    dayOutline: '#D9D9D9',
    textNote: '#343A3D',
};

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
                <View style={styles.intensityRow}>
                    <Text style={styles.intensitySubtitle}>La IA reparte la carga</Text>
                    <TouchableOpacity style={styles.intensityLink} onPress={cycleIntensity} activeOpacity={0.7}>
                        <Text style={styles.intensityLinkText}>{INTENSITY_LABELS[intensity]}</Text>
                        <Ionicons name="chevron-forward" size={14} color={colors.selectionBorder} />
                    </TouchableOpacity>
                </View>

                {/* No presente en el frame de Figma inspeccionado, pero es la
                    única pantalla real donde se puede fijar la fecha de examen
                    que usa el horizonte macro — quitarla dejaría el CTA "Añádela
                    en el ajuste del plan" de PlanningMacroScreen sin destino. */}
                <Text style={styles.examDateLabel}>Fecha de examen (opcional)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={FIGMA.textNote}
                    value={examDate}
                    onChangeText={setExamDate}
                />

                <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.85}>
                    <Text style={styles.saveButtonText}>{saved ? 'Guardado ✓' : 'Guardar cambios'}</Text>
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
    daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
    dayCirc: { width: 42.9, height: 42.9, borderRadius: 21.45, borderWidth: 0.44, borderColor: FIGMA.dayOutline, alignItems: 'center', justifyContent: 'center' },
    dayCircActive: { backgroundColor: colors.selectionBorder, borderWidth: 0 },
    dayCircText: { fontFamily: 'Poppins-SemiBold', fontSize: 18.7, color: colors.textDark },
    dayCircTextActive: { color: colors.white },
    intensityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    intensitySubtitle: { fontFamily: 'Poppins-Regular', fontSize: 11.6, color: FIGMA.textNote },
    intensityLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    intensityLinkText: { fontFamily: 'Poppins-Regular', fontSize: 14.2, color: colors.selectionBorder },
    examDateLabel: { marginTop: 40, marginBottom: 8, fontFamily: 'Poppins-SemiBold', fontSize: 16, color: colors.textDark },
    input: { borderWidth: 0.44, borderColor: FIGMA.dayOutline, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontFamily: 'Poppins-Regular', fontSize: 13, color: colors.textDark, marginBottom: 40 },
    saveButton: {
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
