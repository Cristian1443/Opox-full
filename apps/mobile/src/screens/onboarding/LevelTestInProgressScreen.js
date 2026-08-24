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

// Persiste la pregunta actual para reanudar si el usuario cierra la app a medias.
export const PENDING_LEVEL_TEST_KEY = 'opox.pendingLevelTestIndex';

// Resultado calculado: lo lee SesionIniciadaScreen para inicializar el plan.
export const LEVEL_TEST_RESULT_KEY = 'opox.levelTestResult';

// ─── 20 preguntas únicas sobre el temario de oposiciones ─────────────────────
// topic: se usa para calcular fortalezas/debilidades por área
const QUESTIONS = [
    {
        id: 1,
        topic: 'ley-39',
        topicLabel: 'Ley 39/2015',
        question: 'Según la Ley 39/2015, el plazo general para resolver un procedimiento administrativo es de:',
        options: [
            { id: 'A', text: 'Un mes' },
            { id: 'B', text: 'Tres meses' },
            { id: 'C', text: 'Seis meses' },
            { id: 'D', text: 'Un año' },
        ],
        correct: 'C',
    },
    {
        id: 2,
        topic: 'constitucion',
        topicLabel: 'Constitución',
        question: '¿Cuántos artículos tiene la Constitución Española de 1978?',
        options: [
            { id: 'A', text: '159' },
            { id: 'B', text: '169' },
            { id: 'C', text: '179' },
            { id: 'D', text: '189' },
        ],
        correct: 'B',
    },
    {
        id: 3,
        topic: 'org-estado',
        topicLabel: 'Org. del Estado',
        question: '¿Cuál es el órgano colegiado supremo de la Administración General del Estado?',
        options: [
            { id: 'A', text: 'El Congreso de los Diputados' },
            { id: 'B', text: 'El Senado' },
            { id: 'C', text: 'El Consejo de Ministros' },
            { id: 'D', text: 'El Tribunal Supremo' },
        ],
        correct: 'C',
    },
    {
        id: 4,
        topic: 'constitucion',
        topicLabel: 'Constitución',
        question: '¿En qué fecha fue ratificada la Constitución Española en referéndum?',
        options: [
            { id: 'A', text: '31 de octubre de 1978' },
            { id: 'B', text: '6 de diciembre de 1978' },
            { id: 'C', text: '27 de diciembre de 1978' },
            { id: 'D', text: '29 de diciembre de 1978' },
        ],
        correct: 'B',
    },
    {
        id: 5,
        topic: 'ley-40',
        topicLabel: 'Ley 40/2015',
        question: 'Según la Ley 40/2015, las relaciones entre Administraciones Públicas se rigen por el principio de:',
        options: [
            { id: 'A', text: 'Jerarquía' },
            { id: 'B', text: 'Lealtad institucional' },
            { id: 'C', text: 'Subordinación' },
            { id: 'D', text: 'Unidad de mando' },
        ],
        correct: 'B',
    },
    {
        id: 6,
        topic: 'ley-39',
        topicLabel: 'Ley 39/2015',
        question: 'El recurso de alzada debe interponerse en el plazo máximo de:',
        options: [
            { id: 'A', text: '1 mes si el acto es expreso' },
            { id: 'B', text: '2 meses si el acto es expreso' },
            { id: 'C', text: '3 meses siempre' },
            { id: 'D', text: '6 meses siempre' },
        ],
        correct: 'A',
    },
    {
        id: 7,
        topic: 'ley-39',
        topicLabel: 'Ley 39/2015',
        question: 'El silencio administrativo en procedimientos iniciados a solicitud del interesado se considera, con carácter general:',
        options: [
            { id: 'A', text: 'Negativo' },
            { id: 'B', text: 'Positivo' },
            { id: 'C', text: 'Nulo de pleno derecho' },
            { id: 'D', text: 'Anulable' },
        ],
        correct: 'B',
    },
    {
        id: 8,
        topic: 'constitucion',
        topicLabel: 'Constitución',
        question: '¿Cuántos magistrados componen el Tribunal Constitucional?',
        options: [
            { id: 'A', text: '9' },
            { id: 'B', text: '10' },
            { id: 'C', text: '12' },
            { id: 'D', text: '15' },
        ],
        correct: 'C',
    },
    {
        id: 9,
        topic: 'constitucion',
        topicLabel: 'Constitución',
        question: 'Según el artículo 1 de la Constitución, la forma política del Estado español es:',
        options: [
            { id: 'A', text: 'República parlamentaria' },
            { id: 'B', text: 'Monarquía constitucional' },
            { id: 'C', text: 'Monarquía parlamentaria' },
            { id: 'D', text: 'Estado federado' },
        ],
        correct: 'C',
    },
    {
        id: 10,
        topic: 'ley-39',
        topicLabel: 'Ley 39/2015',
        question: 'La Ley 39/2015 del Procedimiento Administrativo Común entró en vigor el:',
        options: [
            { id: 'A', text: '1 de enero de 2016' },
            { id: 'B', text: '2 de octubre de 2016' },
            { id: 'C', text: '1 de enero de 2017' },
            { id: 'D', text: '2 de octubre de 2017' },
        ],
        correct: 'B',
    },
    {
        id: 11,
        topic: 'ley-39',
        topicLabel: 'Ley 39/2015',
        question: '¿Cuántos días hábiles tiene el interesado para subsanar defectos en su solicitud según la Ley 39/2015?',
        options: [
            { id: 'A', text: '5 días hábiles' },
            { id: 'B', text: '10 días hábiles' },
            { id: 'C', text: '15 días hábiles' },
            { id: 'D', text: '20 días hábiles' },
        ],
        correct: 'B',
    },
    {
        id: 12,
        topic: 'constitucion',
        topicLabel: 'Constitución',
        question: 'El Defensor del Pueblo es elegido por:',
        options: [
            { id: 'A', text: 'El Gobierno' },
            { id: 'B', text: 'El Rey' },
            { id: 'C', text: 'Las Cortes Generales' },
            { id: 'D', text: 'El Tribunal Constitucional' },
        ],
        correct: 'C',
    },
    {
        id: 13,
        topic: 'ley-39',
        topicLabel: 'Ley 39/2015',
        question: 'En el cómputo de plazos en días hábiles, se excluyen:',
        options: [
            { id: 'A', text: 'Solo los festivos nacionales' },
            { id: 'B', text: 'Los sábados, domingos y festivos' },
            { id: 'C', text: 'Solo los domingos' },
            { id: 'D', text: 'Los festivos autonómicos únicamente' },
        ],
        correct: 'B',
    },
    {
        id: 14,
        topic: 'org-estado',
        topicLabel: 'Org. del Estado',
        question: 'La Administración General del Estado se organiza territorialmente principalmente en:',
        options: [
            { id: 'A', text: 'Comunidades Autónomas' },
            { id: 'B', text: 'Delegaciones y Subdelegaciones del Gobierno' },
            { id: 'C', text: 'Municipios' },
            { id: 'D', text: 'Diputaciones Provinciales' },
        ],
        correct: 'B',
    },
    {
        id: 15,
        topic: 'constitucion',
        topicLabel: 'Constitución',
        question: '¿Qué artículo de la Constitución Española reconoce el principio de igualdad ante la ley?',
        options: [
            { id: 'A', text: 'Artículo 12' },
            { id: 'B', text: 'Artículo 14' },
            { id: 'C', text: 'Artículo 16' },
            { id: 'D', text: 'Artículo 18' },
        ],
        correct: 'B',
    },
    {
        id: 16,
        topic: 'ley-39',
        topicLabel: 'Ley 39/2015',
        question: 'El recurso de reposición es un recurso:',
        options: [
            { id: 'A', text: 'Ordinario ante el superior jerárquico' },
            { id: 'B', text: 'Extraordinario ante el mismo órgano' },
            { id: 'C', text: 'Potestativo previo al contencioso-administrativo' },
            { id: 'D', text: 'Obligatorio en todo caso' },
        ],
        correct: 'C',
    },
    {
        id: 17,
        topic: 'ley-40',
        topicLabel: 'Ley 40/2015',
        question: 'La Ley 40/2015 de Régimen Jurídico del Sector Público entró en vigor el:',
        options: [
            { id: 'A', text: '1 de enero de 2016' },
            { id: 'B', text: '2 de octubre de 2016' },
            { id: 'C', text: '1 de enero de 2017' },
            { id: 'D', text: '1 de octubre de 2017' },
        ],
        correct: 'B',
    },
    {
        id: 18,
        topic: 'constitucion',
        topicLabel: 'Constitución',
        question: 'Según la Constitución, el Congreso de los Diputados se compone de:',
        options: [
            { id: 'A', text: 'Un mínimo de 300 y un máximo de 400 diputados' },
            { id: 'B', text: 'Un mínimo de 250 y un máximo de 350 diputados' },
            { id: 'C', text: 'Un número fijo de 350 diputados' },
            { id: 'D', text: 'Un mínimo de 350 y un máximo de 450 diputados' },
        ],
        correct: 'A',
    },
    {
        id: 19,
        topic: 'constitucion',
        topicLabel: 'Constitución',
        question: '¿Cuántos títulos numerados (del I al X) contiene la Constitución Española?',
        options: [
            { id: 'A', text: '8' },
            { id: 'B', text: '9' },
            { id: 'C', text: '10' },
            { id: 'D', text: '11' },
        ],
        correct: 'C',
    },
    {
        id: 20,
        topic: 'ley-39',
        topicLabel: 'Ley 39/2015',
        question: 'Los actos administrativos de las Administraciones Públicas sujetos al Derecho Administrativo se presumirán:',
        options: [
            { id: 'A', text: 'Definitivos y ejecutorios' },
            { id: 'B', text: 'Válidos y producirán efectos desde la fecha en que se dicten' },
            { id: 'C', text: 'Firmes desde su notificación' },
            { id: 'D', text: 'Ejecutivos salvo suspensión judicial' },
        ],
        correct: 'B',
    },
];

