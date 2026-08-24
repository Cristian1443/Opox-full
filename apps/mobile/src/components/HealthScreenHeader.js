// Header estándar del bloque 3 · Salud.
// Patrón del mockup: chevron naranja + título bold grande alineado a la izquierda,
// sin barra ni divider. Slot `right` para elementos como el status del wearable.
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';

export default function HealthScreenHeader({ title, subtitle, onBack, right, variant = 'light' }) {
    const isDark = variant === 'dark';
    const titleColor = isDark ? '#FFFFFF' : colors.textDark;
    const chevronColor = isDark ? '#FFFFFF' : colors.textDark;

    return (
        <View style={styles.header}>
            <TouchableOpacity
                onPress={onBack}
                style={styles.iconBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
                <Ionicons name="chevron-back" size={24} color={chevronColor} />
            </TouchableOpacity>
            <View style={styles.titleWrap}>
                <Text style={[styles.title, { color: titleColor }]} numberOfLines={1}>
                    {title}
                </Text>
                {subtitle ? (
                    <Text style={styles.subtitle} numberOfLines={2}>
                        {subtitle}
                    </Text>
                ) : null}
            </View>
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
    titleWrap: {
        flex: 1,
    },
    title: {
        fontSize: 21,
        fontFamily: 'Poppins-SemiBold',
        textAlign: 'center',
    },
    subtitle: {
        marginTop: 4,
        fontSize: 10.5,
        fontFamily: 'Poppins-Regular',
        color: 'rgba(65,41,80,0.5)',
        textAlign: 'center',
    },
    right: {
        marginLeft: 'auto',
    },
});
