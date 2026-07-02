import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

export default function SplashUpdateScreen() {
    return (
        <View style={s.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.dark} />

            <View style={s.modal}>
                <View style={s.iconBox}>
                    <Ionicons name="download-outline" size={36} color={colors.dark} />
                </View>
                <Text style={s.title}>Nueva versión disponible</Text>
                <Text style={s.desc}>
                    Actualiza Opox para seguir con el temario y el BOE al día.
                </Text>
                {/* Sin botón cerrar — actualización obligatoria */}
                <TouchableOpacity style={s.btn} onPress={() => Linking.openURL('https://opox.app')}>
                    <Text style={s.btnText}>Actualizar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1, backgroundColor: colors.dark,
        alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 24,
    },
    modal: {
        backgroundColor: colors.white, borderRadius: 20,
        padding: 28, alignItems: 'center', width: '100%',
    },
    iconBox: {
        width: 64, height: 64, backgroundColor: colors.grayLight,
        borderRadius: 18, alignItems: 'center', justifyContent: 'center',
        marginBottom: 18,
    },
    title: {
        fontSize: 18, fontWeight: '900', color: colors.dark,
        textAlign: 'center', marginBottom: 10,
    },
    desc: {
        fontSize: 14, color: colors.grayText,
        textAlign: 'center', lineHeight: 21, marginBottom: 24,
    },
    btn: {
        width: '100%', backgroundColor: colors.primary,
        borderRadius: 50, paddingVertical: 15, alignItems: 'center',
    },
    btnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});