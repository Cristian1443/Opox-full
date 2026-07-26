import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors } from '../theme';

// ─── Placeholder de foto de perfil ────────────────────────────────────────────
// Figma ("Foto perfil", p.ej. node 2334:378 en RANKINGS): círculo blanco con
// silueta genérica de persona en color morado — no iniciales de texto. Se usa
// para personas (ranking, miembros de clan, chat); los CLANES sí muestran
// iniciales de texto sobre fondo de color, eso es intencional y distinto.
export default function AvatarPlaceholder({ size = 32 }) {
    return (
        <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
            <Svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
                <Circle cx={12} cy={8} r={4} fill={colors.bannerPurple} />
                <Path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" fill={colors.bannerPurple} />
            </Svg>
        </View>
    );
}

const styles = StyleSheet.create({
    circle: {
        backgroundColor: colors.white,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