const TOTAL = QUESTIONS.length; // 20

// Calcula nivel e intensidad a partir del porcentaje de aciertos
function calcLevelAndIntensity(percent) {
    if (percent >= 75) return { level: 'Avanzado', intensity: 'high' };
    if (percent >= 50) return { level: 'Intermedio', intensity: 'medium' };
    return { level: 'Básico', intensity: 'low' };
}

// Calcula fortalezas y debilidades por área temática
function calcStrengthsAndWeaknesses(answers) {
    const byTopic = {};
    QUESTIONS.forEach((q, i) => {
        if (!byTopic[q.topic]) byTopic[q.topic] = { label: q.topicLabel, correct: 0, total: 0 };
        byTopic[q.topic].total += 1;
        if (answers[i] === q.correct) byTopic[q.topic].correct += 1;
    });

    const strengths = [];
    const weaknesses = [];
    Object.values(byTopic).forEach(({ label, correct, total }) => {
        const rate = correct / total;
        if (rate >= 0.5) strengths.push(label);
        else weaknesses.push(label);
    });

    // Asegurar al menos un elemento en cada lista para que la UI no quede vacía
    if (strengths.length === 0 && weaknesses.length > 0) strengths.push('Por desarrollar');
    if (weaknesses.length === 0 && strengths.length > 0) weaknesses.push('Ninguno detectado');

    return { strengths, weaknesses };
}

