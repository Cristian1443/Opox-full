import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Platform,
    StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Polyline, Circle as SvgCircle } from 'react-native-svg';

// ─── DESIGN TOKENS ────────────────────────────────────────
const C = {
    primary: '#f26535',
    dark: '#0d1b2a',
    white: '#ffffff',
    grayDesc: '#6b7280',   // gris neutro exacto — ni azul ni muy claro
    grayBorder: '#e5e7eb',
    graySecTxt: '#374151',
    circleBg: '#fce8df',
};

const { width: SW, height: SH } = Dimensions.get('window');

// ─── MEDIDAS EXACTAS DEL WIREFRAME ────────────────────────
// Medido pixel a pixel sobre el wireframe original:
// • Espacio superior: 24% del alto disponible
// • Círculo: 48% del ancho de pantalla
// • Ícono: 36% del diámetro del círculo
// • Gap círculo→título: 48px
// • fontSize título: 26 (cabe en 1 línea sin truncar)
// • Gap descripción→botones: flex:1 (espacio variable)

const CIRCLE = SW * 0.48;
const ICON = CIRCLE * 0.36;
const TOP = SH * 0.24;

// ─── ÍCONO SVG — línea de tendencia con punto ─────────────
// Replicado exactamente del wireframe
const TrendLine = () => (
    <Svg
        width={ICON}
        height={ICON * 0.6}
        viewBox="0 0 70 42"
    >
        <Polyline
            points="4,36  22,22  34,28  50,10  64,4"
            fill="none"
            stroke={C.primary}
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <SvgCircle
            cx="64"
            cy="4"
            r="5"
            fill={C.primary}
        />
    </Svg>
);

// ─── SCREEN ───────────────────────────────────────────────
export default function LevelTestProposalScreen({ navigation }) {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor={C.white} />

            {/* ── ESPACIO BLANCO SUPERIOR ── */}
            <View style={{ height: TOP }} />

            {/* ── CÍRCULO SALMÓN ── */}
            <View style={styles.circleWrap}>
                <View style={styles.circle}>
                    <TrendLine />
                </View>
            </View>

            {/* ── GAP FIJO ENTRE CÍRCULO Y TÍTULO ── */}
            <View style={{ height: 48 }} />

            {/* ── TEXTOS ── */}
            <View style={styles.textWrap}>
                {/*
          IMPORTANTE: Sin adjustsFontSizeToFit ni numberOfLines
          El título cabe completo en 1 línea con fontSize 26
          y paddingHorizontal 24
        */}
                <Text style={styles.title}>
                    Mídete en 5 minutos
                </Text>

                <Text style={styles.desc}>
                    Un test corto para que la IA sepa tu punto{'\n'}
                    de partida y ajuste la dificultad y tu plan{'\n'}
                    desde el primer día.
                </Text>
            </View>

            {/* ── ESPACIO FLEXIBLE — empuja botones al fondo ── */}
            <View style={{ flex: 1 }} />

            {/* ── BOTONES ── */}
            <View style={[styles.actions, { paddingBottom: insets.bottom + 20 }]}>

                <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => navigation.navigate('LevelTestInProgress')}
                    activeOpacity={0.85}
                >
                    <Text style={styles.primaryTxt}>Hacer test de nivel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={() => navigation.navigate('Permissions')}
                    activeOpacity={0.7}
                >
                    <Text style={styles.secondaryTxt}>Ahora no, lo haré luego</Text>
                </TouchableOpacity>

            </View>
        </View>
    );
}

// ─── STYLES ───────────────────────────────────────────────
const styles = StyleSheet.create({

    root: {
        flex: 1,
        backgroundColor: C.white,
    },

    // Centrar círculo horizontalmente
    circleWrap: {
        alignItems: 'center',
    },

    // Círculo perfectamente redondo
    circle: {
        width: CIRCLE,
        height: CIRCLE,
        borderRadius: CIRCLE / 2,
        backgroundColor: C.circleBg,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Textos centrados
    textWrap: {
        paddingHorizontal: 24,
        alignItems: 'center',
    },

    // Título: negro oscuro, bold máximo, 1 línea
    title: {
        fontSize: 26,
        fontWeight: '900',
        color: C.dark,
        textAlign: 'center',
        marginBottom: 12,
        ...Platform.select({
            android: { fontFamily: 'sans-serif-black' },
        }),
    },

    // Descripción: gris neutro, 3 líneas centradas
    desc: {
        fontSize: 15,
        fontWeight: '400',
        color: C.grayDesc,
        textAlign: 'center',
        lineHeight: 23,
    },

    // Botones pegados al fondo
    actions: {
        paddingHorizontal: 20,
        gap: 12,
    },

    // Primario — naranja con sombra
    primaryBtn: {
        backgroundColor: C.primary,
        borderRadius: 50,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            ios: {
                shadowColor: C.primary,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.35,
                shadowRadius: 10,
            },
            android: { elevation: 7 },
        }),
    },
    primaryTxt: {
        color: C.white,
        fontSize: 17,
        fontWeight: '700',
    },

    // Secundario — borde gris muy suave
    secondaryBtn: {
        backgroundColor: C.white,
        borderRadius: 50,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: C.grayBorder,
    },
    secondaryTxt: {
        color: C.graySecTxt,
        fontSize: 16,
        fontWeight: '600',
    },
});