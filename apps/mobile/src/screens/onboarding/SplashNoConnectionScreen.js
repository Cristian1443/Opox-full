import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, spacing } from '../../theme';

// ─── Icono WiFi tachado (exacto del Figma "SIN CONEXIÓN" 2346:2074) ───────────
// Trazo morado (colors.textDark) — la tarjeta modal es blanca, no la pantalla.
function IconWifiOff() {
    return (
        <Svg width={54} height={54} viewBox="0 0 24 24" fill="none">
            {/* Arcos WiFi */}
            <Path
                d="M2 8.5C5 6 8.3 4.5 12 4.5c3.7 0 7 1.5 10 4M5 12c2-1.6 4.4-2.5 7-2.5s5 .9 7 2.5M8.5 15.5c1-.8 2.2-1.2 3.5-1.2s2.5.4 3.5 1.2"
                stroke={colors.textDark}
                strokeWidth={1.8}
                strokeLinecap="round"
            />
            {/* Línea diagonal de tachado */}
            <Path
                d="M3 3l18 18"
                stroke={colors.textDark}
                strokeWidth={1.8}
                strokeLinecap="round"
            />
            {/* Punto WiFi */}
            <Circle cx={12} cy={19} r={1.3} fill={colors.textDark} />
        </Svg>
    );
}

// ─── Pantalla completa ────────────────────────────────────────────────────────
// Fondo negro (#000000) de borde a borde + tarjeta modal blanca centrada,
// fiel al frame Figma "SIN CONEXIÓN" (node 2346:2074, confirmado vía API REST:
// frame fill=#000000, MODAL vector fill=#ffffff, texto/icono fill=#412950).
export default function SplashNoConnectionScreen({ navigation }) {
    return (
        <View style={styles.backdrop}>
            <View style={styles.card}>

                <IconWifiOff />

                <Text style={styles.title}>Sin conexión</Text>

                <Text style={styles.subtitle}>
                    Necesitas internet para iniciar Opox. Revisa tu red e inténtalo de nuevo.
                </Text>

                <TouchableOpacity
                    style={styles.btn}
                    onPress={() => navigation.replace('Splash')}
                    activeOpacity={0.85}
                >
                    <Text style={styles.btnText}>Reintentar</Text>
                </TouchableOpacity>

            </View>
        </View>
    );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: '#000000',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
    },

    // ── Tarjeta modal blanca (~86.5% del ancho de pantalla en Figma) ─────
    card: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: colors.white,
        borderRadius: 28,
        alignItems: 'center',
        paddingVertical: spacing.xl,
        paddingHorizontal: spacing.lg,
    },

    title: {
        color: colors.textDark,
        fontSize: 22,
        fontWeight: '700',
        marginTop: spacing.lg,
        textAlign: 'center',
    },

    subtitle: {
        color: colors.textDark,
        fontSize: 14,
        marginTop: spacing.sm,
        textAlign: 'center',
        lineHeight: 20,
    },

    // ── Botón Reintentar (pill) ───────────────────
    btn: {
        backgroundColor: colors.ctaGreen,
        borderRadius: 999,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        marginTop: spacing.xl,
        alignSelf: 'stretch',
        alignItems: 'center',
    },
    btnText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
});
