import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { colors } from '../../theme';

const QUESTIONS = [
    {
        id: 1,
        question: 'Según la Ley 39/2015, el plazo general para resolver un procedimiento es de:',
        options: ['A · Un mes', 'B · Tres meses', 'C · Seis meses', 'D · Un año'],
    },
    {
        id: 2,
        question: '¿Cuántos artículos tiene la Constitución Española de 1978?',
        options: ['A · 159', 'B · 169', 'C · 179', 'D · 189'],
    },
    {
        id: 3,
        question: '¿Cuál es el órgano supremo de la Administración General del Estado?',
        options: ['A · El Congreso', 'B · El Senado', 'C · El Consejo de Ministros', 'D · El Tribunal Supremo'],
    },
];

const TOTAL = 10;

export default function LevelTestInProgressScreen({ navigation }) {
    const [qIndex, setQIndex] = useState(0);
    const [selected, setSelected] = useState(null);

    const question = QUESTIONS[qIndex % QUESTIONS.length];
    const progress = ((qIndex + 1) / TOTAL) * 100;

    const handleNext = () => {
        if (qIndex < TOTAL - 1) {
            setQIndex(qIndex + 1);
            setSelected(null);
        } else {
            navigation.replace('LevelTestResult');
        }
    };

    return (
        <SafeAreaView style={s.container}>
            {/* Barra de progreso */}
            <View style={s.progressRow}>
                <View style={s.progressBg}>
                    <View style={[s.progressFill, { width: `${progress}%` }]} />
                </View>
                <Text style={s.progressLabel}>{qIndex + 1}/{TOTAL}</Text>
            </View>

            {/* Pregunta */}
            <Text style={s.questionText}>{question.question}</Text>

            {/* Opciones */}
            <View style={s.optionsList}>
                {question.options.map((opt, i) => (
                    <TouchableOpacity
                        key={i}
                        style={[s.option, selected === i && s.optionActive]}
                        onPress={() => setSelected(i)}
                        activeOpacity={0.8}
                    >
                        <Text style={[s.optionTxt, selected === i && s.optionTxtActive]}>{opt}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={s.hint}>Sin penalización · responde lo que sepas</Text>

            <TouchableOpacity
                style={[s.nextBtn, selected === null && s.nextBtnOff]}
                onPress={handleNext}
                disabled={selected === null}
            >
                <Text style={s.nextTxt}>
                    {qIndex < TOTAL - 1 ? 'Siguiente pregunta' : 'Ver resultados'}
                </Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.white, paddingHorizontal: 24, paddingTop: 16 },
    progressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 28 },
    progressBg: { flex: 1, height: 8, backgroundColor: colors.grayMid, borderRadius: 4, marginRight: 10, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
    progressLabel: { fontSize: 13, fontWeight: '700', color: colors.grayText },
    questionText: { fontSize: 17, fontWeight: '800', color: colors.dark, lineHeight: 26, marginBottom: 28 },
    optionsList: { gap: 12 },
    option: { borderWidth: 1.5, borderColor: colors.grayMid, borderRadius: 12, padding: 16 },
    optionActive: { borderColor: colors.primary, backgroundColor: colors.redSoft },
    optionTxt: { fontSize: 15, color: colors.dark, fontWeight: '500' },
    optionTxtActive: { color: colors.primary, fontWeight: '700' },
    hint: { textAlign: 'center', color: colors.grayText, fontSize: 13, marginTop: 20 },
    nextBtn: {
        position: 'absolute', bottom: 32, left: 24, right: 24,
        backgroundColor: colors.primary, borderRadius: 50,
        paddingVertical: 18, alignItems: 'center',
    },
    nextBtnOff: { opacity: 0.4 },
    nextTxt: { color: colors.white, fontSize: 17, fontWeight: '700' },
});