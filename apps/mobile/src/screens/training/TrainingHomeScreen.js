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
import { Feather } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing } from '../../theme';

const ICON_INFINITO = require('../../../assets/icon-generador-infinito.png');
const ICON_EXAMENES = require('../../../assets/icon-examenes-oficiales.png');
const ICON_FOTO_TEST = require('../../../assets/icon-foto-test.png');
const ICON_LABORATORIO = require('../../../assets/icon-laboratorio-errores.png');

function ModeIcon({ source }) {
    return <Image source={source} resizeMode="contain" style={{ width: 72, height: 72 }} />;
}

function IconGear({ size = 22, color = colors.textDark }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 54 54" fill="none">
            <Path d="M51.4399 30.8795V23.7995L45.2299 23.2795C44.8079 21.0153 43.9778 18.8467 42.78 16.8795L46.9299 11.8795L41.9899 6.87945L37.2399 10.9495C35.3532 9.6517 33.2453 8.70957 31.02 8.16945L30.4899 1.68945H23.4899L22.97 7.96945C20.7427 8.41611 18.6148 9.26316 16.6899 10.4695L11.7899 6.26945L6.84991 11.2695L10.8499 16.0795C9.56076 17.9964 8.62909 20.1308 8.09991 22.3795L1.68994 22.8795V29.9495L7.89996 30.4695C8.32019 32.7389 9.14679 34.9138 10.34 36.8895L6.19995 41.8895L11.1299 46.8895L15.89 42.8195C17.7719 44.1193 19.8769 45.0616 22.0999 45.5995L22.6899 52.0795H29.6899L30.21 45.7994C32.4541 45.3678 34.5998 44.5272 36.5399 43.3195L41.4399 47.5195L46.3799 42.5195L42.3799 37.7095C43.6691 35.7925 44.6008 33.6581 45.1299 31.4095L51.4399 30.8795Z" stroke={color} strokeWidth={3.38} />
            <Path d="M34.3099 26.8793C34.2902 28.4077 33.819 29.8961 32.9555 31.1574C32.092 32.4186 30.8748 33.3964 29.4571 33.9677C28.0393 34.5389 26.4843 34.6782 24.9876 34.368C23.4909 34.0578 22.1193 33.3119 21.0455 32.2241C19.9716 31.1364 19.2433 29.7554 18.9523 28.2548C18.6613 26.7543 18.8205 25.2012 19.4099 23.7909C19.9993 22.3806 20.9926 21.176 22.2648 20.3288C23.537 19.4815 25.0314 19.0294 26.5599 19.0293C27.5842 19.0358 28.5972 19.2441 29.5411 19.6421C30.4849 20.0402 31.3411 20.6202 32.0608 21.3492C32.7804 22.0781 33.3494 22.9417 33.7353 23.8905C34.1212 24.8394 34.3165 25.855 34.3099 26.8793Z" stroke={color} strokeWidth={3.38} />
        </Svg>
    );
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
                        <IconGear size={20} color={colors.textDark} />
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

                            <Feather name="chevron-right" size={24} color={colors.textDark} />
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
