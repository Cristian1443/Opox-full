import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { colors, spacing } from '../../theme';

// Colores confirmados contra Figma (frame HUB AULA VIRTUAL, Bloque 8) sin
// equivalente exacto en theme.js.
const FIGMA = {
    subtitleMuted: 'rgba(65,41,80,0.5)',
    cardBorder: 'rgba(65,41,80,0.3)',
    cardFill: 'rgba(255,255,255,0.5)',
    textNoteMuted: 'rgba(52,58,61,0.5)',
};

// ─── Iconos aproximados (ver nota: no son el asset exportado) ───────────────
function ChatTutorIcon({ size = 30, color = colors.accentOrange }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 40 40">
            <Path d="M2 6H24V22H12L6 28V22H2Z" stroke={color} strokeWidth={2.4} fill="none" strokeLinejoin="round" />
            <Path d="M14 12H32V26L38 32V12H14" stroke={color} strokeWidth={2.4} fill="none" strokeLinejoin="round" />
        </Svg>
    );
}

function PodcastIcon({ size = 30, color = colors.accentOrange }) {
    const bars = [6, 14, 22, 12, 18, 8];
    return (
        <Svg width={size} height={size * 0.8} viewBox="0 0 40 32">
            {bars.map((h, i) => (
                <Rect key={i} x={i * 7} y={16 - h / 2} width={4} height={h} rx={2} fill={color} />
            ))}
        </Svg>
    );
}

function SummaryIcon({ size = 30, color = colors.accentOrange }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 36 36">
            <Rect x={7} y={2} width={27} height={32} rx={3} stroke={color} strokeWidth={2.4} fill="none" />
            <Path d="M13 10H28M13 18H28M13 26H22" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
            <Circle cx={4} cy={9} r={2.2} fill={color} />
            <Circle cx={4} cy={18} r={2.2} fill={color} />
            <Circle cx={4} cy={27} r={2.2} fill={color} />
        </Svg>
    );
}

function FlashcardsIcon({ size = 30, color = colors.accentOrange }) {
    return (
        <Svg width={size} height={size * 0.83} viewBox="0 0 36 30">
            <Rect x={7} y={1} width={22} height={16} rx={2.5} stroke={color} strokeWidth={2} fill="none" />
            <Rect x={4} y={7} width={22} height={16} rx={2.5} stroke={color} strokeWidth={2} fill={colors.white} />
            <Path d="M9 15H21M9 19H17" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
    );
}

// El subtítulo de "Modo Podcast" en Figma es una capa huérfana duplicada
// del de "Chat con Tutor IA" (ver hallazgo de la referencia) — se conserva
// el subtítulo real ya existente en vez de propagar ese texto sin sentido.
const MODES = [
    {
        id: 'chat',
        title: 'Chat con Tutor IA',
        subtitle: 'Resuelve dudas y genera flashcards',
        Icon: ChatTutorIcon,
        bordered: false,
        route: 'TutorChat',
    },
    {
        id: 'podcast',
        title: 'Modo Podcast',
        subtitle: 'Estudia con audio, manos libres',
        Icon: PodcastIcon,
        bordered: true,
        route: 'TutorPodcast',
    },
    {
        id: 'summaries',
        title: 'Resúmenes inteligentes',
        subtitle: 'Lo esencial de cualquier tema',
        Icon: SummaryIcon,
        bordered: true,
        route: 'TutorSummaries',
    },
    {
        id: 'flashcards',
        title: 'Flashcards',
        subtitle: 'Repasa rápido con tarjetas',
        Icon: FlashcardsIcon,
        bordered: true,
        route: 'TutorFlashcards',
    },
];

function ModeRow({ mode, onPress }) {
    const { Icon } = mode;
    return (
        <TouchableOpacity
            style={[styles.row, mode.bordered && styles.rowBordered]}
            onPress={onPress}
            activeOpacity={0.7}
            accessibilityLabel={mode.title}
            accessibilityRole="button"
        >
            <View style={styles.iconWrap}>
                <Icon />
            </View>
            <View style={styles.rowTextWrap}>
                <Text style={styles.rowTitle}>{mode.title}</Text>
                <Text style={styles.rowSubtitle}>{mode.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textDark} />
        </TouchableOpacity>
    );
}

export default function TutorHomeScreen({ navigation, route }) {
    const technique = route?.params?.technique ?? null;

    useEffect(() => {
        if (technique) {
            navigation.navigate('TutorChat', { technique });
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleMode = (mode) => {
        const params = mode.id === 'chat' && technique ? { technique } : undefined;
        navigation.navigate(mode.route, params);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.iconBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Volver"
                >
                    <Ionicons name="chevron-back" size={24} color={colors.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Aula virtual</Text>
                <View style={styles.iconBtn} />
            </View>
            <Text style={styles.headerSubtitle}>Entiende y asimila el temario con la IA.</Text>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.body}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.list}>
                    {MODES.map((mode) => (
                        <ModeRow key={mode.id} mode={mode} onPress={() => handleMode(mode)} />
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.white },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: 4,
    },
    iconBtn: { width: 32, padding: 4 },
    headerTitle: {
        flex: 1,
        fontFamily: 'Poppins-SemiBold',
        fontSize: 21.3,
        color: colors.textDark,
        textAlign: 'center',
    },
    headerSubtitle: {
        fontFamily: 'Poppins-Regular',
        fontSize: 10.7,
        color: FIGMA.subtitleMuted,
        textAlign: 'center',
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.md,
    },
    scroll: { flex: 1 },
    body: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.xs,
        paddingBottom: spacing.lg,
    },
    list: { gap: 12 },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 119,
        paddingHorizontal: 16,
        borderRadius: 16,
    },
    rowBordered: {
        backgroundColor: FIGMA.cardFill,
        borderWidth: 0.32,
        borderColor: FIGMA.cardBorder,
    },
    iconWrap: {
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    rowTextWrap: { flex: 1 },
    rowTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: colors.textDark,
    },
    rowSubtitle: {
        marginTop: 4,
        fontFamily: 'Poppins-Regular',
        fontSize: 11.6,
        color: FIGMA.textNoteMuted,
    },
});
