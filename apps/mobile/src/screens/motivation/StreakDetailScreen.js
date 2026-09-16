import React, { useState, useEffect } from 'react';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    ScrollView,
} from 'react-native';
import Text from '../../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { motivationApi } from '../../api';
import { colors, spacing } from '../../theme';
import { getNextMilestone } from '../../lib/streakMilestones';
import { useThemeColors } from '../../hooks/useThemeColors';

// Chevron y llama coinciden con MotivationHomeScreen (mismos paths Figma) para
// que la navegación entre ambas se sienta continua.
function IconChevronLeft({ size = 22, color = colors.textDark }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function IconFlame({ size = 66, color = colors.accentOrange }) {
    const h = size * (110.37 / 81);
    return (
        <Svg width={size} height={h} viewBox="0 0 81 111" fill="none">
            <Path
                d="M80.6257 70.2502C79.5424 62.3827 74.8545 56.2403 70.5565 49.754C70.2451 50.3688 70.0311 50.8102 69.8009 51.2408C68.2464 54.1306 66.8923 57.153 65.0995 59.8829C61.5598 65.3239 56.3817 67.8534 49.8143 67.7369C49.7958 67.5994 49.7958 67.4601 49.8143 67.3226C50.0662 66.7972 50.3289 66.2745 50.5888 65.7518C53.7358 59.455 55.9728 52.8848 56.3194 45.7945C56.7365 37.3366 54.5347 29.5069 50.5049 22.1215C45.8468 13.585 39.2523 6.65724 32.3003 0.00842829C32.2678 -0.0213627 32.1513 0.035511 32.0294 0.0598855C32.0782 0.46071 32.1432 0.858826 32.1757 1.25965C32.59 6.23204 33.24 11.2017 33.3483 16.1822C33.5027 23.2481 31.477 29.7019 26.632 35.04C24.3652 37.5397 21.9549 39.9148 19.6177 42.3523C15.0841 47.0755 11.9724 52.5489 10.7672 59.0488C10.445 60.7875 10.2391 62.5452 9.98185 64.2947L9.61895 64.4003L4.99332 52.7548C2.70758 58.2824 0.968908 63.726 0.318936 69.5027C-1.37821 84.6113 3.69789 96.8978 15.5472 106.362C17.3861 107.83 19.4606 109.003 21.5053 110.368L23.875 105.853C5.55663 95.6674 3.39547 77.4867 5.90599 67.8101C8.19172 72.3221 11.8641 75.3309 15.5662 78.765C15.5202 77.9119 15.4877 77.3838 15.466 76.8692C15.3225 73.362 15.0137 69.8521 15.0733 66.3476C15.1979 58.7482 17.5107 51.9342 22.8757 46.3524C24.9321 44.2129 26.9958 42.0824 29.0667 39.9609C34.0254 34.872 37.1913 28.884 38.0281 21.7802C38.3315 19.2561 38.4614 16.7104 38.6998 13.8125C40.5305 16.3312 42.3098 18.5736 43.8643 20.9596C48.2354 27.6734 51.1034 34.9072 51.2605 43.0537C51.3851 49.6836 49.6599 55.872 46.8244 61.7869C45.1995 65.183 43.4527 68.5278 41.7276 71.9591C54.226 74.5428 64.5037 71.8941 71.063 60.0671C74.8138 65.0801 76.5254 71.8616 75.7265 78.6621C74.283 90.9523 67.6723 99.746 57.0398 105.81L59.3093 110.108C59.4376 110.113 59.566 110.101 59.6912 110.073C59.8943 109.981 60.092 109.87 60.287 109.761C67.0169 105.945 72.4171 100.767 76.1571 93.9693C80.2303 86.5676 81.7875 78.6296 80.6257 70.2502Z"
                fill={color}
            />
            <Path
                d="M39.7761 25.0326C38.4734 27.1152 37.3631 28.9569 36.1904 30.7579C33.1626 35.4107 26.17 37.1223 21.3277 34.4276C17.7556 32.4343 15.4726 29.4525 14.4326 25.5065C13.027 20.1875 13.6201 14.8738 14.5653 9.57646C15.134 6.40778 15.8355 3.26076 16.499 0C-5.35634 15.1528 -3.81265 40.0825 11.2829 53.7647L14.8632 50.3929C10.4569 45.824 7.00938 40.7351 5.67964 34.4438C4.34179 28.1038 5.3032 22.0968 8.3689 16.3986C8.4718 16.8675 8.52535 17.3458 8.52869 17.8259C8.84555 20.805 8.86992 23.8707 9.56864 26.7632C12.1767 37.5475 23.5485 44.6567 35.183 38.5198C35.3703 38.4534 35.5634 38.4044 35.7598 38.3735C34.384 43.5951 31.0963 47.1646 26.8958 50.1301L29.7232 54.3307C34.5574 51.0049 38.2026 46.9236 40.1715 41.4583C42.1404 35.993 40.9135 30.6847 39.7761 25.0326Z"
                fill={color}
                transform="translate(19.77, 55.78)"
            />
        </Svg>
    );
}

// ─── 5.3 · Detalle de racha ────────────────────────────────────────────────
// Rediseñado para alinearse visualmente con MotivationHomeScreen (mismo hero,
// mismos pips, mismo hito). Antes esta pantalla usaba ScreenHeader legacy,
// llama genérica y emoji 🏅 en el hito — un salto brusco de estilo respecto
// al hub de Motivación desde el que se accede.
export default function StreakDetailScreen({ navigation }) {
    const [detail, setDetail] = useState(null);
    // Fase 3 · dark mode (gaps-15-09-26).
    const themeColors = useThemeColors();
    const isDark = themeColors.textDark === '#F0F0F2';

    useEffect(() => {
        motivationApi.getStreak().then(({ data }) => { if (data) setDetail(data); });
    }, []);

    const currentStreak = detail?.currentStreak ?? 0;
    const longestStreak = detail?.longestStreak ?? 0;
    const recentActivityDates = detail?.recentActivityDates ?? [];
    // El backend puede devolver nextMilestone; si no llega, derivamos localmente
    // del currentStreak con la misma tabla que MotivationHomeScreen.
    const nextMilestone = detail?.nextMilestone ?? getNextMilestone(currentStreak);

    // Set de fechas activas para pintar los pips reales (no solo por currentStreak).
    const activeSet = new Set(recentActivityDates);
    const dayIsoAt = (offsetFromToday) => {
        const d = new Date();
        d.setDate(d.getDate() + offsetFromToday);
        return d.toISOString().slice(0, 10);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: themeColors.grayLight }]}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={themeColors.grayLight}
            />

            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <IconChevronLeft size={22} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Tu racha</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                <View style={styles.heroWrap}>
                    <IconFlame size={66} />
                    <View>
                        <Text style={styles.heroValue}>{currentStreak}</Text>
                        <Text style={styles.heroCaption}>Días de racha</Text>
                        <Text style={styles.heroRecord}>Récord: {longestStreak} días</Text>
                    </View>
                </View>

                <Text style={styles.groupTitle}>ÚLTIMOS 14 DÍAS</Text>
                {/* Pips reales cuando el backend responde con recentActivityDates;
                    fallback: derivar por currentStreak como en MotivationHomeScreen. */}
                <View style={styles.pipsRow}>
                    {Array.from({ length: 7 }, (_, i) => {
                        const offset = -13 + i;
                        const iso = dayIsoAt(offset);
                        const done = recentActivityDates.length > 0
                            ? activeSet.has(iso)
                            : currentStreak > (13 - i);
                        return <View key={i} style={[styles.pip, done ? styles.pipDone : styles.pipEmpty]} />;
                    })}
                </View>
                <View style={[styles.pipsRow, { marginBottom: spacing.md }]}>
                    {Array.from({ length: 7 }, (_, i) => {
                        const offset = -6 + i;
                        const iso = dayIsoAt(offset);
                        const isToday = offset === 0;
                        const done = recentActivityDates.length > 0
                            ? activeSet.has(iso)
                            : currentStreak > (6 - i);
                        const style = isToday && !done
                            ? styles.pipToday
                            : done ? styles.pipDone : styles.pipEmpty;
                        return <View key={i + 7} style={[styles.pip, style]} />;
                    })}
                </View>

                <Text style={styles.groupTitle}>PRÓXIMO HITO</Text>
                <View style={styles.milestoneRow}>
                    <IconFlame size={36} />
                    {nextMilestone ? (
                        <View>
                            <Text style={styles.milestoneTitle}>Racha de {nextMilestone.days} días</Text>
                            <Text style={styles.milestoneCaption}>
                                + {nextMilestone.points} Opopoints · te falta{nextMilestone.remaining === 1 ? '' : 'n'} {nextMilestone.remaining}
                            </Text>
                        </View>
                    ) : (
                        <View>
                            <Text style={styles.milestoneTitle}>¡Racha máxima alcanzada!</Text>
                            <Text style={styles.milestoneCaption}>Sigue así para mantenerla</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.grayLight },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing.sm,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F0F0F2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerSpacer: { width: 44 },
    headerTitle: {
        flex: 1,
        fontSize: 21,
        fontWeight: '600',
        color: colors.textDark,
        letterSpacing: -0.3,
        textAlign: 'center',
    },
    scroll: { flex: 1 },
    body: { paddingHorizontal: 27, paddingBottom: spacing.lg },

    heroWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.md,
        paddingVertical: spacing.lg,
    },
    heroValue: { fontSize: 75, fontWeight: '800', color: colors.textDark, lineHeight: 80 },
    heroCaption: { fontSize: 16, color: colors.textDark },
    heroRecord: { fontSize: 9, color: colors.textMuted, marginTop: 2 },

    groupTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textDark,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        marginBottom: spacing.sm,
        marginTop: spacing.xs,
    },
    pipsRow: { flexDirection: 'row', gap: 5, marginBottom: 5 },
    pip: { flex: 1, aspectRatio: 1, borderRadius: 8 },
    pipDone: { backgroundColor: colors.ctaGreen },
    pipToday: { backgroundColor: colors.ctaGreen, opacity: 0.5 },
    pipEmpty: { backgroundColor: '#DDE1EA' },

    milestoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    milestoneTitle: { fontSize: 16, fontWeight: '700', color: colors.textDark },
    milestoneCaption: { fontSize: 9, color: colors.textMuted, marginTop: 2 },
});
