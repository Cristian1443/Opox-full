// Bloque 3 · Salud — Pantalla 3.7 · Consejos de Estudio
import React from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line, Polyline } from 'react-native-svg';
import { colors, spacing } from '../../theme';
import HealthScreenHeader from '../../components/HealthScreenHeader';

// Colores confirmados contra Figma (frame CONSEJOS DE ESTUDIO, Bloque 3)
// sin equivalente exacto en theme.js.
const FIGMA = {
    separator: 'rgba(65,41,80,0.5)',
    textNote: '#343A3D',
    bannerBorder: 'rgba(255,255,255,0.25)',
    offWhite: '#F5F5F5',
};

// ─── Iconos aproximados (ver nota: no son el asset exportado) ───────────────
function ClockIcon({ size = 24, color = colors.accentOrange }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.8} fill="none" />
            <Path d="M12 7v5l3.5 2" stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function RepeatLinesIcon({ size = 24, color = colors.accentOrange }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Line x1="4" y1="7" x2="20" y2="7" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
            <Line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
            <Line x1="4" y1="17" x2="14" y2="17" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
    );
}

function PersonIcon({ size = 24, color = colors.accentOrange }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Circle cx="12" cy="8" r="3.4" stroke={color} strokeWidth={1.8} fill="none" />
            <Path d="M5.5 20c0-3.6 3-6 6.5-6s6.5 2.4 6.5 6" stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" />
        </Svg>
    );
}

function TrendUpIcon({ size = 24, color = colors.accentOrange }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Polyline points="4,17 10,10 14,13 20,6" stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M15 6h5v5" stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

const STUDY_TECHNIQUES = [
    { id: '1', title: 'Técnica Pomodoro', subtitle: '25 min foco / 5 descanso', Icon: ClockIcon },
    { id: '2', title: 'Repetición espaciada', subtitle: 'Repasa justo antes de olvidar', Icon: RepeatLinesIcon },
    { id: '3', title: 'Active recall', subtitle: 'Recupera de memoria, no releas', Icon: PersonIcon },
    { id: '4', title: 'Curva del olvido', subtitle: 'Por qué repasar a las 24h', Icon: TrendUpIcon },
];

export default function StudyTipsScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <HealthScreenHeader title="Cómo estudiar mejor" onBack={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.list}>
                    {STUDY_TECHNIQUES.map((tech, index) => {
                        const { Icon } = tech;
                        return (
                            <View key={tech.id} style={[styles.row, index > 0 && styles.rowSeparator]}>
                                <View style={styles.iconWrap}>
                                    <Icon />
                                </View>
                                <View style={styles.rowTextWrap}>
                                    <Text style={styles.rowTitle}>{tech.title}</Text>
                                    <Text style={styles.rowSubtitle}>{tech.subtitle}</Text>
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* Espacio grande antes del banner, tal como aparece en el frame de Figma */}
                <View style={styles.bannerSpacer} />

                {/* CTA final al Tutor IA */}
                <View style={styles.ctaCard}>
                    <View style={styles.ctaText}>
                        <Text style={styles.ctaTitle}>¿Lo aplicamos a tu temario?</Text>
                        <Text style={styles.ctaSubtitle}>El Tutor IA te hace un plan con estas técnicas</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.ctaButton}
                        activeOpacity={0.75}
                        onPress={() => navigation.navigate('AITutor')}
                    >
                        <Text style={styles.ctaButtonText}>Tutor IA</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: spacing.lg }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
    scrollContent: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
    },
    list: {
        marginTop: 8,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
    },
    rowSeparator: {
        borderTopWidth: 0.44,
        borderTopColor: FIGMA.separator,
    },
    iconWrap: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    rowTextWrap: {
        flex: 1,
    },
    rowTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: colors.textDark,
    },
    rowSubtitle: {
        marginTop: 2,
        fontFamily: 'Poppins-Regular',
        fontSize: 9,
        color: FIGMA.textNote,
    },
    bannerSpacer: {
        height: 200,
    },
    ctaCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.ctaGreen,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: FIGMA.bannerBorder,
        paddingVertical: 18,
        paddingHorizontal: 18,
    },
    ctaText: {
        flex: 1,
        marginRight: 12,
    },
    ctaTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 17.8,
        color: colors.white,
    },
    ctaSubtitle: {
        marginTop: 4,
        fontFamily: 'Poppins-Light',
        fontSize: 14.3,
        color: FIGMA.offWhite,
    },
    ctaButton: {
        width: 88,
        height: 36,
        borderRadius: 9.8,
        borderWidth: 1.3,
        borderColor: colors.white,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ctaButtonText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 12.4,
        color: colors.white,
    },
});
