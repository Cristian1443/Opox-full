import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import ScreenHeader from '../../components/ScreenHeader';

// ─── Iconos SVG por modo de entrenamiento ────────────────────────────────────
// Cada modo hereda su color del widget que le corresponde en el Dashboard
// (naranja = principal, morado = IA/foto, verde = plan/oficial, rojo = errores).

function IconInfinity({ color = '#FF6B4A' }) {
    return (
        <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
            <Path
                d="M18.5 8.5c-2 0-3.2 1.4-4.5 3.5s-2.5 3.5-4.5 3.5a3.5 3.5 0 0 1 0-7c2 0 3.2 1.4 4.5 3.5s2.5 3.5 4.5 3.5a3.5 3.5 0 0 0 0-7z"
                stroke={color}
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

function IconCamera({ color = '#7B4BC4' }) {
    return (
        <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
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

function IconDocCheck({ color = '#1f9d6b' }) {
    return (
        <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
            <Path
                d="M6 3h9l4 4v14H6z"
                stroke={color}
                strokeWidth={1.7}
                strokeLinejoin="round"
            />
            <Path
                d="M8.5 14l2.5 2.5 4.5-5"
                stroke={color}
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

function IconTarget({ color = '#E2483D' }) {
    return (
        <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.7} />
            <Circle cx={12} cy={12} r={5} stroke={color} strokeWidth={1.7} />
            <Circle cx={12} cy={12} r={1.5} fill={color} />
        </Svg>
    );
}

const MODES = [
    {
        id: 'infinite',
        title: 'Generador Infinito',
        subtitle: 'Tests a tu medida sin límite',
        bg: '#FFF1EC',
        accent: '#E0552F',
        Icon: IconInfinity,
        route: 'GeneratorConfig',
    },
    {
        id: 'photo',
        title: 'Foto-Test',
        subtitle: 'Saca una foto y resuelve la duda',
        bg: '#F1ECFA',
        accent: '#7B4BC4',
        Icon: IconCamera,
        route: 'PhotoTestCapture',
    },
    {
        id: 'official',
        title: 'Simulacros Oficiales',
        subtitle: 'Exámenes reales de años anteriores',
        bg: '#EAF7F1',
        accent: '#1f9d6b',
        Icon: IconDocCheck,
        route: 'OfficialMocks',
    },
    {
        id: 'errors',
        title: 'Laboratorio de Errores',
        subtitle: 'La IA ataca tus puntos débiles',
        bg: '#FDEBE9',
        accent: '#E2483D',
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
                <Text style={styles.subtitle}>Donde se machaca el temario. Elige tu modo.</Text>

                <Text style={styles.groupTitle}>MODOS DE ENTRENAMIENTO</Text>

                <View style={styles.grid}>
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
                                <Text style={[styles.cardTitle, { color: mode.accent }]}>{mode.title}</Text>
                                <Text style={styles.cardSubtitle}>{mode.subtitle}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F6FA' },
    statusBar: { height: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 16 },
    statusBarTime: { fontSize: 10, fontWeight: '700', color: '#1B2A4A', marginRight: 'auto' },
    scroll: { flex: 1 },
    body: { paddingHorizontal: 16, paddingBottom: 24 },
    subtitle: { fontSize: 12.5, color: '#5A6373', marginBottom: 16 },
    groupTitle: { fontSize: 10.5, fontWeight: '700', color: '#5A6373', letterSpacing: 0.4, marginBottom: 10 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    card: {
        width: '48.5%',
        borderRadius: 16,
        padding: 14,
        marginBottom: 11,
        minHeight: 140,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.7)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    cardTitle: { fontSize: 13, fontWeight: '800', marginBottom: 4 },
    cardSubtitle: { fontSize: 11, color: '#5A6373', lineHeight: 15 },
});
