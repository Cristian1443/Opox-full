import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    View,
    Image,
    StyleSheet,
    TouchableOpacity,
    Animated,
    FlatList,
    ActivityIndicator,
} from 'react-native';
import Text from '../../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing } from '../../theme';
import { tutorApi, api } from '../../api';

// Mismo fondo texturizado "cebra" que LoginScreen.js (assets/login/hero_bg.jpg)
// — el patrón se concentra arriba y se desvanece a gris plano hacia abajo.
const HERO_BG = require('../../../assets/login/hero_bg.jpg');

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

// Icono exacto exportado de Figma para "Toca para girar".
function FlipIcon({ size = 18, color = colors.textDark }) {
    return (
        <Svg width={size} height={(size * 65) / 61} viewBox="0 0 61 65" fill="none">
            <Path d="M7.80661 23.9545C10.4201 19.4279 14.4539 15.8899 19.2827 13.889C24.1115 11.8881 29.4655 11.5361 34.5147 12.8875C37.5269 13.6943 40.3506 15.0866 42.8247 16.9848C45.2987 18.883 47.3746 21.2499 48.9338 23.9505C50.493 26.6511 51.5049 29.6323 51.9117 32.724C52.3186 35.8157 52.1125 38.9573 51.3051 41.9693C50.4983 44.9815 49.106 47.8052 47.2078 50.2793C45.3096 52.7533 42.9427 54.8292 40.2421 56.3884C37.5415 57.9476 34.5603 58.9595 31.4686 59.3663C28.3769 59.7732 25.2353 59.5671 22.2233 58.7597L22.8705 56.3444C25.5653 57.0675 28.3762 57.2524 31.1426 56.8887C33.9089 56.525 36.5765 55.6197 38.9929 54.2247C41.4092 52.8296 43.527 50.972 45.2251 48.7581C46.9233 46.5443 48.1686 44.0175 48.8898 41.3221C49.6129 38.6273 49.7978 35.8164 49.4341 33.05C49.0704 30.2837 48.1651 27.6161 46.7701 25.1997C45.375 22.7834 43.5174 20.6656 41.3035 18.9675C39.0897 17.2693 36.5629 16.024 33.8675 15.3028C29.3504 14.09 24.5591 14.4024 20.2378 16.1918C15.9164 17.9811 12.3068 21.1471 9.96924 25.1983L7.80661 23.9545Z" fill={color} />
            <Path d="M8.1383 16.4358L9.70253 23.522L16.728 22.7132L17.0154 25.186L8.86915 26.1219L7.74712 26.2535L7.50348 25.1576L5.70017 16.9767L8.1383 16.4358Z" fill={color} />
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

// ─── Selector de temas — se muestra cuando el usuario entra desde el hub ─────
function TopicPicker({ oposicion, onSelect, onBack }) {
    const [topics, setTopics]   = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Reutilizamos listSummaries porque devuelve la misma lista de temas del
        // temario (con topicId + topicTitle). Alternativa: /training/topics.
        tutorApi.listSummaries(oposicion)
            .then((res) => {
                if (!res?.error && Array.isArray(res?.data)) setTopics(res.data);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [oposicion]);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="chevron-back" size={24} color={colors.textDark} />
                </TouchableOpacity>
                <Text style={styles.pickerTitle}>Flashcards</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 40 }} color={colors.accentOrange} />
            ) : topics.length === 0 ? (
                <View style={styles.pickerEmpty}>
                    <Ionicons name="layers-outline" size={44} color={colors.textDark} />
                    <Text style={styles.pickerEmptyText}>
                        Aún no hay temas para tu oposición.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={topics}
                    keyExtractor={(t) => t.topicId ?? t.id}
                    ListHeaderComponent={
                        <Text style={styles.pickerHint}>Elige un tema para generar el mazo con la IA.</Text>
                    }
                    contentContainerStyle={styles.pickerList}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.topicRow}
                            onPress={() => onSelect(item)}
                            activeOpacity={0.75}
                        >
                            <View style={styles.topicIcon}>
                                <Ionicons name="layers-outline" size={20} color={colors.purple} />
                            </View>
                            <Text style={styles.topicName} numberOfLines={3}>{item.topicTitle}</Text>
                            <Ionicons name="chevron-forward" size={18} color="rgba(65,41,80,0.5)" />
                        </TouchableOpacity>
                    )}
                />
            )}
        </SafeAreaView>
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

    // Si el usuario entra desde el hub sin params, mostrar picker de temas primero.
    const [oposicion, setOposicion] = useState(route?.params?.oposicion ?? 'policia-local-galicia');
    useEffect(() => {
        if (route?.params?.oposicion) return;
        api.loadSession().then((session) => {
            const s = session?.user?.oposicion ?? session?.user?.user_metadata?.oposicion;
            if (s) setOposicion(s);
        }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const showPicker = !paramCards && !topicId;
    if (showPicker) {
        return (
            <TopicPicker
                oposicion={oposicion}
                onSelect={(t) => navigation.replace('TutorFlashcardsLoading', {
                    topicId: t.topicId,
                    topicTitle: t.topicTitle,
                    oposicion,
                })}
                onBack={() => navigation.goBack()}
            />
        );
    }

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
            {/* hero_bg.jpg concentra el patrón arriba y se desvanece a gris plano
                hacia abajo (mismo asset que LoginScreen). Aquí necesitamos la
                cebra en TODA la pantalla, así que ponemos una copia normal
                arriba y otra girada 180° abajo — la tarjeta blanca opaca tapa
                la unión en el centro. */}
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                <Image source={HERO_BG} style={styles.heroBgTop} resizeMode="cover" />
                <Image source={HERO_BG} style={styles.heroBgBottom} resizeMode="cover" />
            </View>

            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backBtn}
                    accessibilityLabel="Volver"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Feather name="chevron-left" size={22} color={colors.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Flashcards</Text>
                <View style={styles.headerPlaceholder} />
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

            {/* Figma muestra los 2 botones de autoevaluación siempre visibles,
                tanto en la pregunta como en la respuesta — no hay CTA
                intermedio de "Ver respuesta". El usuario puede girar la
                tarjeta tocándola en cualquier momento antes de autoevaluarse. */}
            <View style={[styles.bottomZone, { paddingBottom: spacing.md + insets.bottom }]}>
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
            </View>
        </SafeAreaView>
    );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F6',
    },
    heroBgTop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '55%',
        opacity: 0.8,
    },
    heroBgBottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '55%',
        opacity: 0.8,
        transform: [{ rotate: '180deg' }],
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
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(65, 41, 80, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerPlaceholder: { width: 44, height: 44 },
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

    // ── Picker ─────────────────────────────────────────────────────────────
    pickerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#D9D9D9',
    },
    pickerTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 21.3,
        color: colors.textDark,
    },
    pickerHint: {
        fontFamily: 'Poppins-Regular',
        fontSize: 13,
        color: 'rgba(65,41,80,0.5)',
        marginBottom: spacing.md,
    },
    pickerList: {
        padding: spacing.md,
        gap: spacing.sm,
    },
    pickerEmpty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.md,
        padding: spacing.xl,
    },
    pickerEmptyText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 15,
        color: 'rgba(65,41,80,0.5)',
        textAlign: 'center',
    },
    topicRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EDEDED',
        borderRadius: 14,
        padding: spacing.md,
        gap: spacing.md,
    },
    topicIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: `${colors.purple}18`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    topicName: {
        flex: 1,
        fontFamily: 'Poppins-SemiBold',
        fontSize: 14,
        color: colors.textDark,
    },
});
