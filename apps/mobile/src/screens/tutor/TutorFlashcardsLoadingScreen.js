import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    StyleSheet,
    Animated,
    Easing,
    TouchableOpacity,
} from 'react-native';
import Text from '../../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing } from '../../theme';
import FlashcardsSuccessModal from '../../components/FlashcardsSuccessModal';
import { tutorApi, api } from '../../api';

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

// Icono exacto exportado de Figma (chispas) para "Creando tus flashcards".
function SparklesIcon({ width = 91, height = 86, color = colors.accentOrange }) {
    return (
        <Svg width={width} height={height} viewBox="0 0 182 172" fill="none">
            <Path d="M134.581 144.046C137.127 144.043 139.649 144.542 141.999 145.515C144.349 146.488 146.48 147.914 148.27 149.712C150.078 151.511 151.51 153.647 152.483 155.998C153.456 158.348 153.952 160.866 153.942 163.407C153.938 160.864 154.441 158.345 155.421 155.995C156.401 153.644 157.839 151.509 159.652 149.712C161.441 147.914 163.573 146.488 165.923 145.515C168.273 144.542 170.794 144.043 173.341 144.046C170.794 144.049 168.273 143.549 165.923 142.577C163.573 141.604 161.441 140.178 159.652 138.38C157.839 136.582 156.401 134.447 155.421 132.097C154.441 129.747 153.938 127.228 153.942 124.685C153.952 127.226 153.456 129.744 152.483 132.094C151.51 134.444 150.078 136.581 148.27 138.38C146.48 140.178 144.349 141.604 141.999 142.577C139.649 143.549 137.127 144.049 134.581 144.046ZM134.581 27.9534C137.138 27.97 139.666 28.4929 142.016 29.4916C144.367 30.4903 146.493 31.9446 148.27 33.7692C150.078 35.5687 151.51 37.705 152.483 40.0553C153.456 42.4056 153.952 44.9237 153.942 47.4647C153.938 44.9213 154.441 42.4024 155.421 40.0522C156.401 37.702 157.839 35.5669 159.652 33.7692C161.441 31.9718 163.573 30.5452 165.923 29.5725C168.273 28.5999 170.794 28.1005 173.341 28.1034C170.794 28.1064 168.273 27.607 165.923 26.6343C163.573 25.6617 161.441 24.2351 159.652 22.4376C157.839 20.64 156.401 18.5049 155.421 16.1547C154.441 13.8045 153.938 11.2855 153.942 8.74219C153.952 11.2832 153.456 13.8012 152.483 16.1516C151.51 18.5019 150.078 20.6382 148.27 22.4376C146.468 24.208 144.331 25.6069 141.981 26.5536C139.632 27.5002 137.117 27.976 134.581 27.9534ZM66.78 144.046C66.7766 128.672 72.8924 113.919 83.7964 102.997C89.1657 97.6269 95.5504 93.3612 102.584 90.4444C109.618 87.5277 117.164 86.0172 124.787 85.9996C117.144 85.9968 109.578 84.4936 102.523 81.5764C95.4688 78.6592 89.0657 74.3857 83.6829 69.0022C72.7789 58.0803 66.6632 43.3272 66.6665 27.9534C66.6699 43.3272 60.5541 58.0803 49.6501 69.0022C44.2808 74.3723 37.8961 78.638 30.8621 81.5548C23.828 84.4715 16.283 85.982 8.65946 85.9996C16.3021 86.0024 23.8686 87.5056 30.9232 90.4228C37.9777 93.34 44.3808 97.6135 49.7636 102.997C60.6676 113.919 66.7833 128.672 66.78 144.046Z" stroke={color} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

// ─── Pantalla ─────────────────────────────────────────────────────────────────
export default function TutorFlashcardsLoadingScreen({ navigation, route }) {
    // Tema 1 hex real del curso Policía de Galicia como fallback — si por alguna
    // navegación externa no llega topicId, evitamos mandar 'constitucion' (slug del
    // curso viejo) que el Motor no reconoce y devuelve tema_no_encontrado.
    const topicId    = route?.params?.topicId    ?? 'cb93fdfcc3944529';
    const topicTitle = route?.params?.topicTitle ?? 'Tema 1';
    // Si no llega desde el picker, cargar de la sesión guardada para respetar la oposición
    // real del usuario. 'policia-local-galicia' como fallback final (default único).
    const [oposicion, setOposicion] = useState(route?.params?.oposicion ?? 'policia-local-galicia');
    useEffect(() => {
        if (route?.params?.oposicion) return;
        api.loadSession().then((session) => {
            const s = session?.user?.oposicion ?? session?.user?.user_metadata?.oposicion;
            if (s) setOposicion(s);
        }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
                    navigation.replace('TutorFlashcards', {
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
