import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import Svg, { Path, Circle, Polygon } from 'react-native-svg';
import ScreenHeader from '../../components/ScreenHeader';

// ─── Iconos SVG del hub 6.1 ──────────────────────────────────────────────────
// Los colores y forma imitan el mockup: cada modo tiene su acento y todos los
// iconos viven dentro de una caja blanca con sombra suave.

function IconHexagon({ color = '#F26C4F' }) {
    return (
        <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
            <Polygon
                points="12,3 21,7.5 21,16.5 12,21 3,16.5 3,7.5"
                stroke={color}
                strokeWidth={1.7}
                strokeLinejoin="round"
            />
            <Path d="M12 3v18M3 7.5l18 9M21 7.5l-18 9" stroke={color} strokeWidth={1.2} />
        </Svg>
    );
}

function IconCamera({ color = '#2D6FB0' }) {
    return (
        <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
            <Path
                d="M4 8h3l2-3h6l2 3h3v11H4z"
                stroke={color}
                strokeWidth={1.7}
                strokeLinejoin="round"
            />
            <Circle cx={12} cy={13} r={3.5} stroke={color} strokeWidth={1.7} />
        </Svg>
    );
}

function IconDoc({ color = '#1f9d6b' }) {
    return (
        <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
            <Path d="M6 3h9l4 4v14H6z" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
            <Path d="M14 3v5h5" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
            <Path d="M9 12h7M9 15h7M9 18h4" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
        </Svg>
    );
}

function IconTarget({ color = '#7B4BC4' }) {
    return (
        <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.7} />
            <Circle cx={12} cy={12} r={5} stroke={color} strokeWidth={1.7} />
            <Circle cx={12} cy={12} r={1.5} fill={color} />
        </Svg>
    );
}

// Los colores de fondo y acento salen del mockup. Foto-Test es azul (no
// morado) porque el hub representa la "puerta de entrada" del modo; el
// morado se reserva al lenguaje visual interno del flujo IA (6.4, 6.5).
const MODES = [
    {
        id: 'infinite',
        title: 'Generador infinito',
        subtitle: 'Tests a tu medida sin límite',
        bg: '#FFF1EC',
        accent: '#F26C4F',
        Icon: IconHexagon,
        route: 'GeneratorConfig',
    },
    {
        id: 'photo',
        title: 'Foto-Test',
        subtitle: 'Saca una foto y resuelve la duda',
        bg: '#E8F0F8',
        accent: '#2D6FB0',
        Icon: IconCamera,
        route: 'PhotoTestCapture',
    },
    {
        id: 'official',
        title: 'Simulacros oficiales',
        subtitle: 'Exámenes reales de años anteriores',
        bg: '#EAF7F1',
        accent: '#1f9d6b',
        Icon: IconDoc,
        route: 'OfficialMocks',
    },
    {
        id: 'errors',
        title: 'Laboratorio de errores',
        subtitle: 'La IA ataca tus puntos débiles',
        bg: '#F1ECFA',
        accent: '#7B4BC4',
        Icon: IconTarget,
        route: 'ErrorLab',
    },
];

// ─── Pantalla 6.1 · Hub de Entrenamiento ─────────────────────────────────────
export default function TrainingHomeScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F4F6FA" />
            <View style={styles.statusBar}><Text style={styles.statusBarTime}>9:41</Text></View>

            <ScreenHeader title="Entrenamiento" onBack={() => navigation.goBack()} />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                {MODES.map((mode) => {
                    const Icon = mode.Icon;
                    return (
                        <TouchableOpacity
                            key={mode.id}
                            style={[styles.card, { backgroundColor: mode.bg }]}
                            onPress={() => navigation.navigate(mode.route)}
                            activeOpacity={0.85}
                        >
                            <View style={styles.iconBox}>
                                <Icon color={mode.accent} />
                            </View>
                            <View style={styles.textCol}>
                                <Text style={styles.cardTitle}>{mode.title}</Text>
                                <Text style={styles.cardSubtitle}>{mode.subtitle}</Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F6FA' },
    statusBar: { height: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 16 },
    statusBarTime: { fontSize: 10, fontWeight: '700', color: '#1B2A4A', marginRight: 'auto' },
    scroll: { flex: 1 },
    body: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },

    card: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        borderRadius: 18,
        paddingVertical: 16,
        paddingHorizontal: 14,
        marginBottom: 12,
    },
    iconBox: {
        width: 52,
        height: 52,
        borderRadius: 14,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#0F1B33',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 5,
        elevation: 2,
    },
    textCol: { flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: '800', color: '#0F1B33', marginBottom: 3 },
    cardSubtitle: { fontSize: 12, color: '#5A6373', lineHeight: 16 },
});
