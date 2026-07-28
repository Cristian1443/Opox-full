import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';

const MODES = [
    {
        id: 'chat',
        icon: 'chatbubbles-outline',
        title: 'Chat con Tutor IA',
        subtitle: 'Resuelve dudas y genera flashcards',
        color: '#7B4BC4',
        route: 'TutorChat',
    },
    {
        id: 'podcast',
        icon: 'headset-outline',
        title: 'Modo Podcast',
        subtitle: 'Estudia con audio, manos libres',
        color: '#E55A35',
        route: 'TutorPodcast',
    },
    {
        id: 'summaries',
        icon: 'document-text-outline',
        title: 'Resúmenes inteligentes',
        subtitle: 'Lo esencial de cualquier tema',
        color: '#636366',
        route: 'TutorSummaries',
    },
    {
        id: 'flashcards',
        icon: 'layers-outline',
        title: 'Flashcards',
        subtitle: 'Repaso rápido con tarjetas',
        color: '#1f9d6b',
        route: 'TutorFlashcards',
    },
];

function ModeCard({ icon, title, subtitle, color, onPress }) {
    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: color + '18' }]}
            onPress={onPress}
            activeOpacity={0.75}
            accessibilityLabel={title}
            accessibilityRole="button"
        >
            <View style={[styles.iconBox, { backgroundColor: color + '28' }]}>
                <Ionicons name={icon} size={26} color={color} />
            </View>
            <View style={styles.cardTexts}>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={styles.cardSubtitle}>{subtitle}</Text>
            </View>
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
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

            {/* Header personalizado — chevron pegado al título, subtitle con "la IA" en naranja */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Volver"
                >
                    <Text style={styles.backChevron}>‹</Text>
                </TouchableOpacity>
                <View style={styles.titleBlock}>
                    <Text style={styles.title}>Aula Virtual</Text>
                    <Text style={styles.subtitle}>
                        Entiende y asimila el temario con{' '}
                        <Text style={styles.subtitleAccent}>la IA</Text>.
                    </Text>
                </View>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.body}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.list}>
                    {MODES.map((mode) => (
                        <ModeCard
                            key={mode.id}
                            icon={mode.icon}
                            title={mode.title}
                            subtitle={mode.subtitle}
                            color={mode.color}
                            onPress={() => handleMode(mode)}
                        />
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
    },
    backBtn: {
        paddingRight: spacing.xs,
        paddingTop: 1,
    },
    backChevron: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.primary,
        lineHeight: 32,
    },
    titleBlock: {
        flex: 1,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: colors.dark,
        letterSpacing: -0.3,
    },
    subtitle: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 3,
        lineHeight: 18,
    },
    subtitleAccent: {
        color: colors.primary,
        fontWeight: '600',
    },

    // Lista
    scroll: { flex: 1 },
    body: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.xs,
        paddingBottom: spacing.lg,
    },
    list: {
        gap: spacing.sm,
    },

    // Card horizontal
    card: {
        borderRadius: 16,
        padding: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 52,
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    cardTexts: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.dark,
        marginBottom: 3,
    },
    cardSubtitle: {
        fontSize: 13,
        color: colors.textSecondary,
        lineHeight: 18,
    },
});
