import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Image, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import PhotoErrorModal from '../../components/PhotoErrorModal';
import { api } from '../../api/client';
import { trainingApi } from '../../api/training';

// Color de acento del flujo Foto-Test (IA/morado) — coherente con la card 6.1
// "Foto-Test" y con IconTutor del Dashboard "Repaso IA".
const AI_COLOR = '#A78BFA';
const AI_COLOR_DIM = 'rgba(167,139,250,0.25)';

// ─── Icono cerebro (mismo trazo que IconTutor del Dashboard) ─────────────────
function IconBrain({ color = AI_COLOR }) {
    return (
        <Svg width={44} height={44} viewBox="0 0 24 24" fill="none">
            <Path
                d="M9 3a4 4 0 0 0-4 4 4 4 0 0 0-1 7 4 4 0 0 0 4 5 3 3 0 0 0 4 1 3 3 0 0 0 4-1 4 4 0 0 0 4-5 4 4 0 0 0-1-7 4 4 0 0 0-4-4 3 3 0 0 0-5 0z"
                stroke={color}
                strokeWidth={1.6}
            />
            <Path
                d="M12 6v13M9 9c1 1 3 1 3 3M15 9c-1 1-3 1-3 3"
                stroke={color}
                strokeWidth={1.4}
                strokeLinecap="round"
            />
        </Svg>
    );
}

// Pasos simulados del análisis. Cuando exista el backend, el timeline vendrá
// del propio evento de streaming del endpoint POST /training/photo/analyze.
const MOCK_STEPS = [
    { at: 0, text: 'Enviando la foto...', progress: 15 },
    { at: 900, text: 'Leyendo el texto...', progress: 40 },
    { at: 2100, text: 'Comprendiendo los conceptos...', progress: 70 },
    { at: 3400, text: 'Generando explicación y test...', progress: 95 },
    { at: 4400, text: '¡Análisis completado!', progress: 100 },
];

