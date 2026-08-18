import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from '../../theme';

// Igual que PENDING_OPOSICION_KEY en OppositionSelectorScreen: esto corre
// ANTES de que exista sesión, así que la única forma de no perder el
// progreso al cerrar la app a mitad del test es guardar la pregunta actual
// aquí. Se limpia solo al completar el test (ver handleConfirm).
export const PENDING_LEVEL_TEST_KEY = 'opox.pendingLevelTestIndex';

const QUESTIONS = [
    {
        id: 1,
        question:
            'Según la Ley 39/2015, el plazo general para resolver un procedimiento es de:',
        options: [
            { id: 'A', text: 'Un mes' },
            { id: 'B', text: 'Tres meses' },
            { id: 'C', text: 'Seis meses' },
            { id: 'D', text: 'Un año' },
        ],
    },
    {
        id: 2,
        question: '¿Cuántos artículos tiene la Constitución Española de 1978?',
        options: [
            { id: 'A', text: '159' },
            { id: 'B', text: '169' },
            { id: 'C', text: '179' },
            { id: 'D', text: '189' },
        ],
    },
    {
        id: 3,
        question: '¿Cuál es el órgano supremo de la Administración General del Estado?',
        options: [
            { id: 'A', text: 'El Congreso' },
            { id: 'B', text: 'El Senado' },
            { id: 'C', text: 'El Consejo de Ministros' },
            { id: 'D', text: 'El Tribunal Supremo' },
        ],
    },
];

// Test de nivel de longitud fija (no depende del nº de preguntas de muestra arriba,
// que se repiten cíclicamente hasta completar el total).
const TOTAL = 20;

export default function LevelTestInProgressScreen({ navigation }) {
    const [qIndex, setQIndex] = useState(0);
    const [selected, setSelected] = useState(null);
    const hasRestoredRef = useRef(false);

    // Restaura la pregunta donde el usuario se quedó si cerró la app a
    // mitad del test — sin esto, cada cierre reiniciaba las 20 preguntas.
    useEffect(() => {
        (async () => {
            const saved = await AsyncStorage.getItem(PENDING_LEVEL_TEST_KEY);
            const savedIndex = saved != null ? parseInt(saved, 10) : NaN;
            if (Number.isInteger(savedIndex) && savedIndex > 0 && savedIndex < TOTAL) {
                setQIndex(savedIndex);
            }
            hasRestoredRef.current = true;
        })();
    }, []);

    useEffect(() => {
        if (!hasRestoredRef.current) return;
        AsyncStorage.setItem(PENDING_LEVEL_TEST_KEY, String(qIndex));
    }, [qIndex]);

    const question = QUESTIONS[qIndex % QUESTIONS.length];
    const isFirst = qIndex === 0;
    const isLast = qIndex >= TOTAL - 1;

    const goToQuestion = (nextIndex) => {
        if (nextIndex < 0 || nextIndex > TOTAL - 1) return;
        setQIndex(nextIndex);
        setSelected(null);
    };

    const handleConfirm = () => {
        if (selected === null) return;
        if (!isLast) {
            goToQuestion(qIndex + 1);
        } else {
            AsyncStorage.removeItem(PENDING_LEVEL_TEST_KEY);
            navigation.replace('LevelTestResult');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Volver"
                >
                    <Ionicons name="chevron-back" size={20} color={colors.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Test de nivel</Text>
                <View style={styles.backButtonSpacer} />
            </View>

            {/* Cuerpo principal */}
            <View style={styles.body}>

                {/* Indicador de progreso: Pregunta X de Y + navegación prev/next */}
                <View style={styles.progressRow}>
                    <TouchableOpacity
                        onPress={() => goToQuestion(qIndex - 1)}
                        disabled={isFirst}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityLabel="Pregunta anterior"
                    >
                        <Ionicons
                            name="chevron-back"
                            size={18}
                            color={isFirst ? colors.grayMid : colors.textDark}
                        />
                    </TouchableOpacity>
                    <Text style={styles.progressLabel}>Pregunta {qIndex + 1} de {TOTAL}</Text>
                    <TouchableOpacity
                        onPress={() => goToQuestion(qIndex + 1)}
                        disabled={isLast}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityLabel="Pregunta siguiente"
                    >
                        <Ionicons
                            name="chevron-forward"
                            size={18}
                            color={isLast ? colors.grayMid : colors.textDark}
                        />
                    </TouchableOpacity>
                </View>

                {/* Enunciado */}
                <Text style={styles.questionText}>
                    {question.question}
                </Text>

                {/* Opciones A–D, cada una en su propia tarjeta */}
                <View style={styles.optionsList}>
                    {question.options.map((opt) => {
                        const isSelected = selected === opt.id;
                        return (
                            <TouchableOpacity
                                key={opt.id}
                                style={[styles.option, isSelected && styles.optionSelected]}
                                onPress={() => setSelected(opt.id)}
                                activeOpacity={0.75}
                                accessibilityLabel={`Opción ${opt.id}: ${opt.text}`}
                            >
                                <Text style={styles.optionLetter}>{opt.id}.</Text>
                                <Text style={styles.optionText}>{opt.text}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* Botón fijo en la parte inferior */}
            <View style={styles.bottomRow}>
                <TouchableOpacity
                    style={[styles.btnPrimary, selected === null && styles.btnPrimaryOff]}
                    onPress={handleConfirm}
                    disabled={selected === null}
                    activeOpacity={0.85}
                >
                    <Text style={styles.btnPrimaryText}>Confirmar respuesta</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },

    // ── Header ──────────────────────────────────
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing.sm,
    },
    backButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.grayLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backButtonSpacer: {
        width: 32,
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '700',
        color: colors.textDark,
    },

    // ── Cuerpo ───────────────────────────────────
    body: {
        flex: 1,
        paddingHorizontal: spacing.md + 2,
        paddingTop: spacing.sm,
        paddingBottom: 80, // espacio para el botón absoluto
    },

    // ── Progreso ────────────────────────────────
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.md,
        marginBottom: spacing.md,
    },
    progressLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textDark,
    },

    // ── Enunciado ────────────────────────────────
    questionText: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.textDark,
        lineHeight: 21,
        marginBottom: spacing.md,
    },

    // ── Opciones ────────────────────────────────
    optionsList: {
        gap: spacing.sm,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderWidth: 1,
        borderColor: 'rgba(65, 41, 80, 0.3)',
        borderRadius: 14,
        backgroundColor: colors.white,
        paddingVertical: spacing.sm + 2,
        paddingHorizontal: spacing.md,
    },
    optionSelected: {
        borderColor: colors.selectionBorder,
        borderWidth: 3.5,
        backgroundColor: colors.white,
    },
    optionLetter: {
        width: 26,
        fontSize: 15,
        fontWeight: '700',
        color: colors.textDark,
    },
    optionText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
        color: colors.textDark,
    },

    // ── Botón fijo inferior ──────────────────────
    // Equivale a: position:absolute; bottom:16; left:18; right:18
    bottomRow: {
        position: 'absolute',
        bottom: spacing.md,
        left: spacing.md + 2,
        right: spacing.md + 2,
    },
    btnPrimary: {
        backgroundColor: colors.ctaGreen,
        borderRadius: 20,
        paddingVertical: spacing.md - 3,
        alignItems: 'center',
    },
    btnPrimaryOff: {
        opacity: 0.4,
    },
    btnPrimaryText: {
        color: colors.white,
        fontSize: 15,
        fontWeight: '700',
    },
});
