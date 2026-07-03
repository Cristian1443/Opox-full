import React, { useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

export default function SesionIniciadaScreen({ navigation, route }) {
    const { email } = route.params || {};

    useEffect(() => {
        // TODO: sustituir el timer por la carga real del perfil / token
        const timer = setTimeout(() => {
            navigation.replace('Dashboard', { email });
        }, 2000);

        return () => clearTimeout(timer);
    }, [navigation, email]);

    return (
        <SafeAreaView style={s.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

            <View style={s.content}>
                <View style={s.iconContainer}>
                    <Ionicons name="checkmark" size={52} color={colors.green} />
                </View>

                <Text style={s.title}>¡Dentro!</Text>
                <Text style={s.subtitle}>Preparando tu Centro de Mando…</Text>
            </View>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    iconContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: colors.greenLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 28,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: colors.dark,
        marginBottom: 10,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 16,
        color: colors.grayText,
        textAlign: 'center',
    },
});
