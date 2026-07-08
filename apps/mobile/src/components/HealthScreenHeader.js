// Header estándar del bloque 3 · Salud.
// Patrón del mockup: chevron naranja + título bold grande alineado a la izquierda,
// sin barra ni divider. Slot `right` para elementos como el status del wearable.
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';

export default function HealthScreenHeader({ title, onBack, right, variant = 'light' }) {
    const isDark = variant === 'dark';
    const titleColor = isDark ? '#FFFFFF' : colors.text;
    const chevronColor = isDark ? '#FFFFFF' : colors.primary;

    return (
        <View style={styles.header}>
            <TouchableOpacity
                onPress={onBack}
                style={styles.iconBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
                <Ionicons name="chevron-back" size={24} color={chevronColor} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: titleColor }]} numberOfLines={1}>
                {title}
            </Text>
            {right ? <View style={styles.right}>{right}</View> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
        gap: spacing.sm,
    },
    iconBtn: {
        padding: 4,
    },
    title: {
        flex: 1,
        fontSize: 24,
        fontWeight: '800',
    },
    right: {
        marginLeft: 'auto',
    },
});
