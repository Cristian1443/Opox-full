import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';

const ICON_INFINITO = require('../../../assets/icon-generador-infinito.png');
const ICON_EXAMENES = require('../../../assets/icon-examenes-oficiales.png');
const ICON_FOTO_TEST = require('../../../assets/icon-foto-test.png');
const ICON_LABORATORIO = require('../../../assets/icon-laboratorio-errores.png');

function ModeIcon({ source }) {
    return <Image source={source} resizeMode="contain" style={{ width: 48, height: 48 }} />;
}

// Figma ("HUB DE ENTRENAMIENTO 1"): iconos naranja exactos del mockup, header
// con botón atrás circular (morado al 10%) + engranaje de ajustes.
const MODES = [
    {
        id: 'infinite',
        title: 'Generador infinito',
        subtitle: 'Creación de tests a medida sin límite',
        icon: <ModeIcon source={ICON_INFINITO} />,
        route: 'GeneratorConfig',
        highlighted: true,
    },
    {
        id: 'official',
        title: 'Exámenes oficiales',
        subtitle: 'Exámenes reales de años anteriores',
        icon: <ModeIcon source={ICON_EXAMENES} />,
        route: 'OfficialMocks',
    },
    {
        id: 'photo',
        title: 'Módulo foto-test',
        subtitle: 'Tests basados en memoria visual',
        icon: <ModeIcon source={ICON_FOTO_TEST} />,
        route: 'PhotoTestCapture',
    },
    {
        id: 'errors',
        title: 'Laboratorio de errores',
        subtitle: 'Repaso quirúrgico de fallos y puntos débiles',
        icon: <ModeIcon source={ICON_LABORATORIO} />,
        route: 'ErrorLab',
    },
];

export default function TrainingHomeScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.7}
                    >
                        <Feather name="chevron-left" size={22} color={colors.textDark} />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle} numberOfLines={1}>
                        Zona de entrenamiento
                    </Text>

                    <TouchableOpacity
                        style={styles.settingsButton}
                        onPress={() => navigation.navigate('Settings')}
                        activeOpacity={0.7}
                    >
                        <Feather name="settings" size={20} color={colors.textDark} />
                    </TouchableOpacity>
                </View>

                <View style={styles.cardsWrapper}>
                    {MODES.map((mode) => (
                        <TouchableOpacity
                            key={mode.id}
                            activeOpacity={0.75}
                            style={[styles.card, mode.highlighted && styles.cardHighlighted]}
                            onPress={() => navigation.navigate(mode.route)}
                        >
                            <View style={styles.iconWrapper}>{mode.icon}</View>

                            <View style={styles.cardTextWrapper}>
                                <Text style={styles.cardTitle}>{mode.title}</Text>
                                <Text style={styles.cardSubtitle}>{mode.subtitle}</Text>
                            </View>

                            <Feather name="chevron-right" size={20} color={colors.textDark} />
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.white },
    container: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing.lg + spacing.md,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(65, 41, 80, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        flex: 1,
        fontFamily: 'Poppins-SemiBold',
        fontSize: 20,
        color: colors.textDark,
        marginLeft: spacing.sm + 4,
    },
    settingsButton: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardsWrapper: { gap: spacing.md },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: 'rgba(65, 41, 80, 0.3)',
        borderRadius: 16,
        paddingVertical: 18,
        paddingHorizontal: spacing.md,
    },
    cardHighlighted: {
        backgroundColor: '#F5F5F5',
    },
    iconWrapper: {
        width: 56,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm + 6,
    },
    cardTextWrapper: { flex: 1, marginRight: spacing.sm },
    cardTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: colors.textDark,
        marginBottom: 4,
    },
    cardSubtitle: {
        fontFamily: 'Poppins-Regular',
        fontSize: 12.5,
        lineHeight: 16,
        color: 'rgba(52, 58, 61, 0.6)',
    },
});
