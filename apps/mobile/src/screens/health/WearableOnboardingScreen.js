// Bloque 3 · Salud — Onboarding wearable · paso 1 (decisión)
// Pantalla mínima para el 90% de usuarios que no tienen wearable premium.
// Al pulsar "No" persiste el flag y el teaser desaparece del hub para siempre.
import React from 'react';
import { View, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Text from '../../components/AppText';
import HealthScreenHeader from '../../components/HealthScreenHeader';
import { colors, spacing } from '../../theme';

export const WEARABLE_DECISION_KEY = 'opox.health.wearableDecision';

const FIGMA = {
    subtitleMuted: 'rgba(65,41,80,0.5)',
    cardBorder: 'rgba(65,41,80,0.3)',
};

export default function WearableOnboardingScreen({ navigation }) {
    const handleYes = async () => {
        await AsyncStorage.setItem(WEARABLE_DECISION_KEY, 'yes').catch(() => {});
        navigation.replace('WearableSelect');
    };

    const handleNo = async () => {
        await AsyncStorage.setItem(WEARABLE_DECISION_KEY, 'no').catch(() => {});
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container} edges={['top','left','right']}>
            <StatusBar barStyle="dark-content" />
            <HealthScreenHeader title="Wearable" onBack={() => navigation.goBack()} />

            <View style={styles.content}>
                <View style={styles.iconWrap}>
                    <Ionicons name="watch-outline" size={72} color={colors.accentOrange} />
                </View>

                <Text style={styles.title}>¿Tienes un reloj o pulsera?</Text>
                <Text style={styles.subtitle}>
                    Puede leer tu ritmo cardíaco y sueño automáticamente.{'\n'}
                    Es opcional — el Estado del día funciona igual sin él.
                </Text>

                <View style={styles.actions}>
                    <TouchableOpacity style={styles.primary} onPress={handleYes} activeOpacity={0.85}>
                        <Text style={styles.primaryText}>Sí, tengo uno</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondary} onPress={handleNo} activeOpacity={0.7}>
                        <Text style={styles.secondaryText}>No, sigo con el Estado del día</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.white },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
    },
    iconWrap: {
        width: 120, height: 120, borderRadius: 60,
        backgroundColor: 'rgba(246,150,36,0.12)',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: spacing.lg,
    },
    title: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 22,
        color: colors.textDark,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    subtitle: {
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        lineHeight: 20,
        color: FIGMA.subtitleMuted,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    actions: {
        alignSelf: 'stretch',
    },
    primary: {
        height: 56,
        borderRadius: 14,
        backgroundColor: colors.ctaGreen,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
    },
    primaryText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 15,
        color: colors.white,
    },
    secondary: {
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 13,
        color: FIGMA.subtitleMuted,
    },
});
