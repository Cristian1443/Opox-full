import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { colors } from '../theme';

export default function HomeScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.body}>
                <Text style={styles.title}>¡Bienvenido a Opox!</Text>
                <Text style={styles.subtitle}>
                    Onboarding completado. Aquí irá el Home real de la app.
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
    body: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.dark,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: colors.grayText,
        textAlign: 'center',
    },
});
