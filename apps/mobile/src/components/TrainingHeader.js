import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme';

// Icono de engranaje exacto exportado de Figma (mismo path usado en el resto
// de pantallas de Bloque 6 — antes era un engranaje genérico dibujado a mano).
function IconGear({ size = 22, color = colors.textDark }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 54 54" fill="none">
            <Path d="M51.4399 30.8795V23.7995L45.2299 23.2795C44.8079 21.0153 43.9778 18.8467 42.78 16.8795L46.9299 11.8795L41.9899 6.87945L37.2399 10.9495C35.3532 9.6517 33.2453 8.70957 31.02 8.16945L30.4899 1.68945H23.4899L22.97 7.96945C20.7427 8.41611 18.6148 9.26316 16.6899 10.4695L11.7899 6.26945L6.84991 11.2695L10.8499 16.0795C9.56076 17.9964 8.62909 20.1308 8.09991 22.3795L1.68994 22.8795V29.9495L7.89996 30.4695C8.32019 32.7389 9.14679 34.9138 10.34 36.8895L6.19995 41.8895L11.1299 46.8895L15.89 42.8195C17.7719 44.1193 19.8769 45.0616 22.0999 45.5995L22.6899 52.0795H29.6899L30.21 45.7994C32.4541 45.3678 34.5998 44.5272 36.5399 43.3195L41.4399 47.5195L46.3799 42.5195L42.3799 37.7095C43.6691 35.7925 44.6008 33.6581 45.1299 31.4095L51.4399 30.8795Z" stroke={color} strokeWidth={3.38} />
            <Path d="M34.3099 26.8793C34.2902 28.4077 33.819 29.8961 32.9555 31.1574C32.092 32.4186 30.8748 33.3964 29.4571 33.9677C28.0393 34.5389 26.4843 34.6782 24.9876 34.368C23.4909 34.0578 22.1193 33.3119 21.0455 32.2241C19.9716 31.1364 19.2433 29.7554 18.9523 28.2548C18.6613 26.7543 18.8205 25.2012 19.4099 23.7909C19.9993 22.3806 20.9926 21.176 22.2648 20.3288C23.537 19.4815 25.0314 19.0294 26.5599 19.0293C27.5842 19.0358 28.5972 19.2441 29.5411 19.6421C30.4849 20.0402 31.3411 20.6202 32.0608 21.3492C32.7804 22.0781 33.3494 22.9417 33.7353 23.8905C34.1212 24.8394 34.3165 25.855 34.3099 26.8793Z" stroke={color} strokeWidth={3.38} />
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
                <Feather name="chevron-left" size={22} color={colors.textDark} />
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
                style={styles.settingsBtn}
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
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(65,41,80,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingsBtn: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
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
