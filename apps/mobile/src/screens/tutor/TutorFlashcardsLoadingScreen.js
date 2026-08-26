import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Easing,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing } from '../../theme';
import FlashcardsSuccessModal from '../../components/FlashcardsSuccessModal';
import { tutorApi } from '../../api';

// Colores confirmados contra Figma (frame GENERANDO FLASHCARDS, Bloque 8)
// sin equivalente exacto en theme.js. Mismo patrón de overlay + tarjeta
// blanca que los pop-ups del Bloque 4.
const FIGMA = {
    overlay: '#000000',
    cardBorder: 'rgba(65,41,80,0.3)',
    pulseRingTint: 'rgba(246,150,36,0.15)',
    subtitleMuted: 'rgba(65,41,80,0.5)',
};

const DURATION_MS = 3000;

const STEPS = [
    'Analizando el tema…',
    'Extrayendo conceptos clave…',
    'Redactando flashcards…',
    'Preparando el mazo…',
];

function SparklesIcon({ width = 81, height = 76, color = colors.accentOrange }) {
    return (
        <Svg width={width} height={height} viewBox="0 0 81 76">
            <Path
                d="M32 8C32 24 20 36 4 36C20 36 32 48 32 64C32 48 44 36 60 36C44 36 32 24 32 8Z"
                fill="none"
                stroke={color}
                strokeWidth={4}
                strokeLinejoin="round"
            />
            <Path
                d="M63 4C63 11 58 16 51 16C58 16 63 21 63 28C63 21 68 16 75 16C68 16 63 11 63 4Z"
                fill="none"
                stroke={color}
                strokeWidth={3}
                strokeLinejoin="round"
            />
            <Path
                d="M63 48C63 53 59 57 54 57C59 57 63 61 63 66C63 61 67 57 72 57C67 57 63 53 63 48Z"
                fill="none"
                stroke={color}
                strokeWidth={3}
                strokeLinejoin="round"
            />
        </Svg>
    );
}

// ─── Pantalla ─────────────────────────────────────────────────────────────────
export default function TutorFlashcardsLoadingScreen({ navigation, route }) {
    const topicId    = route?.params?.topicId    ?? 'constitucion';
    const topicTitle = route?.params?.topicTitle ?? 'Tema de estudio';
    const oposicion  = route?.params?.oposicion  ?? 'aux-adm-estado';

    const progressAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim    = useRef(new Animated.Value(0.35)).current;
    const bounceAnim   = useRef(new Animated.Value(0)).current;
    const isMounted    = useRef(true);

    const [stepIndex, setStepIndex] = useState(0);
    const [showSuccess, setShowSuccess] = useState(false);
    const [deckResult, setDeckResult] = useState(null);

    useEffect(() => {
        isMounted.current = true;

        // Promesa que resuelve cuando la barra de progreso termina
        const animPromise = new Promise((resolve) => {
            Animated.timing(progressAnim, {
                toValue: 1,
                duration: DURATION_MS,
                easing: Easing.out(Easing.quad),
                useNativeDriver: false,
            }).start(({ finished }) => { if (finished) resolve(); });
        });

        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1,    duration: 750, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 0.35, duration: 750, useNativeDriver: true }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(bounceAnim, { toValue: -10, duration: 600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
                Animated.timing(bounceAnim, { toValue:   0, duration: 600, easing: Easing.in(Easing.ease),  useNativeDriver: true }),
            ])
        ).start();

        // Llamada a la API — se corre en paralelo con la animación
        const apiPromise = tutorApi
            .generateDeck(topicId, topicTitle, oposicion)
            .then((res) => (!res?.error && res?.data ? res.data : null))
            .catch(() => null);

        // Espera a que AMBAS terminen para mostrar el modal de éxito
        Promise.all([animPromise, apiPromise]).then(([, data]) => {
            if (!isMounted.current) return;
            setDeckResult(data);
            setShowSuccess(true);
        });

        const stepInterval = setInterval(() => {
            setStepIndex((prev) => (prev + 1) % STEPS.length);
        }, DURATION_MS / STEPS.length);

        return () => {
            isMounted.current = false;
            clearInterval(stepInterval);
            progressAnim.stopAnimation();
            pulseAnim.stopAnimation();
            bounceAnim.stopAnimation();
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    const cardCount = deckResult?.cards?.length ?? deckResult?.deck?.cardCount ?? 10;
    const mazoName  = deckResult?.deck?.topicTitle ?? topicTitle;

    const handleCancel = () => {
        isMounted.current = false;
        progressAnim.stopAnimation();
        pulseAnim.stopAnimation();
        bounceAnim.stopAnimation();
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.overlay} edges={['top', 'left', 'right']}>
            <View style={styles.card}>
                <Animated.View style={{ transform: [{ translateY: bounceAnim }] }}>
                    <View style={styles.iconWrap}>
                        <Animated.View style={[styles.pulseRing, { opacity: pulseAnim }]} />
                        <SparklesIcon />
                    </View>
                </Animated.View>

                <Text style={styles.title}>Creando tus flashcards</Text>
                <Text style={styles.subtitle}>La IA está extrayendo los conceptos clave.</Text>

                {/* Barra de progreso + paso actual — reales, sin dato de Figma
                    para este elemento, pero necesarios para dar feedback
                    mientras se genera el mazo. */}
                <View style={styles.progressTrack}>
                    <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
                </View>
                <Text style={styles.stepText}>{STEPS[stepIndex]}</Text>

                <TouchableOpacity onPress={handleCancel} accessibilityLabel="Cancelar generación" style={styles.cancelBtn}>
                    <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
            </View>

            {/* Modal de éxito — aparece cuando animación + API han terminado */}
            <FlashcardsSuccessModal
                visible={showSuccess}
                count={cardCount}
                mazoName={mazoName}
                onReviewNow={() => {
                    setShowSuccess(false);
                    navigation.navigate('TutorFlashcards', {
                        cards:  deckResult?.cards  ?? [],
                        deckId: deckResult?.deck?.id ?? null,
                        topicId,
                    });
                }}
                onClose={() => {
                    setShowSuccess(false);
                    navigation.goBack();
                }}
            />
        </SafeAreaView>
    );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: FIGMA.overlay,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 27,
    },
    card: {
        width: 348,
        backgroundColor: colors.white,
        borderRadius: 24,
        borderWidth: 0.32,
        borderColor: FIGMA.cardBorder,
        alignItems: 'center',
        paddingVertical: 32,
        paddingHorizontal: 28,
    },

    iconWrap: {
        width: 110,
        height: 110,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
    },
    pulseRing: {
        position: 'absolute',
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: FIGMA.pulseRingTint,
    },

    title: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 21.3,
        color: colors.textDark,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    subtitle: {
        fontFamily: 'Poppins-Light',
        fontSize: 13.8,
        color: colors.textDark,
        textAlign: 'center',
        lineHeight: 16.6,
        marginBottom: spacing.lg,
    },

    progressTrack: {
        width: '100%',
        height: 6,
        backgroundColor: FIGMA.pulseRingTint,
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: spacing.sm,
    },
    progressBar: {
        height: '100%',
        backgroundColor: colors.accentOrange,
        borderRadius: 3,
    },
    stepText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 12,
        color: FIGMA.subtitleMuted,
        letterSpacing: 0.2,
        marginBottom: spacing.md,
    },

    cancelBtn: {
        paddingHorizontal: 14,
        paddingVertical: 7,
    },
    cancelText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 13,
        color: FIGMA.subtitleMuted,
    },
});
