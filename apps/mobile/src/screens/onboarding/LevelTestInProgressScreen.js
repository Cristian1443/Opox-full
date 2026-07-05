import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
} from 'react-native';

const QUESTIONS = [
    {
        id: 1,
        question:
            'Según la Ley 39/2015, el plazo general para resolver un procedimiento es de:',
        options: [
            { id: 'A', label: 'A · Un mes' },
            { id: 'B', label: 'B · Tres meses' },
            { id: 'C', label: 'C · Seis meses' },
            { id: 'D', label: 'D · Un año' },
        ],
    },
    {
        id: 2,
        question: '¿Cuántos artículos tiene la Constitución Española de 1978?',
        options: [
            { id: 'A', label: 'A · 159' },
            { id: 'B', label: 'B · 169' },
            { id: 'C', label: 'C · 179' },
            { id: 'D', label: 'D · 189' },
        ],
    },
    {
        id: 3,
        question: '¿Cuál es el órgano supremo de la Administración General del Estado?',
        options: [
            { id: 'A', label: 'A · El Congreso' },
            { id: 'B', label: 'B · El Senado' },
            { id: 'C', label: 'C · El Consejo de Ministros' },
            { id: 'D', label: 'D · El Tribunal Supremo' },
        ],
    },
];

const TOTAL = 10;

export default function LevelTestInProgressScreen({ navigation }) {
    const [qIndex, setQIndex] = useState(0);
    const [selected, setSelected] = useState(null);

    const question = QUESTIONS[qIndex % QUESTIONS.length];
    const progress = (qIndex + 1) / TOTAL;

    const handleNext = () => {
        if (qIndex < TOTAL - 1) {
            setQIndex(qIndex + 1);
            setSelected(null);
        } else {
            navigation.replace('LevelTestResult');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Status bar */}
            <View style={styles.statusBar}>
                <Text style={styles.statusBarTime}>9:41</Text>
            </View>

            {/* Cuerpo principal */}
            <View style={styles.body}>

                {/* Barra de progreso + contador */}
                <View style={styles.progressRow}>
                    <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                    </View>
                    <Text style={styles.progressLabel}>{qIndex + 1}/{TOTAL}</Text>
                </View>

                {/* Tarjeta de pregunta + opciones */}
                <View style={styles.questionCard}>
                    <Text style={styles.questionText}>
                        {question.question}
                    </Text>

                    {question.options.map((opt) => (
                        <TouchableOpacity
                            key={opt.id}
                            style={[styles.option, selected === opt.id && styles.optionSelected]}
                            onPress={() => setSelected(opt.id)}
                            activeOpacity={0.75}
                        >
                            <Text
                                style={[
                                    styles.optionText,
                                    selected === opt.id && styles.optionTextSelected,
                                ]}
                            >
                                {opt.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Hint */}
                <Text style={styles.hint}>Sin penalización · responde lo que sepas</Text>
            </View>

            {/* Botón fijo en la parte inferior */}
            <View style={styles.bottomRow}>
                <TouchableOpacity
                    style={[styles.btnPrimary, selected === null && styles.btnPrimaryOff]}
                    onPress={handleNext}
                    disabled={selected === null}
                    activeOpacity={0.85}
                >
                    <Text style={styles.btnPrimaryText}>
                        {qIndex < TOTAL - 1 ? 'Siguiente pregunta' : 'Ver resultados'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },

    // ── Status bar ──────────────────────────────
    statusBar: {
        height: 30,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        flexShrink: 0,
    },
    statusBarTime: {
        fontSize: 10,
        fontWeight: '700',
        color: '#1B2A4A',
    },

    // ── Cuerpo (padding: 16px 18px) ─────────────
    body: {
        flex: 1,
        paddingHorizontal: 18,
        paddingTop: 16,
        paddingBottom: 80, // espacio para el botón absoluto
    },

    // ── Progreso ────────────────────────────────
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 14,
    },
    progressTrack: {
        flex: 1,
        height: 7,
        backgroundColor: '#EEF1F7',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#FF6B4A',
    },
    progressLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#8A92A0',
    },

    // ── Tarjeta de pregunta ──────────────────────
    questionCard: {
        backgroundColor: '#F4F6FA',
        borderWidth: 1.5,
        borderColor: '#E4E8F0',
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
    },
    questionText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1B2A4A',
        lineHeight: 17,
    },

    // ── Opciones ────────────────────────────────
    option: {
        borderWidth: 1.5,
        borderColor: '#E4E8F0',
        borderRadius: 9,
        paddingVertical: 9,
        paddingHorizontal: 11,
        marginTop: 7,
    },
    optionSelected: {
        borderColor: '#FF6B4A',
        backgroundColor: '#FFF6F3',
    },
    optionText: {
        fontSize: 11.5,
        color: '#46506A',
    },
    optionTextSelected: {
        color: '#FF6B4A',
        fontWeight: '600',
    },

    // ── Hint ────────────────────────────────────
    hint: {
        fontSize: 11,
        color: '#8A92A0',
        textAlign: 'center',
        marginTop: 6,
    },

    // ── Botón fijo inferior ──────────────────────
    // Equivale a: position:absolute; bottom:16; left:18; right:18
    bottomRow: {
        position: 'absolute',
        bottom: 16,
        left: 18,
        right: 18,
        flexDirection: 'column',
        gap: 9,
    },
    btnPrimary: {
        backgroundColor: '#FF6B4A',
        borderRadius: 12,
        paddingVertical: 13,
        alignItems: 'center',
    },
    btnPrimaryOff: {
        opacity: 0.4,
    },
    btnPrimaryText: {
        color: '#FFFFFF',
        fontSize: 13.5,
        fontWeight: '700',
    },
});
