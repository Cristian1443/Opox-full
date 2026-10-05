import React from 'react';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    ScrollView,
    Image,
} from 'react-native';
import Text from '../../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import AppHeader, { HeaderSettingsButton } from '../../components/AppHeader';

const ICON_INFINITO = require('../../../assets/icon-generador-infinito.png');
const ICON_EXAMENES = require('../../../assets/icon-examenes-oficiales.png');
const ICON_FOTO_TEST = require('../../../assets/icon-foto-test.png');
const ICON_LABORATORIO = require('../../../assets/icon-laboratorio-errores.png');

function ModeIcon({ source }) {
    return <Image source={source} resizeMode="contain" style={{ width: 72, height: 72 }} />;
}

// Figma ("HUB DE ENTRENAMIENTO 1"): iconos naranja exactos del mockup.
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
                <AppHeader
                    title="Zona de entrenamiento"
                    onBack={() => navigation.goBack()}
                    right={<HeaderSettingsButton onPress={() => navigation.navigate('Settings')} />}
                    style={styles.header}
                />

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

                            <Ionicons name="chevron-forward" size={18} color={colors.textDark} />
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
        paddingBottom: spacing.lg + spacing.md,
    },
    // El header vive dentro del ScrollView, que ya aporta el padding lateral.
    header: { paddingHorizontal: 0 },
    cardsWrapper: { gap: spacing.md + 2 },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: 'rgba(65, 41, 80, 0.3)',
        borderRadius: 16,
        paddingVertical: 24,
        paddingHorizontal: spacing.md,
    },
    cardHighlighted: {
        backgroundColor: '#F5F5F5',
    },
    iconWrapper: {
        width: 80,
        height: 80,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    cardTextWrapper: { flex: 1, marginRight: spacing.sm },
    cardTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 19,
        color: colors.textDark,
        marginBottom: 4,
    },
    cardSubtitle: {
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        lineHeight: 18,
        color: 'rgba(52, 58, 61, 0.6)',
    },
});
