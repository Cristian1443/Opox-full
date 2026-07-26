import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    StatusBar,
    Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Colores exactos del Figma (nodos 2293-979, 2294-99, 2294-190) ───────────
const C = {
    bg:         '#F4F4F4',
    title:      '#412950',     // morado OPOX
    desc:       '#412950',     // Figma usa el mismo morado para título y descripción
    skip:       '#412950',
    dotActive:  '#F89824',     // ámbar/naranja exacto (fill real del nodo Ellipse)
    dotInactive:'#BDB6BF',
};

// ─── SLIDES ───────────────────────────────────────────────
const SLIDES = [
    {
        key: 'tutor',
        title: 'Tutor IA 24/7',
        desc: 'Resuelve dudas al instante,\ngenera tests infinitos y aprende\ncon foto-test y biometría',
        image: require('../../../assets/onboarding/slide1-tutor.png'),
    },
    {
        key: 'tests',
        title: 'Tests oficiales\nsimulados',
        desc: 'Practica con exámenes\nreales y temporizados',
        image: require('../../../assets/onboarding/slide2-tests.png'),
    },
    {
        key: 'nube',
        title: 'Seguimiento en\nla nube',
        desc: 'Tu progreso se\nguarda y sincroniza\nautomáticamente',
        image: require('../../../assets/onboarding/slide3-nube.png'),
    },
];

// ─── COMPONENT ────────────────────────────────────────────
export default function OnboardingSliderScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [index, setIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;
    const flatRef = useRef(null);

    const handleSkip = useCallback(() => {
        navigation.replace('OppositionSelector');
    }, [navigation]);

    const onViewableChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) setIndex(viewableItems[0].index);
    }).current;

    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    // ── Render slide ──────────────────────────────────────
    const renderItem = useCallback(({ item }) => (
        <View style={styles.slide}>
            <Image
                source={item.image}
                style={styles.illustration}
                resizeMode="contain"
            />
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.desc}>{item.desc}</Text>
        </View>
    ), []);

    // ── Dots ──────────────────────────────────────────────
    const Dots = () => (
        <View style={styles.dotsRow}>
            {SLIDES.map((_, i) => (
                <View
                    key={i}
                    style={[
                        styles.dot,
                        {
                            backgroundColor: i === index
                                ? C.dotActive
                                : C.dotInactive,
                        },
                    ]}
                />
            ))}
        </View>
    );

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

            {/* ── SALTAR > arriba derecha ── */}
            <TouchableOpacity
                onPress={handleSkip}
                style={styles.skipBtn}
                hitSlop={{ top: 12, bottom: 12, left: 16, right: 4 }}
                activeOpacity={0.6}
            >
                <Text style={styles.skipTxt}>SALTAR {'>'}</Text>
            </TouchableOpacity>

            {/* ── SLIDES ── */}
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

            {/* ── DOTS en la parte inferior ── */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 40 }]}>
                <Dots />
            </View>
        </View>
    );
}

// ─── STYLES ───────────────────────────────────────────────
const ILLUS_SIZE = SW * 0.65;

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: C.bg,
    },

    // "SALTAR >" — alineado arriba derecha
    skipBtn: {
        alignSelf: 'flex-end',
        paddingRight: 24,
        paddingTop: 14,
        paddingBottom: 6,
    },
    skipTxt: {
        color: C.skip,
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.8,
    },

    list: {
        flex: 1,
    },

    // Cada slide = ancho de pantalla
    slide: {
        width: SW,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        // Empujar el contenido un poco hacia arriba del centro
        paddingBottom: SH * 0.12,
    },

    // Ilustración — grande, centrada
    illustration: {
        width: ILLUS_SIZE,
        height: ILLUS_SIZE,
        marginBottom: 28,
    },

    // Título — morado OPOX, bold, grande
    title: {
        fontSize: 28,
        fontWeight: '600',
        color: C.title,
        textAlign: 'center',
        marginBottom: 10,
        lineHeight: 36,
    },

    // Descripción — mismo morado, peso ligero (Figma: Poppins Light/300)
    desc: {
        fontSize: 16,
        fontWeight: '300',
        color: C.desc,
        textAlign: 'center',
        lineHeight: 24,
    },

    // ── Footer ──────────────────────────────────────────
    footer: {
        alignItems: 'center',
        backgroundColor: C.bg,
    },

    dotsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },

    // Dots — círculos pequeños fijos
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
});
