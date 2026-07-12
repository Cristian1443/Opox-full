import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView, Animated } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import ScreenHeader from '../../components/ScreenHeader';
import TestReadyModal from '../../components/TestReadyModal';

// Acento morado del flujo Foto-Test (mismo que 6.4 y que la card 6.1)
const AI_COLOR = '#7B4BC4';
const AI_BG = '#F1ECFA';

// ─── Iconos SVG ──────────────────────────────────────────────────────────────

function IconBulb({ color = AI_COLOR }) {
    return (
        <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
            <Path
                d="M12 3a6 6 0 0 1 4 10.5V16H8v-2.5A6 6 0 0 1 12 3z"
                stroke={color}
                strokeWidth={1.7}
                strokeLinejoin="round"
            />
            <Path d="M9 19h6M10 21h4" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
        </Svg>
    );
}

// ─── Pantalla 6.5 · Foto-Test · Resultado ────────────────────────────────────
export default function PhotoTestResultScreen({ navigation, route }) {
    const params = route.params ?? {};
    // Mocks de fallback mientras no exista backend real
    const concept = params.concept ?? 'Plazos en el procedimiento administrativo';
    const question = params.question ?? '¿Cuál es el plazo general para resolver un procedimiento administrativo?';
    const answer = params.answer ?? 'El plazo general para resolver es de 3 meses, salvo que una norma con rango de ley establezca uno mayor.';
    const questionsCount = params.questionsCount ?? 10;

    const [flipped, setFlipped] = useState(false);
    const [saved, setSaved] = useState(false);
    const [planned, setPlanned] = useState(false);
    // Modal 6.5 · ok: confirma el arranque del test. Se dispara al pulsar
    // "Hacer quiz"; al confirmar "Empezar test" navega al Bloque 7.
    const [readyModalOpen, setReadyModalOpen] = useState(false);
    const flip = useRef(new Animated.Value(0)).current;

    // Entrada suave
    const fade = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, []);

    const doFlip = () => {
        Animated.spring(flip, {
            toValue: flipped ? 0 : 1,
            friction: 8,
            tension: 12,
            useNativeDriver: true,
        }).start();
        setFlipped((v) => !v);
    };

    // Interpolaciones de la flashcard.
    // Añadimos crossfade de opacidad como salvavidas por si backfaceVisibility
    // falla en algún Android — así al menos la cara visible no queda espejada.
    const frontRotate = flip.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
    const backRotate = flip.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
    const frontOpacity = flip.interpolate({ inputRange: [0, 0.5, 0.51, 1], outputRange: [1, 1, 0, 0] });
    const backOpacity = flip.interpolate({ inputRange: [0, 0.5, 0.51, 1], outputRange: [0, 0, 1, 1] });

    // "Hacer quiz" → abre el modal de confirmación (6.5 · ok)
    const openQuizConfirm = () => setReadyModalOpen(true);

    // "Empezar test" dentro del modal → cierra y navega al player (Bloque 7)
    const startQuiz = () => {
        setReadyModalOpen(false);
        navigation.navigate('TrainingSession', {
            source: 'photo',
            concept,
            questionsCount,
        });
    };

    const saveDeck = () => {
        // TODO backend: POST /training/photo/save → guardar el mazo de flashcards
        setSaved(true);
    };

    const addToTodayPlan = () => {
        // TODO backend: POST /planning/tasks → crea tarea de tipo `test`
        // con este mazo para hoy. Enlaza con Bloque 4 · Planificación.
        setPlanned(true);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F4F6FA" />
            <View style={styles.statusBar}><Text style={styles.statusBarTime}>9:41</Text></View>

            {/* Back cierra todo el flujo Foto-Test → hub (evita volver a la cámara) */}
            <ScreenHeader title="Foto-Test" onBack={() => navigation.navigate('TrainingHome')} />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                <Animated.View style={{ opacity: fade }}>
                    {/* Concepto detectado */}
                    <Text style={[styles.groupTitle, { marginTop: 16 }]}>CONCEPTO DETECTADO</Text>
                    <View style={styles.conceptCard}>
                        <Text style={styles.conceptText}>{concept}</Text>
                    </View>

                    {/* Muestra de flashcard */}
                    <Text style={styles.groupTitle}>MUESTRA</Text>
                    <TouchableOpacity
                        style={styles.flashcardWrap}
                        onPress={doFlip}
                        activeOpacity={0.9}
                    >
                        {/* Cara delantera: pregunta */}
                        <Animated.View
                            style={[
                                styles.flashcardFace,
                                styles.flashcardFront,
                                {
                                    opacity: frontOpacity,
                                    transform: [{ perspective: 1000 }, { rotateY: frontRotate }],
                                },
                            ]}
                        >
                            <IconBulb />
                            <Text style={styles.cardText}>{question}</Text>
                            <Text style={styles.flipHint}>Toca para ver la respuesta</Text>
                        </Animated.View>

                        {/* Cara trasera: respuesta */}
                        <Animated.View
                            style={[
                                styles.flashcardFace,
                                styles.flashcardBack,
                                {
                                    opacity: backOpacity,
                                    transform: [{ perspective: 1000 }, { rotateY: backRotate }],
                                },
                            ]}
                        >
                            <Text style={styles.answerLabel}>RESPUESTA</Text>
                            <Text style={styles.cardText}>{answer}</Text>
                            <Text style={styles.flipHint}>Toca para volver</Text>
                        </Animated.View>
                    </TouchableOpacity>

                    {/* Acciones */}
                    <TouchableOpacity style={styles.btnPrimary} onPress={openQuizConfirm} activeOpacity={0.85}>
                        <Text style={styles.btnPrimaryText}>Hacer quiz</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.btnSecondary, saved && styles.btnSecondarySaved]}
                        onPress={saveDeck}
                        disabled={saved}
                        activeOpacity={0.85}
                    >
                        <Text style={[styles.btnSecondaryText, saved && styles.btnSecondaryTextSaved]}>
                            {saved ? 'Guardado ✓' : 'Guardar mazo'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.btnLink}
                        onPress={addToTodayPlan}
                        disabled={planned}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.btnLinkText, planned && styles.btnLinkTextDone]}>
                            {planned ? 'Añadido a tu plan de hoy ✓' : 'Añadir al plan de hoy'}
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
            </ScrollView>

            {/* Estado 6.5 · ok — celebración al llegar */}
            <TestReadyModal
                visible={readyModalOpen}
                onStart={startQuiz}
                onDismiss={() => setReadyModalOpen(false)}
                questionCount={questionsCount}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F6FA' },
    statusBar: { height: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 16 },
    statusBarTime: { fontSize: 10, fontWeight: '700', color: '#1B2A4A', marginRight: 'auto' },
    scroll: { flex: 1 },
    body: { paddingHorizontal: 16, paddingBottom: 32 },

    groupTitle: { fontSize: 10.5, fontWeight: '700', color: '#5A6373', letterSpacing: 0.4, marginBottom: 8, marginTop: 6 },

    // Card del concepto
    conceptCard: {
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#EEF1F7',
        borderRadius: 14,
        padding: 14,
        marginBottom: 14,
    },
    conceptText: { fontSize: 14, fontWeight: '700', color: '#0F1B33', lineHeight: 20 },

    // Flashcard con flip 3D
    flashcardWrap: {
        width: '100%',
        height: 200,
        marginBottom: 20,
    },
    flashcardFace: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backfaceVisibility: 'hidden',
    },
    flashcardFront: {
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#EEF1F7',
    },
    flashcardBack: {
        backgroundColor: AI_BG,
        borderWidth: 1.5,
        borderColor: AI_COLOR,
    },
    cardText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#0F1B33',
        textAlign: 'center',
        lineHeight: 21,
        marginTop: 10,
    },
    answerLabel: {
        fontSize: 10.5,
        fontWeight: '800',
        color: AI_COLOR,
        letterSpacing: 0.6,
    },
    flipHint: {
        marginTop: 12,
        fontSize: 11,
        color: '#8A92A0',
        fontStyle: 'italic',
    },

    // Botones
    btnPrimary: {
        backgroundColor: '#FF6B4A',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginBottom: 10,
    },
    btnPrimaryText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    btnSecondary: {
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#D4DAE6',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    btnSecondarySaved: {
        backgroundColor: '#EAF7F1',
        borderColor: '#C7E6D6',
    },
    btnSecondaryText: { color: '#1B2A4A', fontSize: 14, fontWeight: '700' },
    btnSecondaryTextSaved: { color: '#1f9d6b' },
    btnLink: {
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 2,
    },
    btnLinkText: { color: '#7B4BC4', fontSize: 12.5, fontWeight: '700' },
    btnLinkTextDone: { color: '#1f9d6b' },
});
