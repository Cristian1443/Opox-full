// Bloque 3 · Salud — Pantalla 3.6 · Home de Consejos
import React from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line, Rect } from 'react-native-svg';
import { colors, spacing } from '../../theme';
import HealthScreenHeader from '../../components/HealthScreenHeader';

// Color confirmado contra Figma (frame CONSEJOS, Bloque 3) sin equivalente
// exacto en theme.js.
const FIGMA = {
    separator: 'rgba(65,41,80,0.5)',
    textNote: '#343A3D',
};

// ─── Iconos aproximados (ver nota: no son el asset exportado) ───────────────
function NotesIcon({ size = 28, color = colors.accentOrange }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Rect x="4" y="3" width="16" height="18" rx="1.5" stroke={color} strokeWidth={1.8} fill="none" />
            <Line x1="8" y1="8" x2="16" y2="8" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
            <Line x1="8" y1="12" x2="16" y2="12" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
            <Line x1="8" y1="16" x2="13" y2="16" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
    );
}

function ForkKnifeIcon({ size = 28, color = colors.accentOrange }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Line x1="7" y1="3" x2="7" y2="21" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
            <Line x1="4.5" y1="3" x2="4.5" y2="9" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
            <Line x1="9.5" y1="3" x2="9.5" y2="9" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
            <Path d="M17 3c-2 1-2.5 3-2.5 5s.5 2.5 2.5 3v10" stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function MoonCircleIcon({ size = 28, color = colors.accentOrange }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.8} fill="none" strokeDasharray="3 3" />
            <Path d="M14.5 8a5 5 0 1 0 0 8 6 6 0 1 1 0-8z" fill={color} />
        </Svg>
    );
}

// Cada categoría con su ícono, texto y ruta real de destino.
const CATEGORIES = [
    {
        id: 'study',
        title: 'Cómo estudiar mejor',
        note: 'Técnicas, memoria y concentración',
        Icon: NotesIcon,
        route: 'StudyTips',
    },
    {
        id: 'food',
        title: 'Alimentación',
        note: 'Comer para potenciar la memoria',
        Icon: ForkKnifeIcon,
        route: 'FoodHome',
    },
    {
        id: 'meditation',
        title: 'Meditación y relajación',
        note: 'Calma antes del examen',
        Icon: MoonCircleIcon,
        route: 'MeditationList',
    },
];

export default function AdviceHomeScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <HealthScreenHeader
                title="Consejos"
                subtitle="Cuida tu rendimiento dentro y fuera del estudio"
                onBack={() => navigation.goBack()}
            />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.list}>
                    {CATEGORIES.map((cat, index) => {
                        const { Icon } = cat;
                        return (
                            <TouchableOpacity
                                key={cat.id}
                                style={[styles.row, index > 0 && styles.rowSeparator]}
                                activeOpacity={0.7}
                                onPress={() => navigation.navigate(cat.route)}
                            >
                                <View style={styles.iconWrap}>
                                    <Icon />
                                </View>
                                <View style={styles.rowTextWrap}>
                                    <Text style={styles.rowTitle}>{cat.title}</Text>
                                    <Text style={styles.rowNote}>{cat.note}</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
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
        paddingBottom: spacing.md,
    },
    list: {
        marginTop: spacing.sm,
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
        width: 40,
        height: 40,
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
    rowNote: {
        marginTop: 2,
        fontFamily: 'Poppins-Regular',
        fontSize: 9,
        color: FIGMA.textNote,
    },
});
