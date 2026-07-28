import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Easing,
    StatusBar,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import FlashcardsSuccessModal from '../../components/FlashcardsSuccessModal';
import { tutorApi } from '../../api';

// ─── Constantes ───────────────────────────────────────────────────────────────
const PURPLE = colors.purple;       // #7B4BC4
const PURPLE_BG = colors.purpleBg;  // #F1ECFA
const DURATION_MS = 3000;

const STEPS = [
    'Analizando el tema…',
    'Extrayendo conceptos clave…',
    'Redactando flashcards…',
    'Preparando el mazo…',
];

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

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

            <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                    isMounted.current = false;
                    progressAnim.stopAnimation();
                    pulseAnim.stopAnimation();
                    bounceAnim.stopAnimation();
                    navigation.goBack();
                }}
                accessibilityLabel="Cancelar generación"
            >
                <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>

            <View style={styles.content}>
                {/* Icono animado */}
                <Animated.View style={{ transform: [{ translateY: bounceAnim }] }}>
                    <View style={styles.iconWrap}>
                        <Animated.View style={[styles.pulseRing, { opacity: pulseAnim }]} />
                        <View style={styles.iconInner}>
                            <Ionicons name="layers-outline" size={56} color={PURPLE} />
                        </View>
                    </View>
                </Animated.View>

                {/* Texto */}
                <Text style={styles.title}>Creando tus flashcards…</Text>
                <Text style={styles.subtitle}>
                    La IA está extrayendo los conceptos clave del temario para generar un mazo personalizado.
                </Text>

                {/* Barra de progreso */}
                <View style={styles.progressTrack}>
                    <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
                </View>
                <Text style={styles.stepText}>{STEPS[stepIndex]}</Text>
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
    container: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        width: '100%',
    },

    // Anillo de pulso + icono
    iconWrap: {
        width: 110,
        height: 110,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xl + spacing.sm,
    },
    pulseRing: {
        position: 'absolute',
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: PURPLE_BG,
    },
    iconInner: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: PURPLE_BG,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Texto
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.dark,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    subtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 21,
        marginBottom: spacing.xl + spacing.sm,
        maxWidth: '85%',
    },

    // Progreso
    progressTrack: {
        width: '80%',
        height: 6,
        backgroundColor: colors.separator,
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: spacing.sm,
    },
    progressBar: {
        height: '100%',
        backgroundColor: PURPLE,
        borderRadius: 3,
    },
    stepText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textSecondary,
        letterSpacing: 0.2,
    },

    cancelBtn: {
        position: 'absolute',
        top: 16,
        right: 16,
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 12,
        backgroundColor: colors.separator,
    },
    cancelText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textSecondary,
    },
});
