import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Platform,
    StatusBar,
    Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AntDesign, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// ─── TOKENS ───────────────────────────────────────────────
const C = {
    primary: '#f26535',
    dark: '#0d1b2a',
    white: '#ffffff',
    cardBg: '#fce8df',
    dotOff: '#d0d5dd',
};

const { width: SW, height: SH } = Dimensions.get('window');

// ─── SLIDES ───────────────────────────────────────────────
const SLIDES = [
    {
        key: 'tutor',
        title: 'Tutor IA 24/7',
        desc: 'Resuelve dudas al instante, genera tests infinitos y aprende con foto-test y biometría.',
        Icon: (s) => <AntDesign name="star" size={s} color={C.primary} />,
    },
    {
        key: 'preguntas',
        title: 'Preguntas infinitas',
        desc: 'Practica con miles de preguntas actualizadas y adaptadas a tu nivel de conocimiento.',
        Icon: (s) => <Ionicons name="infinite" size={s} color={C.primary} />,
    },
    {
        key: 'fototest',
        title: 'Foto-Test',
        desc: 'Escanea tus apuntes y conviértelos en preguntas tipo test al instante con la cámara.',
        Icon: (s) => <Ionicons name="camera" size={s} color={C.primary} />,
    },
    {
        key: 'bio',
        title: 'Biometría y gamificación',
        desc: 'Controla tu fatiga, mantén tu racha diaria y compite con otros opositores.',
        Icon: (s) => <MaterialCommunityIcons name="trophy" size={s} color={C.primary} />,
    },
];

// ─── COMPONENT ────────────────────────────────────────────
export default function OnboardingSliderScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [index, setIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;
    const flatRef = useRef(null);

    // Avanzar al siguiente slide o ir a la siguiente pantalla
    const handleNext = useCallback(() => {
        if (index < SLIDES.length - 1) {
            const next = index + 1;
            flatRef.current?.scrollToIndex({ index: next, animated: true });
            setIndex(next);
        } else {
            navigation.replace('OppositionSelector');
        }
    }, [index, navigation]);

    // Saltar todo el onboarding
    const handleSkip = useCallback(() => {
        navigation.replace('OppositionSelector');
    }, [navigation]);

    // Actualizar índice al hacer scroll manual
    const onViewableChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            setIndex(viewableItems[0].index);
        }
    }).current;

    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    // ── Render cada slide ─────────────────────────────────
    const renderItem = useCallback(({ item }) => (
        <View style={styles.slide}>
            {/* Tarjeta ilustración */}
            <View style={styles.card}>
                {item.Icon(ICON_S)}
            </View>

            {/* Título */}
            <Text style={styles.title}>{item.title}</Text>

            {/* Descripción */}
            <Text style={styles.desc}>{item.desc}</Text>
        </View>
    ), []);

    // ── Dots animados ─────────────────────────────────────
    const Dots = () => (
        <View style={styles.dotsRow}>
            {SLIDES.map((_, i) => {
                const inputRange = [
                    (i - 1) * SW,
                    i * SW,
                    (i + 1) * SW,
                ];

                // El dot activo se expande suavemente
                const width = scrollX.interpolate({
                    inputRange,
                    outputRange: [10, 28, 10],
                    extrapolate: 'clamp',
                });

                const opacity = scrollX.interpolate({
                    inputRange,
                    outputRange: [0.4, 1, 0.4],
                    extrapolate: 'clamp',
                });

                return (
                    <Animated.View
                        key={i}
                        style={[
                            styles.dot,
                            {
                                width,
                                opacity,
                                backgroundColor: i === index ? C.primary : C.dotOff,
                            },
                        ]}
                    />
                );
            })}
        </View>
    );

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor={C.white} />

            {/* ── SALTAR ── */}
            <TouchableOpacity
                onPress={handleSkip}
                style={styles.skipBtn}
                hitSlop={{ top: 12, bottom: 12, left: 16, right: 4 }}
                activeOpacity={0.6}
            >
                <Text style={styles.skipTxt}>Saltar</Text>
            </TouchableOpacity>

            {/* ── LISTA DE SLIDES ── */}
            <Animated.FlatList
                ref={flatRef}
                data={SLIDES}
                renderItem={renderItem}
                keyExtractor={(item) => item.key}
                horizontal
                pagingEnabled
                bounces={false}
                showsHorizontalScrollIndicator={false}
                onViewableItemsChanged={onViewableChanged}
                viewabilityConfig={viewConfig}
                scrollEventThrottle={16}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false }
                )}
                getItemLayout={(_, i) => ({
                    length: SW,
                    offset: SW * i,
                    index: i,
                })}
                style={styles.list}
            />

            {/* ── FOOTER ── */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                <Dots />
                <TouchableOpacity
                    style={styles.nextBtn}
                    onPress={handleNext}
                    activeOpacity={0.88}
                >
                    <Text style={styles.nextTxt}>
                        {index === SLIDES.length - 1 ? 'Empezar' : 'Siguiente'}
                    </Text>
                </TouchableOpacity>
            </View>

        </View>
    );
}

// ─── STYLES ───────────────────────────────────────────────
// Tarjeta: ancho = 88% pantalla, alto = 38% pantalla
const CARD_W = SW * 0.88;
const CARD_H = SH * 0.38;
const ICON_S = CARD_H * 0.42;    // ícono = 42% del alto de tarjeta

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: C.white,
    },

    // "Saltar" — alineado a la derecha, con margen suficiente
    skipBtn: {
        alignSelf: 'flex-end',
        paddingRight: 24,
        paddingTop: 10,
        paddingBottom: 6,
    },
    skipTxt: {
        color: C.primary,
        fontSize: 17,
        fontWeight: '600',
    },

    list: {
        flex: 1,
    },

    // Cada slide = ancho exacto de pantalla
    slide: {
        width: SW,
        flex: 1,
        alignItems: 'center',
        // Espacio arriba calibrado para que la tarjeta quede
        // en el tercio superior de la pantalla disponible
        paddingTop: SH * 0.04,
        paddingHorizontal: (SW - CARD_W) / 2,
    },

    // Tarjeta salmón — proporciones exactas del wireframe
    card: {
        width: CARD_W,
        height: CARD_H,
        backgroundColor: C.cardBg,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 36,
    },

    // Título negro muy bold
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: C.dark,
        textAlign: 'center',
        marginBottom: 14,
        paddingHorizontal: 8,
        ...Platform.select({
            android: { fontFamily: 'sans-serif-black' },
        }),
    },

    // Descripción naranja — sin romper palabras innecesariamente
    desc: {
        fontSize: 16,
        fontWeight: '400',
        color: C.primary,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 8,
    },

    // ── Footer ──────────────────────────────────────────
    footer: {
        paddingHorizontal: 20,
        backgroundColor: C.white,
    },

    dotsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginBottom: 18,
    },

    // Dot base — alto fijo, ancho animado
    dot: {
        height: 10,
        borderRadius: 5,
    },

    // Botón Siguiente — full width, alto 58, radio 50
    nextBtn: {
        backgroundColor: C.primary,
        borderRadius: 50,
        height: 58,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            ios: {
                shadowColor: C.primary,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.35,
                shadowRadius: 10,
            },
            android: {
                elevation: 8,
            },
        }),
    },

    nextTxt: {
        color: C.white,
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
});