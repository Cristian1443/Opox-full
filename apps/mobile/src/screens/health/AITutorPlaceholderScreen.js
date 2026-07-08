// Placeholder temporal para AITutor — se sustituye cuando el bloque 4 (Tutor IA) entre.
// Evita crashes de los CTAs que apuntan a 'AITutor' desde el bloque 3.
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import HealthScreenHeader from '../../components/HealthScreenHeader';

export default function AITutorPlaceholderScreen({ navigation, route }) {
    const technique = route?.params?.technique;

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <HealthScreenHeader title="Tutor IA" onBack={() => navigation.goBack()} />

            <View style={styles.content}>
                <View style={styles.iconWrap}>
                    <Ionicons name="sparkles" size={72} color={colors.primary} />
                </View>

                <Text style={styles.title}>El Tutor IA llega pronto</Text>
                <Text style={styles.subtitle}>
                    Estamos preparando tu tutor personalizado. Estará disponible en el bloque 4.
                </Text>

                {technique && (
                    <View style={styles.contextBox}>
                        <Text style={styles.contextLabel}>Contexto guardado</Text>
                        <Text style={styles.contextValue}>{technique}</Text>
                    </View>
                )}

                <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
                    <Text style={styles.buttonText}>Volver</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    iconWrap: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.text,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    subtitle: {
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: spacing.xl,
    },
    contextBox: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.separator,
        alignSelf: 'stretch',
        marginBottom: spacing.xl,
    },
    contextLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    contextValue: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    button: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.xl,
        paddingVertical: 14,
        borderRadius: 20,
        minWidth: 160,
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
