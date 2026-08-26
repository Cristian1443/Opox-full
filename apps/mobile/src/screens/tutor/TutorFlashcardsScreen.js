import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    StatusBar,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import { tutorApi } from '../../api';

// ─── Mock — se sustituirá por las tarjetas del backend ───────────────────────
const MOCK_CARDS = [
    {
        id: '1',
        question: '¿Qué regula el artículo 14 de la Constitución?',
        answer:
            'El principio de igualdad ante la ley sin discriminación por nacimiento, raza, sexo, religión, opinión o cualquier otra condición o circunstancia personal o social.',
    },
    {
        id: '2',
        question: '¿Quién tiene la potestad legislativa exclusiva?',
        answer: 'Las Cortes Generales (Congreso y Senado).',
    },
    {
        id: '3',
        question: '¿Cuántos artículos tiene el Título I de la Constitución?',
        answer: '45 artículos, del 10 al 55.',
    },
];

const { width, height } = Dimensions.get('window');
const CARD_HEIGHT = height * 0.48;
const PURPLE = colors.purple;

// ─── 8.5 · ok — Pantalla de resultado del mazo ───────────────────────────────
function DeckCompleted({ knownCount, failedCards, total, onReviewFailed, onClose }) {
    const scaleAnim = useRef(new Animated.Value(0.5)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const unknownCount = failedCards.length;
    const hasFailed = unknownCount > 0;

    return (
        <View style={styles.doneOuter}>
            <Animated.View
                style={[
                    styles.doneContent,
                    { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
                ]}
            >
                {/* Trofeo */}
                <View style={styles.trophyWrap}>
                    <Ionicons name="trophy" size={64} color={colors.warning} />
                    <View style={styles.trophyRing} />
                </View>

                <Text style={styles.doneTitle}>¡Mazo repasado!</Text>

                {/* Stats */}
                <View style={styles.statsBox}>
                    <View style={styles.statCell}>
                        <Text style={[styles.statNum, { color: colors.success }]}>{knownCount}</Text>
                        <Text style={styles.statLabel}>SABÍAS</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statCell}>
                        <Text style={[styles.statNum, { color: colors.error }]}>{unknownCount}</Text>
                        <Text style={[styles.statLabel, { color: colors.error }]}>FALLASTE</Text>
                    </View>
                </View>

                {hasFailed && (
                    <Text style={styles.doneMsg}>
                        Las{' '}
                        <Text style={{ fontWeight: '800', color: colors.error }}>
                            {unknownCount}
                        </Text>{' '}
                        que fallaste volverán antes en el próximo repaso.
                    </Text>
                )}

                {/* Botones */}
                <View style={styles.doneBtns}>
                    {hasFailed && (
                        <TouchableOpacity
                            style={styles.primaryDoneBtn}
                            onPress={onReviewFailed}
                            activeOpacity={0.85}
                            accessibilityLabel="Repasar las tarjetas falladas"
                        >
                            <Ionicons name="refresh-circle" size={22} color="#fff" />
                            <Text style={styles.primaryDoneBtnText}>Repasar las falladas</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={styles.secondaryDoneBtn}
                        onPress={onClose}
                        activeOpacity={0.7}
                        accessibilityLabel="Volver al aula"
                    >
                        <Text style={styles.secondaryDoneBtnText}>Volver al aula</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </View>
    );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────
export default function TutorFlashcardsScreen({ navigation, route }) {
    const paramCards   = route?.params?.cards;
    // Si llega [] explícito (la IA no generó tarjetas), no caer en el mock
    const isEmpty      = Array.isArray(paramCards) && paramCards.length === 0;
    const initialCards = isEmpty ? [] : (paramCards?.length > 0 ? paramCards : MOCK_CARDS);
    const deckId       = route?.params?.deckId ?? null;
    const insets = useSafeAreaInsets();

    const [cards, setCards] = useState(initialCards);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [knownCount, setKnownCount] = useState(0);
    const [failedCards, setFailedCards] = useState([]);
    const [isDone, setIsDone] = useState(false);

    const spinAnim = useRef(new Animated.Value(0)).current;

    // ── Flip cross-platform (opacidad en midpoint, no backfaceVisibility) ─────
    const frontOpacity = spinAnim.interpolate({
        inputRange: [0, 0.4999, 0.5, 1],
        outputRange: [1, 1, 0, 0],
    });
    const backOpacity = spinAnim.interpolate({
        inputRange: [0, 0.4999, 0.5, 1],
        outputRange: [0, 0, 1, 1],
    });
    const frontRotateY = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });
    const backRotateY = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['180deg', '360deg'],
    });

    const handleFlip = useCallback(() => {
        Animated.timing(spinAnim, {
            toValue: isFlipped ? 0 : 1,
            duration: 380,
            useNativeDriver: true,
        }).start();
        setIsFlipped((v) => !v);
    }, [isFlipped, spinAnim]);

    const handleAnswer = useCallback(
        async (knew) => {
            const currentCard = cards[currentIndex];
            const isLastCard  = currentIndex >= cards.length - 1;

            if (knew) {
                setKnownCount((v) => v + 1);
            } else {
                setFailedCards((prev) => [...prev, currentCard]);
            }

            if (!isLastCard) {
                setCurrentIndex((v) => v + 1);
                setIsFlipped(false);
                spinAnim.setValue(0);
            } else {
                // Calcula totales finales con el estado actual + esta tarjeta
                const finalKnown     = knownCount + (knew ? 1 : 0);
                const finalFailed    = failedCards.length + (knew ? 0 : 1);
                const finalFailedIds = (knew ? failedCards : [...failedCards, currentCard])
                    .map((c) => c.id)
                    .filter(Boolean);

                if (deckId) {
                    try {
                        await tutorApi.submitReview(deckId, finalKnown, finalFailed, finalFailedIds);
                    } catch {}
                }
                setIsDone(true);
            }
        },
        [currentIndex, cards, spinAnim, knownCount, failedCards, deckId]
    );

    const handleReviewFailed = useCallback(() => {
        setCards(failedCards);
        setCurrentIndex(0);
        setIsFlipped(false);
        setKnownCount(0);
        setFailedCards([]);
        setIsDone(false);
        spinAnim.setValue(0);
    }, [failedCards, spinAnim]);

    if (isEmpty) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
                <TouchableOpacity
                    style={styles.emptyClose}
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Cerrar"
                >
                    <Ionicons name="close" size={22} color={colors.dark} />
                </TouchableOpacity>
                <View style={styles.emptyState}>
                    <Ionicons name="layers-outline" size={56} color={colors.textSecondary} />
                    <Text style={styles.emptyTitle}>No se generaron tarjetas</Text>
                    <Text style={styles.emptyMsg}>
                        La IA no pudo crear flashcards para este tema. Inténtalo de nuevo o elige otro tema.
                    </Text>
                    <TouchableOpacity
                        style={styles.emptyBtn}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.emptyBtnText}>Volver</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (isDone) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
                <DeckCompleted
                    knownCount={knownCount}
                    failedCards={failedCards}
                    total={cards.length}
                    onReviewFailed={handleReviewFailed}
                    onClose={() => navigation.navigate('AITutor')}
                />
            </SafeAreaView>
        );
    }

    const card = cards[currentIndex];
    const progressPct = ((currentIndex + 1) / cards.length) * 100;

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.iconBtn}
                    accessibilityLabel="Cerrar"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Ionicons name="close" size={22} color={colors.dark} />
                </TouchableOpacity>

                <View style={styles.progressBlock}>
                    <Text style={styles.progressLabel}>
                        {currentIndex + 1} / {cards.length}
                    </Text>
                    <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.iconBtn}
                    accessibilityLabel="Ayuda"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={() =>
                        Alert.alert(
                            '¿Cómo funciona el repaso?',
                            '• "La sabía" → la tarjeta aparecerá menos veces en el próximo repaso.\n\n• "No la sabía" → la tarjeta vuelve antes para reforzar el aprendizaje.\n\nEl sistema ajusta automáticamente la frecuencia según tu rendimiento.',
                            [{ text: 'Entendido' }]
                        )
                    }
                >
                    <Ionicons name="help-circle-outline" size={22} color={colors.dark} />
                </TouchableOpacity>
            </View>

            {/* Área de tarjeta — toca en cualquier punto para girar */}
            <TouchableOpacity
                style={styles.cardArea}
                onPress={handleFlip}
                activeOpacity={1}
                accessibilityLabel={isFlipped ? 'Girar al frente' : 'Ver respuesta'}
            >
                {/* Cara frontal */}
                <Animated.View
                    pointerEvents="none"
                    style={[
                        styles.card,
                        {
                            opacity: frontOpacity,
                            transform: [{ perspective: 1000 }, { rotateY: frontRotateY }],
                        },
                    ]}
                >
                    <Text style={styles.cardLabel}>PREGUNTA</Text>
                    <Text style={styles.cardText}>{card.question}</Text>
                    <View style={styles.flipHint}>
                        <Text style={styles.flipHintText}>Toca para girar</Text>
                        <Ionicons name="swap-horizontal" size={18} color={colors.textSecondary} />
                    </View>
                </Animated.View>

                {/* Cara trasera */}
                <Animated.View
                    pointerEvents="none"
                    style={[
                        styles.card,
                        styles.cardBack,
                        {
                            opacity: backOpacity,
                            transform: [{ perspective: 1000 }, { rotateY: backRotateY }],
                        },
                    ]}
                >
                    <Text style={[styles.cardLabel, { color: PURPLE }]}>RESPUESTA</Text>
                    <Text style={styles.cardText}>{card.answer}</Text>
                </Animated.View>
            </TouchableOpacity>

            {/* Zona inferior */}
            <View style={[styles.bottomZone, { paddingBottom: spacing.lg + insets.bottom }]}>
                {isFlipped ? (
                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.actionWrong]}
                            onPress={() => handleAnswer(false)}
                            activeOpacity={0.82}
                            accessibilityLabel="No la sabía"
                        >
                            <Ionicons name="close-circle" size={22} color="#fff" />
                            <Text style={styles.actionBtnText}>No la sabía</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionBtn, styles.actionCorrect]}
                            onPress={() => handleAnswer(true)}
                            activeOpacity={0.82}
                            accessibilityLabel="La sabía"
                        >
                            <Ionicons name="checkmark-circle" size={22} color="#fff" />
                            <Text style={styles.actionBtnText}>La sabía</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={styles.flipBtn}
                        onPress={handleFlip}
                        activeOpacity={0.85}
                        accessibilityLabel="Ver respuesta"
                    >
                        <Text style={styles.flipBtnText}>Ver respuesta</Text>
                        <Ionicons name="chevron-down" size={22} color="#fff" />
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },

    // ── Estado vacío ─────────────────────────────────────────────────────────
    emptyClose: {
        position: 'absolute',
        top: 16,
        left: 16,
        zIndex: 1,
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
        gap: spacing.md,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.dark,
        textAlign: 'center',
    },
    emptyMsg: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 21,
    },
    emptyBtn: {
        marginTop: spacing.sm,
        backgroundColor: PURPLE,
        paddingHorizontal: spacing.xl,
        paddingVertical: 13,
        borderRadius: 14,
    },
    emptyBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },

    // ── Header ────────────────────────────────────────────────────────────────
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
    },
    iconBtn: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressBlock: {
        flex: 1,
        marginHorizontal: spacing.md,
        alignItems: 'center',
    },
    progressLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textSecondary,
        marginBottom: 5,
    },
    progressTrack: {
        height: 5,
        backgroundColor: colors.separator,
        borderRadius: 3,
        overflow: 'hidden',
        alignSelf: 'stretch',
    },
    progressFill: {
        height: '100%',
        backgroundColor: PURPLE,
        borderRadius: 3,
    },

    // ── Tarjeta ───────────────────────────────────────────────────────────────
    cardArea: {
        flex: 1,
        marginHorizontal: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    card: {
        position: 'absolute',
        width: width - spacing.md * 2,
        height: CARD_HEIGHT,
        backgroundColor: colors.card,
        borderRadius: 22,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.xl,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 18,
        elevation: 8,
    },
    cardBack: {
        backgroundColor: colors.purpleBg,
        borderWidth: 2,
        borderColor: PURPLE + '40',
    },
    cardLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: colors.textSecondary,
        letterSpacing: 1.2,
        marginBottom: spacing.lg,
    },
    cardText: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.dark,
        textAlign: 'center',
        lineHeight: 29,
    },
    flipHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: spacing.xl,
    },
    flipHintText: {
        color: colors.textSecondary,
        fontSize: 13,
        fontWeight: '600',
    },

    // ── Zona inferior ─────────────────────────────────────────────────────────
    bottomZone: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
    },
    actionRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 15,
        borderRadius: 16,
    },
    actionWrong: { backgroundColor: colors.error },
    actionCorrect: { backgroundColor: colors.success },
    actionBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    flipBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: PURPLE,
        paddingVertical: 16,
        borderRadius: 16,
        shadowColor: PURPLE,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    flipBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },

    // ── Mazo completado (8.5 · ok) ────────────────────────────────────────────
    doneOuter: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl,
    },
    doneContent: {
        alignItems: 'center',
        width: '100%',
        maxWidth: 360,
    },
    trophyWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg + 4,
    },
    trophyRing: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: colors.warning,
        opacity: 0.3,
    },
    doneTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: colors.dark,
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    statsBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderRadius: 18,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.separator,
        width: '100%',
    },
    statCell: {
        flex: 1,
        alignItems: 'center',
    },
    statNum: {
        fontSize: 34,
        fontWeight: '800',
        marginBottom: 3,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.textSecondary,
        letterSpacing: 0.6,
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: colors.separator,
        marginHorizontal: spacing.md,
    },
    doneMsg: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 21,
        marginBottom: spacing.xl + spacing.sm,
    },
    doneBtns: {
        width: '100%',
        gap: spacing.sm,
    },
    primaryDoneBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: PURPLE,
        paddingVertical: 15,
        borderRadius: 16,
        shadowColor: PURPLE,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryDoneBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    secondaryDoneBtn: {
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.separator,
    },
    secondaryDoneBtnText: {
        color: colors.textSecondary,
        fontSize: 15,
        fontWeight: '600',
    },
});
