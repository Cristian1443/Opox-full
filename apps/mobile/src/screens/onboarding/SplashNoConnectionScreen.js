import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

export default function SplashNoConnectionScreen({ navigation }) {
    return (
        <View style={s.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.dark} />

            <View style={s.center}>
                <Ionicons name="wifi-outline" size={72} color={colors.primary} style={s.icon} />
                <Text style={s.title}>Sin conexión</Text>
                <Text style={s.desc}>
                    Necesitas internet para iniciar Opox.{'\n'}
                    Revisa tu red e inténtalo de nuevo.
                </Text>
            </View>

            <TouchableOpacity style={s.btn} onPress={() => navigation.replace('Splash')}>
                <Text style={s.btnText}>Reintentar</Text>
            </TouchableOpacity>
        </View>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1, backgroundColor: colors.dark,
        alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 32,
    },
    center: { alignItems: 'center', marginBottom: 60 },
    icon: { marginBottom: 24 },
    title: {
        color: colors.white, fontSize: 24,
        fontWeight: '900', marginBottom: 12, textAlign: 'center',
    },
    desc: {
        color: colors.grayText, fontSize: 15,
        textAlign: 'center', lineHeight: 22,
    },
    btn: {
        position: 'absolute', bottom: 48, left: 32, right: 32,
        backgroundColor: colors.primary, borderRadius: 50,
        paddingVertical: 18, alignItems: 'center',
    },
    btnText: { color: colors.white, fontSize: 17, fontWeight: '700' },
});