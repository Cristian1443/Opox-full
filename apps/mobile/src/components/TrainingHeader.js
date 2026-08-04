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
// valores exactos confirmados en Figma: título centrado, color #412950
// (colors.textDark), botón de volver y engranaje en círculos grises claros.
// No se toca ScreenHeader.js porque también lo usa Bloque 4, del que no
// tenemos datos de Figma para confirmar si ese color/tamaño le aplica igual.
//
// Figma: "eyebrow" y "title" son SIEMPRE el mismo tamaño (48px), solo cambia
// el peso — confirmado en "GENERADOR INFINITO" (2298:1536), "FOTO-TEST"
// (2298:1836), "SIMULACROS OFICIALES LISTADO" (2298:1958) y "SIMULACRO"
// (2317:275): la línea de arriba ("Zona de entrenamiento", "Simulacros"…) es
// Poppins SemiBold, la de abajo (título de la pantalla actual) es Poppins
// Light. Cuando NO hay eyebrow (pantalla de un solo título, ej. "HUB DE
// ENTRENAMIENTO 1" 2298:1381, "LABORATORIO DE ERRORES" 2317:365, "TEST
// QUIRÚRGICO" 2318:478) esa única línea vuelve a ser Poppins SemiBold.
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
                <Text
                    style={[styles.title, eyebrow && styles.titleWithEyebrow]}
                    numberOfLines={2}
                >
                    {title}
                </Text>
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
        fontSize: 20,
        fontFamily: 'Poppins-SemiBold',
        color: colors.textDark,
        textAlign: 'center',
    },
    title: {
        fontSize: 20,
        fontFamily: 'Poppins-SemiBold',
        color: colors.textDark,
        letterSpacing: -0.3,
        textAlign: 'center',
    },
    titleWithEyebrow: {
        fontFamily: 'Poppins-Light',
    },
});
