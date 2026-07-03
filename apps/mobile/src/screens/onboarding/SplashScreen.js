import React, { useEffect } from 'react';
import {
    View, Text, StyleSheet, ActivityIndicator, StatusBar,
} from 'react-native';
import { colors } from '../../theme';

export default function SplashScreen({ navigation }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            const hasConnection = true; // reemplaza con NetInfo real
            const isUpdated = true; // reemplaza con tu lógica de versión
            if (!hasConnection) return navigation.replace('SplashNoConnection');
            if (!isUpdated) return navigation.replace('SplashUpdate');
            navigation.replace('OnboardingSlider');
        }, 2500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={s.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.dark} />

            <View style={s.center}>
                <View style={s.logoBox}>
                    <Text style={s.logoLetter}>O</Text>
                </View>
                <Text style={s.appName}>OPOX</Text>
                <Text style={s.tagline}>Tu plaza, más cerca</Text>
                <ActivityIndicator size="large" color={colors.primary} style={s.spinner} />
            </View>

            <Text style={s.footer}>Comprobando versión mínima…</Text>
        </View>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.dark,
        alignItems: 'center',
        justifyContent: 'center',
    },
    center: { alignItems: 'center' },
    logoBox: {
        width: 90, height: 90,
        backgroundColor: colors.primary,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    logoLetter: { color: colors.white, fontSize: 44, fontWeight: 'bold' },
    appName: {
        color: colors.white, fontSize: 28,
        fontWeight: '900', letterSpacing: 2, marginBottom: 8,
    },
    tagline: { color: colors.grayText, fontSize: 15 },
    spinner: { marginTop: 40 },
    footer: {
        position: 'absolute', bottom: 40,
        color: colors.grayText, fontSize: 13,
    },
});