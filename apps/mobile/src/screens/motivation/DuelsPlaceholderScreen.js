import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';

/**
 * Duelos en vivo 1vs1 (5.8b) — Fase 2 explícita en el wireframe ("lo más
 * caro de construir"): necesita matchmaking y sincronización en tiempo real
 * entre dos usuarios, infraestructura que no existe todavía (el chat de
 * clan usa polling, no websockets). Placeholder puramente visual.
 */
export default function DuelsPlaceholderScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.rival}>
                <View style={styles.avatarSmall}><Text style={styles.avatarSmallText}>AG</Text></View>
                <Text style={styles.rivalName}>Ana_G</Text>
                <Text style={styles.rivalScore}>3/5</Text>
            </View>

            <View style={styles.center}>
                <Text style={styles.label}>DUELO EN VIVO · PRÓXIMAMENTE</Text>
                <View style={styles.questionNumber}><Text style={styles.questionNumberText}>?</Text></View>
                <Text style={styles.question}>Los duelos 1 vs 1 en tiempo real llegarán en una fase posterior.</Text>
                <View style={styles.options}>
                    {['Opción A', 'Opción B', 'Opción C', 'Opción D'].map((o) => (
                        <View key={o} style={styles.option}><Text style={styles.optionText}>{o}</Text></View>
                    ))}
                </View>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtnText}>Volver</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.me}>
                <View style={[styles.avatarSmall, { backgroundColor: '#1B2A4A' }]}><Text style={styles.avatarSmallText}>JL</Text></View>
                <Text style={styles.meName}>Tú</Text>
                <Text style={styles.meScore}>4/5</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    rival: { backgroundColor: '#1B2A4A', padding: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
    avatarSmall: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#7B4BC4', alignItems: 'center', justifyContent: 'center' },
    avatarSmallText: { color: '#fff', fontSize: 9, fontWeight: '700' },
    rivalName: { color: '#fff', fontSize: 11, fontWeight: '700' },
    rivalScore: { color: '#FF8A5A', fontSize: 11, fontWeight: '800' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F6FA', padding: 24 },
    label: { fontSize: 9, fontWeight: '700', color: '#8A92A0' },
    questionNumber: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#FF6B4A', alignItems: 'center', justifyContent: 'center', marginVertical: 10 },
    questionNumberText: { color: '#fff', fontSize: 22, fontWeight: '800' },
    question: { fontSize: 13, fontWeight: '600', textAlign: 'center', color: '#1B2A4A', marginBottom: 16 },
    options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
    option: { width: '45%', backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E4E8F0', borderRadius: 9, padding: 10, alignItems: 'center' },
    optionText: { fontSize: 11, color: '#5A6373' },
    backBtn: { marginTop: 20, paddingVertical: 10, paddingHorizontal: 20 },
    backBtnText: { color: '#FF6B4A', fontWeight: '700', fontSize: 13 },
    me: { backgroundColor: '#FF6B4A', padding: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
    meName: { color: '#fff', fontSize: 11, fontWeight: '700' },
    meScore: { color: '#fff', fontSize: 11, fontWeight: '800' },
});