// ─── Pantalla 6.4 · Foto-Test · Análisis IA ──────────────────────────────────
export default function PhotoTestAnalysisScreen({ navigation, route }) {
    const insets = useSafeAreaInsets();
    const { uri, mockError, imageBase64, mimeType } = route.params ?? {};
    // `mockError` = 'blur' | 'no-text' → sirve solo en dev para previsualizar el
    // error sin depender del backend. En prod lo dispara la respuesta de la IA.

    const [statusText, setStatusText] = useState(MOCK_STEPS[0].text);
    const [progress, setProgress] = useState(MOCK_STEPS[0].progress);
    const [errorType, setErrorType] = useState(null); // null | 'blur' | 'no-text'

    const pulse = useRef(new Animated.Value(1)).current;
    const scan = useRef(new Animated.Value(0)).current;
    const progressAnim = useRef(new Animated.Value(MOCK_STEPS[0].progress / 100)).current;

    useEffect(() => {
        // Pulso continuo del icono central
        const pulseLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1.12, duration: 850, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 1, duration: 850, useNativeDriver: true }),
            ])
        );
        pulseLoop.start();

        // Línea de escaneo que recorre el icono en bucle
        const scanLoop = Animated.loop(
            Animated.timing(scan, { toValue: 1, duration: 1800, useNativeDriver: true })
        );
        scanLoop.start();

        // Animación de pasos cosmética (no navega — la API real lo hace)
        const timers = MOCK_STEPS.slice(1).map((step, i) =>
            setTimeout(() => {
                setStatusText(step.text);
                setProgress(step.progress);
                Animated.timing(progressAnim, {
                    toValue: step.progress / 100,
                    duration: 500,
                    useNativeDriver: false,
                }).start();

                // Dev: mockError dispara el modal de error en el paso 2
                if (mockError && i === 1) {
                    setTimeout(() => setErrorType(mockError), 400);
                }
            }, step.at)
        );

        // Llamada real a la API (se salta en modo mockError de dev)
        let cancelled = false;
        if (!mockError) {
            if (!imageBase64) {
                // Sin datos de imagen (ruta antigua sin base64) → mostramos error
                setErrorType('no-text');
            } else {
                (async () => {
                    const session = await api.loadSession();
                    const oposicion =
                        session?.user?.oposicion ??
                        session?.user?.user_metadata?.oposicion ??
                        'justicia-tramitacion';
                    const { data, error } = await trainingApi.analyzePhoto(
                        imageBase64,
                        mimeType ?? 'image/jpeg',
                        oposicion,
                    );
                    if (cancelled) return;
                    if (error) {
                        setErrorType('blur');
                    } else {
                        navigation.replace('PhotoTestResult', {
                            uri,
                            concept: data.concept,
                            question: data.question ?? '',
                            answer: data.answer ?? '',
                            questionsCount: data.availableQuestionsCount ?? 10,
                        });
                    }
                })();
            }
        }

        return () => {
            cancelled = true;
            timers.forEach(clearTimeout);
            pulseLoop.stop();
            scanLoop.stop();
        };
    }, []);

    // Interpolaciones
    const scanTranslateY = scan.interpolate({
        inputRange: [0, 1],
        outputRange: [-70, 70],
    });
    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* Fondo: foto atenuada + capa oscura (sin gradient, sin extra deps) */}
            {uri ? (
                <Image source={{ uri }} style={styles.bgImage} blurRadius={20} />
            ) : (
                <View style={[styles.bgImage, { backgroundColor: '#141C2E' }]} />
            )}
            <View style={styles.bgOverlay} />

            {/* Contenido central */}
            <View style={styles.content}>
                <View style={styles.iconWrap}>
                    <View style={styles.ring2} />
                    <View style={styles.ring1} />
                    <Animated.View style={[styles.iconCircle, { transform: [{ scale: pulse }] }]}>
                        <IconBrain />
                        <View style={styles.scanClip} pointerEvents="none">
                            <Animated.View
                                style={[styles.scanLine, { transform: [{ translateY: scanTranslateY }] }]}
                            />
                        </View>
                    </Animated.View>
                </View>

                <Text style={styles.title}>Analizando con IA</Text>
                <Text style={styles.status}>{statusText}</Text>

                <View style={styles.progressTrack}>
                    <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
                </View>
                <Text style={styles.progressPct}>{progress}%</Text>
            </View>

            <TouchableOpacity
                style={[styles.cancel, { bottom: insets.bottom + 20 }]}
                onPress={() => navigation.goBack()}
                hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
            >
                <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>

            {/* Pop-up de error del análisis (6.4 · err) */}
            <PhotoErrorModal
                visible={errorType !== null}
                variant={errorType || 'blur'}
                onRetry={() => { setErrorType(null); navigation.goBack(); }}
                onCancel={() => { setErrorType(null); navigation.navigate('TrainingHome'); }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0B1120' },

    bgImage: { ...StyleSheet.absoluteFillObject, opacity: 0.3 },
    bgOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(11,17,32,0.78)' },

    content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },

    // Icono con anillos concéntricos + línea de escaneo dentro
    iconWrap: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
    ring1: {
        position: 'absolute',
        width: 106,
        height: 106,
        borderRadius: 53,
        borderWidth: 1.5,
        borderColor: 'rgba(167,139,250,0.4)',
    },
    ring2: {
        position: 'absolute',
        width: 138,
        height: 138,
        borderRadius: 69,
        borderWidth: 1,
        borderColor: 'rgba(167,139,250,0.2)',
    },
    iconCircle: {
        width: 82,
        height: 82,
        borderRadius: 41,
        backgroundColor: AI_COLOR_DIM,
        borderWidth: 1.8,
        borderColor: AI_COLOR,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    scanClip: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
    scanLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: AI_COLOR,
        shadowColor: AI_COLOR,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 6,
    },

    title: { fontSize: 20, fontWeight: '800', color: '#F5F7FB', marginBottom: 6, letterSpacing: 0.2 },
    status: { fontSize: 13, color: '#9AA2B1', marginBottom: 32, textAlign: 'center' },

    progressTrack: { width: '80%', height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: AI_COLOR, borderRadius: 3 },
    progressPct: { marginTop: 10, fontSize: 12, fontWeight: '700', color: AI_COLOR },

    cancel: { position: 'absolute', alignSelf: 'center', padding: 10 },
    cancelText: { color: '#9AA2B1', fontSize: 13, fontWeight: '600' },
});
