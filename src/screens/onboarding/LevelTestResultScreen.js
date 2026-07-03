import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    ScrollView,
} from 'react-native';
import Svg, { Path, Text as SvgText } from 'react-native-svg';

// ─── Gauge semicircular ──────────────────────────────────────────────────────
// SVG exacto del wireframe: viewBox="0 0 150 90", radio 60, track #EEF1F7,
// fill naranja hasta el punto (110,33) que representa ~58% del arco
function ScoreGauge({ percent = 58, label = 'Nivel inicial' }) {
    return (
        <Svg width={150} height={90} viewBox="0 0 150 90">
            {/* Track gris */}
            <Path
                d="M15 85 A60 60 0 0 1 135 85"
                fill="none"
                stroke="#EEF1F7"
                strokeWidth={13}
                strokeLinecap="round"
            />
            {/* Fill naranja (58% → punto final 110,33) */}
            <Path
                d="M15 85 A60 60 0 0 1 110 33"
                fill="none"
                stroke="#FF6B4A"
                strokeWidth={13}
                strokeLinecap="round"
            />
            {/* Porcentaje */}
            <SvgText
                x="75"
                y="70"
                textAnchor="middle"
                fontSize={26}
                fontWeight="800"
                fill="#0F1B33"
            >
                {percent}%
            </SvgText>
            {/* Sublabel */}
            <SvgText
                x="75"
                y="84"
                textAnchor="middle"
                fontSize={9}
                fill="#8A92A0"
            >
                {label}
            </SvgText>
        </Svg>
    );
}

// ─── Chip de punto fuerte (verde) ────────────────────────────────────────────
function ChipStrength({ label }) {
    return (
        <View style={styles.chipStrength}>
            <Text style={styles.chipStrengthText}>{label}</Text>
        </View>
    );
}

// ─── Chip a reforzar (rojo) ──────────────────────────────────────────────────
function ChipWeakness({ label }) {
    return (
        <View style={styles.chipWeakness}>
            <Text style={styles.chipWeaknessText}>{label}</Text>
        </View>
    );
}

// ─── Pantalla principal ──────────────────────────────────────────────────────
export default function LevelTestResultScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Status bar */}
            <View style={styles.statusBar}>
                <Text style={styles.statusBarTime}>9:41</Text>
            </View>

            {/* Cuerpo scrollable (scr-scroll) */}
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.body}
                showsVerticalScrollIndicator={false}
            >
                {/* Gauge semicircular */}
                <View style={styles.gaugeWrap}>
                    <ScoreGauge percent={58} label="Nivel inicial" />
                </View>

                {/* Nivel + descripción */}
                <Text style={styles.levelLine}>
                    Nivel <Text style={styles.levelBold}>Intermedio</Text>. Buen punto de partida.
                </Text>

                {/* ── Puntos fuertes ── */}
                <Text style={styles.sectionLabel}>PUNTOS FUERTES</Text>
                <View style={styles.chipsRow}>
                    <ChipStrength label="Constitución" />
                    <ChipStrength label="Org. del Estado" />
                </View>

                {/* ── A reforzar ── */}
                <Text style={[styles.sectionLabel, styles.sectionLabelWeak]}>A REFORZAR</Text>
                <View style={styles.chipsRow}>
                    <ChipWeakness label="Ley 39/2015" />
                    <ChipWeakness label="Procedimiento" />
                </View>

                {/* CTA */}
                <TouchableOpacity
                    style={styles.btnPrimary}
                    onPress={() => navigation.navigate('Permissions')}
                    activeOpacity={0.85}
                >
                    <Text style={styles.btnPrimaryText}>Crear mi plan de estudio</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },

    // Status bar
    statusBar: {
        height: 30,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        flexShrink: 0,
    },
    statusBarTime: {
        fontSize: 10,
        fontWeight: '700',
        color: '#1B2A4A',
    },

    // ScrollView (scr-scroll + body-area pad)
    scroll: {
        flex: 1,
    },
    body: {
        paddingHorizontal: 18,
        paddingVertical: 16,
    },

    // ── Gauge ────────────────────────────────────
    // gauge-wrap: text-align:center; padding: 8px 0
    gaugeWrap: {
        alignItems: 'center',
        paddingVertical: 8,
    },

    // ── Nivel line ───────────────────────────────
    // h-sub + text-align:center
    levelLine: {
        fontSize: 12.5,
        color: '#5A6373',
        textAlign: 'center',
        marginTop: 6,
    },
    levelBold: {
        fontWeight: '700',
        color: '#1B2A4A',
    },

    // ── Section labels ───────────────────────────
    // margin-top:16px, font-size:11px, font-weight:700, color:#5A6373
    sectionLabel: {
        marginTop: 16,
        fontSize: 11,
        fontWeight: '700',
        color: '#5A6373',
    },
    // margin-top:12px para "A REFORZAR"
    sectionLabelWeak: {
        marginTop: 12,
    },

    // ── Chips row ────────────────────────────────
    // display:flex; gap:6px; flex-wrap:wrap; margin-top:6px
    chipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 6,
    },

    // Chip verde (puntos fuertes)
    // bg:#E3F6EE, color:#2BB673, borderRadius:10, padding:4px 9px, 10px, 700
    chipStrength: {
        backgroundColor: '#E3F6EE',
        borderRadius: 10,
        paddingVertical: 4,
        paddingHorizontal: 9,
    },
    chipStrengthText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#2BB673',
    },

    // Chip rojo (a reforzar)
    // bg:#FDEBE9, color:#E2483D, borderRadius:10, padding:4px 9px, 10px, 700
    chipWeakness: {
        backgroundColor: '#FDEBE9',
        borderRadius: 10,
        paddingVertical: 4,
        paddingHorizontal: 9,
    },
    chipWeaknessText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#E2483D',
    },

    // ── Botón CTA ────────────────────────────────
    // btn + margin-top:18px
    btnPrimary: {
        backgroundColor: '#FF6B4A',
        borderRadius: 12,
        paddingVertical: 13,
        alignItems: 'center',
        marginTop: 18,
    },
    btnPrimaryText: {
        color: '#FFFFFF',
        fontSize: 13.5,
        fontWeight: '700',
    },
});
