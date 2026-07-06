import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    Dimensions,
} from 'react-native';
import { colors } from '../../theme';

const { width } = Dimensions.get('window');

export default function EntradaScreen({ navigation }) {
    const handleCrearCuenta = () => navigation.navigate('Registro');
    const handleLogin = () => navigation.navigate('Login');

    return (
        <SafeAreaView style={s.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.dark} />

            <View style={s.content}>
                <View style={s.logoBox}>
                    <Text style={s.logoLetter}>O</Text>
                </View>

                <Text style={s.appName}>OPOX</Text>
                <Text style={s.tagline}>
                    Empieza a preparar tu plaza con un tutor de IA a tu lado.
                </Text>
            </View>

            <View style={s.footer}>
                <TouchableOpacity
                    style={s.primaryButton}
                    onPress={handleCrearCuenta}
                    activeOpacity={0.85}
                >
                    <Text style={s.primaryButtonText}>Crear cuenta</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={s.secondaryButton}
                    onPress={handleLogin}
                    activeOpacity={0.85}
                >
                    <Text style={s.secondaryButtonText}>Ya tengo cuenta</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.dark,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    logoBox: {
        width: 96,
        height: 96,
        backgroundColor: colors.primary,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    logoLetter: {
        color: colors.white,
        fontSize: 48,
        fontWeight: '900',
    },
    appName: {
        color: colors.white,
        fontSize: 32,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: 14,
    },
    tagline: {
        color: colors.grayText,
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        maxWidth: width * 0.72,
    },
    footer: {
        width: '100%',
        paddingHorizontal: 24,
        paddingBottom: 40,
        gap: 12,
    },
    primaryButton: {
        backgroundColor: colors.primary,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryButton: {
        backgroundColor: '#1a2a3f',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
});
