import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, spacing } from '../theme';

// ─── Iconos del banner (trazo blanco, Figma frame "DESTACADO") ───────────────
// Estos 3 íconos son aproximaciones dibujadas a mano (los paths reales de Figma son
// ilustraciones complejas de muchos vectores). Se mantienen a tamaño cuadrado natural
// (~26dp, calibrado con el resto de íconos del banner) en vez de forzar el bounding-box
// exacto de Figma, que distorsionaría estas formas simplificadas.
function IconGem() {
    return (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path d="M6 3h12l3 5-9 13L3 8z" stroke="#fff" strokeWidth={1.6} strokeLinejoin="round" />
            <Path d="M3 8h18M9 3l-2 5 5 13 5-13-2-5" stroke="#fff" strokeWidth={1.3} strokeLinejoin="round" />
        </Svg>
    );
}

function IconGlobal() {
    return (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={12} r={9} stroke="#fff" strokeWidth={1.6} />
            <Path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z" stroke="#fff" strokeWidth={1.3} />
        </Svg>
    );
}

// Figma muestra una medalla con estrella y cintas, no un pin de ubicación.
function IconLocal() {
    return (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path d="M9 15l-2.5 6 3-1 1.5 2.5L13 17M15 15l2.5 6-3-1L13 22.5 11 17" stroke="#fff" strokeWidth={1.3} strokeLinejoin="round" />
            <Circle cx={12} cy={10} r={6.5} stroke="#fff" strokeWidth={1.6} />
            <Path d="M12 6.5l1 2.2 2.4.3-1.7 1.7.4 2.3-2.1-1.1-2.1 1.1.4-2.3-1.7-1.7 2.4-.3z" fill="#fff" />
        </Svg>
    );
}

// ─── Banner "DESTACADO" — comparte estructura con HOME (2332:63) y RANKINGS (2334:213) ──
// Orden confirmado por posición X real en Figma: Opopoints | Ranking Global | Rank local.
export default function DestacadoBanner({ opopoints, globalRank, localRank }) {
    return (
        <View style={styles.banner}>
            <View style={styles.col}>
                <IconGem />
                <Text style={styles.label}>OPOPOINTS</Text>
                <Text style={styles.value}>{opopoints}</Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.col}>
                <IconGlobal />
                <Text style={styles.label}>Ranking Global</Text>
                <Text style={styles.value}>{globalRank}</Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.col}>
                <IconLocal />
                <Text style={styles.label}>Rank local</Text>
                <Text style={styles.value}>{localRank}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    // Figma (2332:63): 348x94dp dentro de una pantalla de 402dp — paddingVertical calibrado
    // para que la tarjeta alcance esa altura con el contenido real (ícono+etiqueta+valor).
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bannerPurple,
        borderRadius: 16,
        paddingVertical: 11,
        paddingHorizontal: spacing.sm,
        marginBottom: spacing.md,
    },
    col: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    // Figma (2332:104 "560", 2332:101/102/103): value=21dp, label=13dp exactos (1dp = 2.25px)
    value: {
        fontSize: 21,
        fontWeight: '700',
        color: colors.white,
    },
    label: {
        fontSize: 13,
        color: colors.white,
        opacity: 0.85,
        textAlign: 'center',
    },
    separator: {
        width: 1,
        alignSelf: 'stretch',
        marginVertical: spacing.xs,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
});
