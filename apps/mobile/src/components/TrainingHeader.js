import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors } from '../theme';

// Figma (todas las pantallas de Bloque 6, ej. "GENERADOR INFINITO"): ícono de
// engranaje en un círculo gris claro, arriba a la derecha, en cada pantalla.
function IconGear({ color = colors.textDark }) {
    return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={1.8} />
            <Path
                d="M12 2.5v2M12 19.5v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2.5 12h2M19.5 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
                stroke={color}
                strokeWidth={1.8}
                strokeLinecap="round"
            />
        </Svg>
    );
}

// ─── Cabecera de Bloque 6 · Entrenamiento ────────────────────────────────────
// Mismo contrato que ScreenHeader (title/subtitle/onBack), pero con los
// valores exactos confirmados en Figma ("HUB DE ENTRENAMIENTO 1" 2298:1381):
// título centrado, fontSize 48px/2.25 = 21dp, color #412950 (colors.textDark),
// botón de volver y engranaje en círculos grises claros. No se toca
// ScreenHeader.js porque también lo usa Bloque 4, del que no tenemos datos de
// Figma para confirmar si ese color/tamaño le aplica igual.
// Figma: cuando hay 2 líneas, la de ARRIBA es el "breadcrumb" pequeño (ej.
// "Zona de entrenamiento", "Simulacros", "Simulacro") y la de ABAJO es el
// título grande y en negrita de la pantalla actual (ej. "Generador infinito").
export default function TrainingHeader({ eyebrow, title, onBack, onSettings }) {
    return (
        <View style={styles.header}>
            <TouchableOpacity
                onPress={onBack}
                style={styles.circleBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
                <Text style={styles.back}>‹</Text>
            </TouchableOpacity>

            <View style={styles.titleBlock}>
                {eyebrow ? <Text style={styles.eyebrow} numberOfLines={1}>{eyebrow}</Text> : null}
                <Text style={styles.title} numberOfLines={2}>{title}</Text>
            </View>

            <TouchableOpacity
                onPress={onSettings}
                style={styles.circleBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
                <IconGear />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 6,
        paddingBottom: 8,
    },
    circleBtn: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: `${colors.textDark}1A`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    back: { color: colors.textDark, fontFamily: 'Poppins-SemiBold', fontSize: 18, marginTop: -1 },
    titleBlock: { flex: 1, alignItems: 'center' },
    eyebrow: {
        fontSize: 13,
        fontFamily: 'Poppins-Medium',
        color: colors.textDark,
        textAlign: 'center',
    },
    title: {
        fontSize: 21,
        fontFamily: 'Poppins-SemiBold',
        color: colors.textDark,
        letterSpacing: -0.3,
        textAlign: 'center',
    },
});
