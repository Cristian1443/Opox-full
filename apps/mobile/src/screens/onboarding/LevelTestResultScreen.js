import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors } from '../../theme';

function Gauge({ pct = 58 }) {
    const r = 70, cx = 100, cy = 95;
    const rad = (((pct / 100) * 180 - 180) * Math.PI) / 180;
    const x = cx + r * Math.cos(rad);
    const y = cy + r * Math.sin(rad);
    const la = (pct / 100) * 180 > 180 ? 1 : 0;
    return (
        <Svg width={200} height={105}>
            <Path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                fill="none" stroke={colors.grayMid} strokeWidth={14} strokeLinecap="round" />
            <Path d={`M ${cx - r} ${cy} A ${r} ${r} 0 ${la} 1 ${x} ${y}`}
                fill="none" stroke={colors.primary} strokeWidth={14} strokeLinecap="round" />
            <Circle cx={x} cy={y} r={9} fill={colors.primary} />
        </Svg>
    );
}

export default function LevelTestResultScreen({ navigation }) {
    const score = 58;
    const strengths = ['Constitución', 'Org. del Estado'];
    const toImprove = ['Ley 39/2015', 'Procedimiento'];

    return (
        <SafeAreaView style={s.container}>
            <View style={s.gaugeWrapper}>
                <Gauge pct={score} />
                <View style={s.gaugeCenter}>
                    <Text style={s.percent}>{score}%</Text>
                    <Text style={s.percentLabel}>Nivel inicial</Text>
                </View>
            </View>

            <Text style={s.levelText}>
                Nivel <Text style={s.bold}>Intermedio</Text>. Buen punto de partida.
            </Text>

            <Text style={s.sectionTitle}>PUNTOS FUERTES</Text>
            <View style={s.tagRow}>
                {strengths.map((t) => (
                    <View key={t} style={[s.tag, s.tagGreen]}>
                        <Text style={s.tagTxtGreen}>{t}</Text>
                    </View>
                ))}
            </View>

            <Text style={s.sectionTitle}>A REFORZAR</Text>
            <View style={s.tagRow}>
                {toImprove.map((t) => (
                    <View key={t} style={[s.tag, s.tagRed]}>
                        <Text style={s.tagTxtRed}>{t}</Text>
                    </View>
                ))}
            </View>

            <TouchableOpacity style={s.ctaBtn} onPress={() => navigation.navigate('Permissions')}>
                <Text style={s.ctaTxt}>Crear mi plan de estudio</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.white, paddingHorizontal: 28, paddingTop: 32 },
    gaugeWrapper: { alignItems: 'center', marginBottom: 8 },
    gaugeCenter: { position: 'absolute', bottom: 0, alignItems: 'center' },
    percent: { fontSize: 30, fontWeight: '900', color: colors.dark },
    percentLabel: { fontSize: 12, color: colors.grayText },
    levelText: { fontSize: 16, color: colors.dark, textAlign: 'center', marginBottom: 28, marginTop: 12 },
    bold: { fontWeight: '900' },
    sectionTitle: { fontSize: 11, fontWeight: '800', color: colors.grayText, letterSpacing: 1, marginBottom: 10 },
    tagRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 24 },
    tag: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
    tagGreen: { backgroundColor: colors.greenLight },
    tagTxtGreen: { color: '#16a34a', fontWeight: '700', fontSize: 13 },
    tagRed: { backgroundColor: colors.redSoft },
    tagTxtRed: { color: colors.primary, fontWeight: '700', fontSize: 13 },
    ctaBtn: {
        position: 'absolute', bottom: 32, left: 28, right: 28,
        backgroundColor: colors.primary, borderRadius: 50,
        paddingVertical: 18, alignItems: 'center',
    },
    ctaTxt: { color: colors.white, fontSize: 17, fontWeight: '700' },
});