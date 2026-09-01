import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing } from '../../theme';
import { tutorApi } from '../../api';

// Colores confirmados contra Figma (pop-up MAZO COMPLETADO, Bloque 8) sin
// equivalente exacto en theme.js. Mismo patrón de overlay + tarjeta que el
// resto de pop-ups de la app.
const FIGMA = {
    overlay: '#000000',
    cardBorder: 'rgba(65,41,80,0.3)',
};

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

const CARD_WIDTH = 342.7;
const CARD_HEIGHT = 493.8;

function CheckBadgeIcon({ width = 107, height = 70, color = colors.ctaGreen }) {
    return (
        <Svg width={width} height={height} viewBox="0 0 107 70">
            <Path d="M4 36L38 66L103 4" stroke={color} strokeWidth={16} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function FlipIcon({ size = 18, color = colors.textDark }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path
                d="M4 12C4 7.58 7.58 4 12 4C15 4 17.6 5.7 19 8.2M20 12C20 16.42 16.42 20 12 20C9 20 6.4 18.3 5 15.8"
                stroke={color}
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
            />
            <Path d="M19 4V8.2H14.8" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M5 20V15.8H9.2" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

// ─── Pop-up · Mazo completado (mismo patrón overlay + tarjeta que el resto
// de pop-ups de la app). El backend ya reprioriza las tarjetas falladas
// para el próximo repaso vía tutorApi.submitReview — por eso Figma no
// pide un botón de "repasar falladas ahora": el mensaje ya lo comunica.
function DeckCompleted({ knownCount, failedCount, onEmpezarTest, onVolverAlAula }) {
    const totalCount = knownCount + failedCount;
    return (
        <View style={styles.doneOverlay}>
            <View style={styles.doneCard}>
                <View style={styles.doneIconWrap}>
                    <CheckBadgeIcon />
                </View>

                <Text style={styles.doneTitle}>¡Mazo repasado!</Text>

                <Text style={styles.doneSubtitle}>
                    Sabías {knownCount} de {totalCount}.
                    {failedCount > 0 ? ` Las ${failedCount} que fallaste volverán antes en el próximo repaso.` : ''}
                </Text>

                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={onEmpezarTest}
                    activeOpacity={0.85}
                    accessibilityLabel="Empezar test"
                >
                    <Text style={styles.primaryButtonText}>Empezar test</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.doneSecondaryButton}
                    onPress={onVolverAlAula}
                    activeOpacity={0.7}
                    accessibilityLabel="Volver al aula"
                >
                    <Text style={styles.doneSecondaryButtonText}>Volver al aula</Text>
                </TouchableOpacity>
            </View>
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
    const topicId      = route?.params?.topicId ?? null;
    const insets = useSafeAreaInsets();

    const [cards] = useState(initialCards);
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

    if (isEmpty) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <TouchableOpacity
                    style={styles.emptyClose}
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Cerrar"
                >
                    <Ionicons name="close" size={22} color={colors.textDark} />
                </TouchableOpacity>
                <View style={styles.emptyState}>
                    <Ionicons name="layers-outline" size={56} color={colors.textDark} />
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
                <DeckCompleted
                    knownCount={knownCount}
                    failedCount={failedCards.length}
                    onEmpezarTest={() => (
                        topicId
                            ? navigation.navigate('GeneratorConfig', { topicId, questionCount: 20 })
                            : navigation.navigate('AITutor')
                    )}
                    onVolverAlAula={() => navigation.navigate('AITutor')}
                />
            </SafeAreaView>
        );
    }

    const card = cards[currentIndex];

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.iconBtn}
                    accessibilityLabel="Volver"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Ionicons name="chevron-back" size={24} color={colors.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Flashcards</Text>
                <View style={styles.iconBtn} />
            </View>

            {/* Área de tarjeta — toca en cualquier punto para girar */}
            <TouchableOpacity
                style={styles.cardArea}
                onPress={handleFlip}
                activeOpacity={1}
                accessibilityLabel={isFlipped ? 'Girar al frente' : 'Ver respuesta'}
            >
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
                        <FlipIcon />
                        <Text style={styles.flipHintText}>Toca para girar</Text>
                    </View>
                </Animated.View>

                <Animated.View
                    pointerEvents="none"
                    style={[
                        styles.card,
                        {
                            opacity: backOpacity,
                            transform: [{ perspective: 1000 }, { rotateY: backRotateY }],
                        },
                    ]}
                >
                    <Text style={styles.cardLabel}>RESPUESTA</Text>
                    <Text style={styles.cardText}>{card.answer}</Text>
                </Animated.View>
            </TouchableOpacity>

            {/* Zona inferior — Figma solo confirma los 2 botones de autoevaluación;
                el CTA "Ver respuesta" previo al flip no está en el frame pero es
                necesario (no se puede autoevaluar sin ver antes la respuesta). */}
            <View style={[styles.bottomZone, { paddingBottom: spacing.md + insets.bottom }]}>
                {isFlipped ? (
                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={() => handleAnswer(false)}
                            activeOpacity={0.7}
                            accessibilityLabel="No la sabía"
                        >
                            <Text style={styles.secondaryButtonText}>No la sabía</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={() => handleAnswer(true)}
                            activeOpacity={0.85}
                            accessibilityLabel="La sabía"
                        >
                            <Text style={styles.primaryButtonText}>La sabía</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={styles.revealButton}
                        onPress={handleFlip}
                        activeOpacity={0.85}
                        accessibilityLabel="Ver respuesta"
                    >
                        <Text style={styles.revealButtonText}>Ver respuesta</Text>
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
        backgroundColor: colors.white,
    },

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
        fontFamily: 'Poppins-SemiBold',
        fontSize: 20,
        color: colors.textDark,
        textAlign: 'center',
    },
    emptyMsg: {
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        color: colors.textDark,
        textAlign: 'center',
        lineHeight: 21,
    },
    emptyBtn: {
        marginTop: spacing.sm,
        backgroundColor: colors.purple,
        paddingHorizontal: spacing.xl,
        paddingVertical: 13,
        borderRadius: 14,
    },
    emptyBtnText: {
        fontFamily: 'Poppins-SemiBold',
        color: colors.white,
        fontSize: 15,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
    },
    iconBtn: { width: 32, padding: 4 },
    headerTitle: {
        flex: 1,
        fontFamily: 'Poppins-SemiBold',
        fontSize: 21.3,
        color: colors.textDark,
        textAlign: 'center',
    },

    // ── Tarjeta ───────────────────────────────────────────────────────────────
    cardArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    card: {
        position: 'absolute',
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        backgroundColor: colors.white,
        borderRadius: 15.1,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.xl,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
    },
    cardLabel: {
        fontFamily: 'Poppins-Regular',
        fontSize: 16,
        color: colors.purple,
        marginBottom: spacing.md,
    },
    cardText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 23.1,
        color: colors.textDark,
        textAlign: 'center',
        lineHeight: 29,
    },
    flipHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: spacing.xl,
    },
    flipHintText: {
        fontFamily: 'Poppins-Light',
        fontSize: 16,
        color: colors.textDark,
    },

    // ── Zona inferior ─────────────────────────────────────────────────────────
    bottomZone: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    secondaryButton: {
        width: 167,
        height: 61,
        borderRadius: 14.2,
        borderWidth: 0.44,
        borderColor: colors.textDark,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: colors.textDark,
    },
    primaryButton: {
        width: 167,
        height: 61,
        borderRadius: 14.2,
        backgroundColor: colors.ctaGreen,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButtonText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: colors.white,
    },
    revealButton: {
        height: 61,
        borderRadius: 14.2,
        backgroundColor: colors.accentOrange,
        alignItems: 'center',
        justifyContent: 'center',
    },
    revealButtonText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: colors.white,
    },

    // ── Pop-up · Mazo completado (mismo patrón overlay + tarjeta que el
    // resto de la app) ─────────────────────────────────────────────────────
    doneOverlay: {
        flex: 1,
        backgroundColor: FIGMA.overlay,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 27,
    },
    doneCard: {
        width: 348,
        backgroundColor: colors.white,
        borderRadius: 24,
        borderWidth: 0.32,
        borderColor: FIGMA.cardBorder,
        alignItems: 'center',
        paddingVertical: 32,
        paddingHorizontal: 28,
    },
    doneIconWrap: {
        marginBottom: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    doneTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 21.3,
        color: colors.textDark,
        textAlign: 'center',
        marginBottom: 12,
    },
    doneSubtitle: {
        fontFamily: 'Poppins-Light',
        fontSize: 13.8,
        color: colors.textDark,
        textAlign: 'center',
        lineHeight: 16.6,
        marginBottom: spacing.lg,
    },
    doneSecondaryButton: {
        width: 322,
        height: 61,
        borderRadius: 14.2,
        borderWidth: 0.44,
        borderColor: colors.textDark,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
    },
    doneSecondaryButtonText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: colors.textDark,
    },
});
