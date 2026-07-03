import React from 'react';
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

/**
 * Placeholder mientras no exista el Bloque 2.
 * Se muestra al final del flujo natural para no dejar la app en un warning
 * de "navigate to undefined route".
 */
export default function DashboardPlaceholderScreen({ navigation, route }) {
    const email = route?.params?.email;

    return (
        <SafeAreaView style={s.container}>
            <View style={s.content}>
                <View style={s.iconBox}>
                    <Ionicons name="construct" size={44} color={colors.primary} />
                </View>
                <Text style={s.title}>Bloque 2 · Dashboard</Text>
                <Text style={s.subtitle}>
                    Aquí irá el Centro de Mando. Todavía no está implementado.
                </Text>
                {email && <Text style={s.email}>Sesión de: {email}</Text>}

                <TouchableOpacity
                    style={s.button}
                    onPress={() => navigation.reset({ index: 0, routes: [{ name: 'DevMenu' }] })}
                    activeOpacity={0.8}
                >
                    <Text style={s.buttonText}>Volver al Dev Menu</Text>
                </TouchableOpacity>
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
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconBox: {
        width: 96,
        height: 96,
        borderRadius: 28,
        backgroundColor: colors.grayLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: colors.dark,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        color: colors.grayText,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 12,
    },
    email: {
        fontSize: 13,
        color: colors.grayText,
        fontStyle: 'italic',
        marginBottom: 32,
    },
    button: {
        backgroundColor: colors.primary,
        paddingVertical: 14,
        paddingHorizontal: 28,
        borderRadius: 50,
    },
    buttonText: {
        color: colors.white,
        fontSize: 15,
        fontWeight: '700',
    },
});
