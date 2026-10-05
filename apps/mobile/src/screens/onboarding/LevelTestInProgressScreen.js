import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    ActivityIndicator,
    Alert,
} from 'react-native';
import Text from '../../components/AppText';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from '../../theme';
import { trainingApi } from '../../api';
import AppHeader from '../../components/AppHeader';

// Persiste la pregunta actual para reanudar si el usuario cierra la app a medias.
export const PENDING_LEVEL_TEST_KEY = 'opox.pendingLevelTestIndex';

// Resultado calculado: lo lee SesionIniciadaScreen para inicializar el plan.
export const LEVEL_TEST_RESULT_KEY = 'opox.levelTestResult';

// ─── 10 preguntas de fallback estático ───────────────────────────────────────
// El Motor IA devuelve 10 preguntas dinámicas; este array se usa solo si el
// Motor falla o tarda más de 5 s. topic: para calcular fortalezas/debilidades.
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
];

// Calcula nivel e intensidad a partir del porcentaje de aciertos
function calcLevelAndIntensity(percent) {
    if (percent >= 75) return { level: 'Avanzado', intensity: 'high' };
    if (percent >= 50) return { level: 'Intermedio', intensity: 'medium' };
    return { level: 'Básico', intensity: 'low' };
}

// Calcula fortalezas y debilidades por área temática
function calcStrengthsAndWeaknesses(answers, qs = QUESTIONS) {
    const byTopic = {};
    qs.forEach((q, i) => {
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
    const insets = useSafeAreaInsets();
    // null = todavía esperando respuesta del backend (bloquea la UI)
    const [questions, setQuestions] = useState(null);
    const [qIndex, setQIndex] = useState(0);
    const [selected, setSelected] = useState(null);
    const [answers, setAnswers] = useState([]); // respuesta elegida por pregunta
    const hasRestoredRef = useRef(false);
    // Se asigna en el momento en que el usuario ve las preguntas por primera vez
    const startTimeRef = useRef(null);
    // true justo antes del `replace` a LevelTestResult: esa salida es el final
    // natural del test y no debe pedir confirmación.
    const allowLeaveRef = useRef(false);

    // Esperar la respuesta del backend antes de mostrar cualquier pregunta.
    // El backend ya gestiona el fallback a estáticas si el Motor falla —
    // solo usamos QUESTIONS aquí si hay error de red (backend inaccesible).
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const oposicion =
                    (await AsyncStorage.getItem('opox.pendingOposicion')) ??
                    'policia-local-galicia';
                const res = await trainingApi.getLevelTestQuestions(oposicion);
                if (!cancelled && !res?.error && Array.isArray(res?.data) && res.data.length >= 5) {
                    startTimeRef.current = Date.now();
                    setQuestions(res.data);
                    return;
                }
            } catch { /* error de red */ }
            // Fallback local solo si el backend no respondió
            if (!cancelled) {
                startTimeRef.current = Date.now();
                setQuestions(QUESTIONS);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // Reanuda desde la pregunta guardada — solo cuando las preguntas ya cargaron
    useEffect(() => {
        if (!questions) return;
        (async () => {
            const saved = await AsyncStorage.getItem(PENDING_LEVEL_TEST_KEY);
            const savedIndex = saved != null ? parseInt(saved, 10) : NaN;
            if (Number.isInteger(savedIndex) && savedIndex > 0 && savedIndex < questions.length) {
                setQIndex(savedIndex);
            }
            hasRestoredRef.current = true;
        })();
    }, [questions]);

    // Persiste la pregunta actual para recuperar si el usuario cierra la app.
    // Debe estar antes del return condicional para no violar las Reglas de Hooks.
    useEffect(() => {
        if (!hasRestoredRef.current) return;
        AsyncStorage.setItem(PENDING_LEVEL_TEST_KEY, String(qIndex));
    }, [qIndex]);

    // Confirmación al salir (botón atrás del header, back físico de Android o
    // cualquier otra acción que saque la pantalla del stack). El swipe-back de
    // iOS está desactivado en el navigator. El progreso ya se persiste en
    // PENDING_LEVEL_TEST_KEY, así que basta con un confirm simple.
    // Debe estar antes del return condicional (Reglas de Hooks).
    useEffect(() => {
        if (!questions) return undefined;
        const unsubscribe = navigation.addListener('beforeRemove', (e) => {
            if (allowLeaveRef.current) return;
            e.preventDefault();
            Alert.alert(
                'Salir del test',
                'Tu progreso se guarda y podrás retomar el test de nivel más tarde.',
                [
                    { text: 'Seguir con el test', style: 'cancel' },
                    {
                        text: 'Salir',
                        style: 'destructive',
                        onPress: () => {
                            allowLeaveRef.current = true;
                            navigation.dispatch(e.data.action);
                        },
                    },
                ],
            );
        });
        return unsubscribe;
    }, [navigation, questions]);

    // Pantalla de carga completa — bloquea hasta recibir preguntas del Motor
    if (!questions) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
                <View style={styles.loadingScreen}>
                    <ActivityIndicator size="large" color={colors.purple} />
                    <Text style={styles.loadingScreenTitle}>Preparando tu test…</Text>
                    <Text style={styles.loadingScreenSub}>
                        La IA está seleccionando las preguntas para tu oposición
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    const total = questions.length;

    const question = questions[qIndex];
    const isFirst = qIndex === 0;
    const isLast = qIndex >= total - 1;

    const goToQuestion = (nextIndex) => {
        if (nextIndex < 0 || nextIndex > total - 1) return;
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
        const correctCount = questions.reduce(
            (acc, q, i) => acc + (newAnswers[i] === q.correct ? 1 : 0),
            0,
        );
        const percent = Math.round((correctCount / total) * 100);
        const { level, intensity } = calcLevelAndIntensity(percent);
        const { strengths, weaknesses } = calcStrengthsAndWeaknesses(newAnswers, questions);

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

        allowLeaveRef.current = true;
        navigation.replace('LevelTestResult', {
            percent,
            correct: correctCount,
            total,
            level,
            aciertos: correctCount,
            fallos: total - correctCount,
            tiempo,
            strengths,
            weaknesses,
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

            {/* Si el test se reanudó tras cerrar la app (Splash hace un `replace`),
                no hay pantalla anterior en el historial — el progreso ya quedó
                guardado, así que "volver" sale al inicio del onboarding. */}
            <AppHeader
                title="Test de nivel"
                onBack={() => {
                    if (navigation.canGoBack()) navigation.goBack();
                    else navigation.replace('OnboardingSlider');
                }}
            />

            {/* Cuerpo principal */}
            <View style={styles.body}>

                {/* Barra de progreso visual */}
                <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: `${((qIndex + 1) / total) * 100}%` }]} />
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
                        Pregunta {qIndex + 1} de {total}
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

            {/* Botón fijo inferior — se suma insets.bottom porque un View absoluto
                no hereda el padding de SafeAreaView; sin esto el botón queda tapado
                por la barra de navegación del sistema en dispositivos con
                navegación por botones. */}
            <View style={[styles.bottomRow, { bottom: spacing.md + insets.bottom }]}>
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

    loadingScreen: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
        gap: spacing.md,
    },
    loadingScreenTitle: {
        fontSize: 17, fontWeight: '700',
        color: colors.textDark, textAlign: 'center',
    },
    loadingScreenSub: {
        fontSize: 13, color: colors.textDark, opacity: 0.5,
        textAlign: 'center', lineHeight: 18,
    },
    body: {
        flex: 1,
        paddingHorizontal: spacing.md + 2,
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
    // Figma: seleccionada = borde lila 2px sobre fondo blanco (no verde).
    optionSelected: {
        borderColor: colors.selectionBorder, borderWidth: 2,
        backgroundColor: colors.white,
    },
    optionLetter: { width: 26, fontSize: 15, fontWeight: '700', color: colors.textDark },
    optionLetterSelected: { color: colors.textDark },
    optionText: { flex: 1, fontSize: 13, lineHeight: 18, color: colors.textDark },
    optionTextSelected: { color: colors.textDark },

    // Figma: botón centrado (~78% del ancho), más alto y con esquinas amplias.
    bottomRow: {
        position: 'absolute', bottom: spacing.md,
        left: 0, right: 0, alignItems: 'center',
    },
    btnPrimary: {
        width: '78%',
        backgroundColor: colors.ctaGreen, borderRadius: 14,
        paddingVertical: 16, alignItems: 'center',
    },
    btnPrimaryOff: { opacity: 0.4 },
    btnPrimaryText: { color: colors.white, fontSize: 16, fontWeight: '600' },
});