export default function LevelTestInProgressScreen({ navigation }) {
    const [qIndex, setQIndex] = useState(0);
    const [selected, setSelected] = useState(null);
    const [answers, setAnswers] = useState([]); // respuesta elegida por pregunta
    const hasRestoredRef = useRef(false);
    const startTimeRef = useRef(Date.now());

    // Reanuda desde la pregunta donde se quedó si el usuario cerró la app a medias
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

    // Persiste la pregunta actual para recuperar si el usuario cierra la app
    useEffect(() => {
        if (!hasRestoredRef.current) return;
        AsyncStorage.setItem(PENDING_LEVEL_TEST_KEY, String(qIndex));
    }, [qIndex]);

    const question = QUESTIONS[qIndex];
    const isFirst = qIndex === 0;
    const isLast = qIndex >= TOTAL - 1;

    const goToQuestion = (nextIndex) => {
        if (nextIndex < 0 || nextIndex > TOTAL - 1) return;
        setQIndex(nextIndex);
        setSelected(answers[nextIndex] ?? null);
    };

    const handleConfirm = async () => {
        if (selected === null) return;

        const newAnswers = [...answers];
        newAnswers[qIndex] = selected;
        setAnswers(newAnswers);

        if (!isLast) {
            setQIndex(qIndex + 1);
            setSelected(newAnswers[qIndex + 1] ?? null);
            return;
        }

        // Última pregunta — calcular resultado
        const correctCount = QUESTIONS.reduce(
            (acc, q, i) => acc + (newAnswers[i] === q.correct ? 1 : 0),
            0,
        );
        const percent = Math.round((correctCount / TOTAL) * 100);
        const { level, intensity } = calcLevelAndIntensity(percent);
        const { strengths, weaknesses } = calcStrengthsAndWeaknesses(newAnswers);

        const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
        const mins = Math.floor(elapsed / 60);
        const secs = elapsed % 60;
        const tiempo = `${mins}:${String(secs).padStart(2, '0')}`;

        // Guardar para que SesionIniciadaScreen inicialice el plan
        await AsyncStorage.setItem(
            LEVEL_TEST_RESULT_KEY,
            JSON.stringify({ score: percent, level, intensity }),
        );
        await AsyncStorage.removeItem(PENDING_LEVEL_TEST_KEY);

        navigation.replace('LevelTestResult', {
            percent,
            correct: correctCount,
            total: TOTAL,
            level,
            aciertos: correctCount,
            fallos: TOTAL - correctCount,
            tiempo,
            strengths,
            weaknesses,
        });
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

                {/* Barra de progreso visual */}
                <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: `${((qIndex + 1) / TOTAL) * 100}%` }]} />
                </View>

                {/* Indicador de pregunta con navegación anterior/siguiente */}
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
                    <Text style={styles.progressLabel}>
                        Pregunta {qIndex + 1} de {TOTAL}
                    </Text>
                    <TouchableOpacity
                        onPress={() => goToQuestion(qIndex + 1)}
                        disabled={isLast || !answers[qIndex + 1]}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityLabel="Pregunta siguiente"
                    >
                        <Ionicons
                            name="chevron-forward"
                            size={18}
                            color={(isLast || !answers[qIndex + 1]) ? colors.grayMid : colors.textDark}
                        />
                    </TouchableOpacity>
                </View>

                {/* Chip de tema */}
                <View style={styles.topicChip}>
                    <Text style={styles.topicChipText}>{question.topicLabel}</Text>
                </View>

                {/* Enunciado */}
                <Text style={styles.questionText}>{question.question}</Text>

                {/* Opciones A–D */}
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
                                <Text style={[styles.optionLetter, isSelected && styles.optionLetterSelected]}>
                                    {opt.id}.
                                </Text>
                                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                                    {opt.text}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* Botón fijo inferior */}
            <View style={styles.bottomRow}>
                <TouchableOpacity
                    style={[styles.btnPrimary, selected === null && styles.btnPrimaryOff]}
                    onPress={handleConfirm}
                    disabled={selected === null}
                    activeOpacity={0.85}
                >
                    <Text style={styles.btnPrimaryText}>
                        {isLast ? 'Ver resultado' : 'Confirmar respuesta'}
                    </Text>
                </TouchableOpacity>
            </View>
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
        paddingBottom: spacing.sm,
    },
    backButton: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: colors.grayLight,
        alignItems: 'center', justifyContent: 'center',
    },
    backButtonSpacer: { width: 32 },
    headerTitle: {
        flex: 1, textAlign: 'center',
        fontSize: 18, fontWeight: '700', color: colors.textDark,
    },

    body: {
        flex: 1,
        paddingHorizontal: spacing.md + 2,
        paddingTop: spacing.sm,
        paddingBottom: 80,
    },

    progressBarTrack: {
        height: 4, borderRadius: 2,
        backgroundColor: '#E4E8F0',
        marginBottom: spacing.md,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: 4, borderRadius: 2,
        backgroundColor: colors.ctaGreen,
    },

    progressRow: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: spacing.md,
        marginBottom: spacing.sm,
    },
    progressLabel: { fontSize: 13, fontWeight: '700', color: colors.textDark },

    topicChip: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(36, 189, 144, 0.12)',
        borderRadius: 8,
        paddingVertical: 3, paddingHorizontal: 10,
        marginBottom: spacing.sm,
    },
    topicChipText: { fontSize: 10, fontWeight: '700', color: colors.ctaGreen },

    questionText: {
        fontSize: 15, fontWeight: '700', color: colors.textDark,
        lineHeight: 22, marginBottom: spacing.md,
    },

    optionsList: { gap: spacing.sm },
    option: {
        flexDirection: 'row', alignItems: 'flex-start',
        borderWidth: 1, borderColor: 'rgba(65, 41, 80, 0.3)',
        borderRadius: 14, backgroundColor: colors.white,
        paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md,
    },
    optionSelected: {
        borderColor: colors.ctaGreen, borderWidth: 2,
        backgroundColor: 'rgba(36, 189, 144, 0.06)',
    },
    optionLetter: { width: 26, fontSize: 15, fontWeight: '700', color: colors.textDark },
    optionLetterSelected: { color: colors.ctaGreen },
    optionText: { flex: 1, fontSize: 13, lineHeight: 18, color: colors.textDark },
    optionTextSelected: { color: colors.textDark, fontWeight: '600' },

    bottomRow: {
        position: 'absolute', bottom: spacing.md,
        left: spacing.md + 2, right: spacing.md + 2,
    },
    btnPrimary: {
        backgroundColor: colors.ctaGreen, borderRadius: 20,
        paddingVertical: spacing.md - 3, alignItems: 'center',
    },
    btnPrimaryOff: { opacity: 0.4 },
    btnPrimaryText: { color: colors.white, fontSize: 15, fontWeight: '700' },
});
