import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

/** Topbar simple (chevron + título + slot derecho opcional) usado en Bloques 4 y 5. */
export default function ScreenHeader({ title, onBack, right, dark }) {
    return (
        <View style={styles.header}>
            <TouchableOpacity onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.back}>‹</Text>
            </TouchableOpacity>
            <Text style={[styles.title, dark && styles.titleDark]} numberOfLines={1}>{title}</Text>
            {right && <View style={styles.right}>{right}</View>}
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 16,
        paddingTop: 6,
        paddingBottom: 8,
    },
    back: {
        color: '#FF6B4A',
        fontWeight: '700',
        fontSize: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F1B33',
        letterSpacing: -0.4,
        flexShrink: 1,
    },
    titleDark: {
        fontSize: 16,
    },
    right: {
        marginLeft: 'auto',
    },
});
