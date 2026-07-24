import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import Svg, { Path, Circle, Ellipse } from 'react-native-svg';
import ScreenHeader from '../../components/ScreenHeader';
import { colors, spacing } from '../../theme';

// Iconos SVG que imitan el nuevo wireframe: todos naranja sobre fondo blanco
function IconInfinity({ color = colors.primary }) {
    return (
        <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
            <Path
                d="M12 12c-2-2.5-4-4-6-4a4 4 0 0 0 0 8c2 0 4-1.5 6-4z"
                stroke={color} strokeWidth={1.8} strokeLinejoin="round"
            />
            <Path
                d="M12 12c2 2.5 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.5-6 4z"
                stroke={color} strokeWidth={1.8} strokeLinejoin="round"
            />
        </Svg>
    );
}

function IconDocMedal({ color = colors.primary }) {
    return (
        <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
            <Path d="M6 3h9l4 4v10H6z" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
            <Path d="M14 3v5h5" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
            <Circle cx={12} cy={17} r={3} stroke={color} strokeWidth={1.5} />
            <Path d="M11 20l-.5 2M13 20l.5 2" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
        </Svg>
    );
}

function IconAperture({ color = colors.primary }) {
    return (
        <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.7} />
            <Path d="M12 3l3 9M21 12l-9 3M15.5 20.7L9 15M12 21l-3-9M3 12l9-3M8.5 3.3L15 9"
                stroke={color} strokeWidth={1.4} strokeLinecap="round" />
        </Svg>
    );
}

function IconMicroscope({ color = colors.primary }) {
    return (
        <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
            <Path d="M7 21h10M12 21v-4" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
            <Path d="M9 3h6v9H9z" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
            <Path d="M12 12v5" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
            <Path d="M7 17a5 5 0 0 1 10 0" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
            <Path d="M10 6h4" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
        </Svg>
    );
}

function IconChevron({ color = colors.grayMid }) {
    return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path d="M9 6l6 6-6 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

const MODES = [
    {
        id: 'infinite',
        title: 'Generador infinito',
        subtitle: 'Creación de tests a medida sin límite',
        Icon: IconInfinity,
        route: 'GeneratorConfig',
    },
    {
        id: 'official',
        title: 'Exámenes oficiales',
        subtitle: 'Exámenes reales de años anteriores',
        Icon: IconDocMedal,
        route: 'OfficialMocks',
    },
    {
        id: 'photo',
        title: 'Módulo foto-test',
        subtitle: 'Tests basados en memoria visual',
        Icon: IconAperture,
        route: 'PhotoTestCapture',
    },
    {
        id: 'errors',
        title: 'Laboratorio de errores',
        subtitle: 'Repaso quirúrgico de fallos y puntos débiles',
        Icon: IconMicroscope,
        route: 'ErrorLab',
    },
];

export default function TrainingHomeScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

            <ScreenHeader title="Zona de entrenamiento" onBack={() => navigation.goBack()} />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                {MODES.map((mode) => {
                    const Icon = mode.Icon;
                    return (
                        <TouchableOpacity
                            key={mode.id}
                            style={styles.card}
                            onPress={() => navigation.navigate(mode.route)}
                            activeOpacity={0.82}
                        >
                            <View style={styles.iconBox}>
                                <Icon />
                            </View>
                            <View style={styles.textCol}>
                                <Text style={styles.cardTitle}>{mode.title}</Text>
                                <Text style={styles.cardSubtitle}>{mode.subtitle}</Text>
                            </View>
                            <IconChevron />
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    body: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.lg },

    card: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: colors.card,
        borderRadius: 14,
        paddingVertical: 16,
        paddingHorizontal: 14,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    iconBox: {
        width: 52,
        height: 52,
        borderRadius: 14,
        backgroundColor: colors.grayLight,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    textCol: { flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: '800', color: colors.dark, marginBottom: 3 },
    cardSubtitle: { fontSize: 12, color: colors.textSecondary, lineHeight: 16 },
});
