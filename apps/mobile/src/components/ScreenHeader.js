import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme';

/** Topbar estándar OPOX: chevron + título (+ subtítulo opcional) + slot derecho. */
export default function ScreenHeader({ title, subtitle, onBack, right }) {
    return (
        <View style={styles.header}>
            <TouchableOpacity
                onPress={onBack}
                style={styles.backBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
                <Text style={styles.back}>‹</Text>
            </TouchableOpacity>

            <View style={styles.titleBlock}>
                <Text style={styles.title} numberOfLines={1}>{title}</Text>
                {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
            </View>

            {right
                ? <View style={styles.right}>{right}</View>
                : <View style={styles.rightPlaceholder} />
            }
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 6,
        paddingBottom: 8,
    },
    backBtn: {
        paddingRight: 8,
    },
    back: {
        color: colors.dark,
        fontWeight: '700',
        fontSize: 22,
    },
    titleBlock: {
        flex: 1,
        alignItems: 'center',
    },
    title: {
        fontSize: 17,
        fontWeight: '800',
        color: colors.dark,
        letterSpacing: -0.3,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 12,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: 1,
    },
    right: {
        marginLeft: 'auto',
    },
    rightPlaceholder: {
        width: 30,
    },
});
