import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import Text from './AppText';
import { colors, spacing } from '../theme';

// ─── Header estándar de OPOX ────────────────────────────────────────────────
// Única fuente de verdad para la cabecera de las pantallas (QA 2026-10 pidió
// "componentizar" porque cada pantalla tenía su propio icono de volver,
// tamaño de engranaje, tamaño/alineación de título y separación con el
// contenido). Basado en Figma (Entrenamiento, Rankings, Clan):
//   · volver: círculo gris claro 44 + chevron-back 22
//   · título: Poppins-SemiBold 21, centrado respecto a la PANTALLA (los dos
//     laterales miden siempre lo mismo)
//   · derecha: `right` (p.ej. <HeaderSettingsButton/>) o un hueco simétrico
//   · separación header → contenido fija (HEADER_CONTENT_GAP)

export const HEADER_SIDE = 44;
export const HEADER_CONTENT_GAP = spacing.md;
export const HEADER_ICON_SIZE = 22;

const BACK_BG = '#F0F0F2';
const SUBTITLE_COLOR = 'rgba(65, 41, 80, 0.5)';

export function HeaderBackButton({ onPress, color = colors.textDark, dark = false, accessibilityLabel = 'Volver' }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[styles.side, styles.backCircle, dark && styles.backCircleDark]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
        >
            <Ionicons name="chevron-back" size={HEADER_ICON_SIZE} color={dark ? colors.white : color} />
        </TouchableOpacity>
    );
}

// Engranaje de Figma (mismo path que el resto de la app).
export function GearIcon({ size = HEADER_ICON_SIZE, color = colors.textDark }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 54 54" fill="none">
            <Path d="M51.4399 30.8795V23.7995L45.2299 23.2795C44.8079 21.0153 43.9778 18.8467 42.78 16.8795L46.9299 11.8795L41.9899 6.87945L37.2399 10.9495C35.3532 9.6517 33.2453 8.70957 31.02 8.16945L30.4899 1.68945H23.4899L22.97 7.96945C20.7427 8.41611 18.6148 9.26316 16.6899 10.4695L11.7899 6.26945L6.84991 11.2695L10.8499 16.0795C9.56076 17.9964 8.62909 20.1308 8.09991 22.3795L1.68994 22.8795V29.9495L7.89996 30.4695C8.32019 32.7389 9.14679 34.9138 10.34 36.8895L6.19995 41.8895L11.1299 46.8895L15.89 42.8195C17.7719 44.1193 19.8769 45.0616 22.0999 45.5995L22.6899 52.0795H29.6899L30.21 45.7994C32.4541 45.3678 34.5998 44.5272 36.5399 43.3195L41.4399 47.5195L46.3799 42.5195L42.3799 37.7095C43.6691 35.7925 44.6008 33.6581 45.1299 31.4095L51.4399 30.8795Z" stroke={color} strokeWidth={3.38} />
            <Path d="M34.3099 26.8793C34.2902 28.4077 33.819 29.8961 32.9555 31.1574C32.092 32.4186 30.8748 33.3964 29.4571 33.9677C28.0393 34.5389 26.4843 34.6782 24.9876 34.368C23.4909 34.0578 22.1193 33.3119 21.0455 32.2241C19.9716 31.1364 19.2433 29.7554 18.9523 28.2548C18.6613 26.7543 18.8205 25.2012 19.4099 23.7909C19.9993 22.3806 20.9926 21.176 22.2648 20.3288C23.537 19.4815 25.0314 19.0294 26.5599 19.0293C27.5842 19.0358 28.5972 19.2441 29.5411 19.6421C30.4849 20.0402 31.3411 20.6202 32.0608 21.3492C32.7804 22.0781 33.3494 22.9417 33.7353 23.8905C34.1212 24.8394 34.3165 25.855 34.3099 26.8793Z" stroke={color} strokeWidth={3.38} />
        </Svg>
    );
}

export function HeaderSettingsButton({ onPress, color = colors.textDark, accessibilityLabel = 'Ajustes' }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={styles.side}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
        >
            <GearIcon color={color} />
        </TouchableOpacity>
    );
}

/**
 * Props:
 *  - title, subtitle?, eyebrow? (línea superior más pequeña, p.ej. sección)
 *  - onBack? — si falta, no se muestra botón (queda el hueco simétrico)
 *  - backLabel? — etiqueta de accesibilidad del botón (por defecto "Volver")
 *  - right? — nodo de HEADER_SIDE de ancho máx. (usa HeaderSettingsButton)
 *  - variant: 'light' | 'dark' (pantallas con fondo oscuro)
 *  - style? — override del contenedor (p.ej. paddingBottom: 0)
 */
export default function AppHeader({ title, subtitle, eyebrow, onBack, backLabel, right, variant = 'light', style }) {
    const dark = variant === 'dark';
    const titleColor = dark ? colors.white : colors.textDark;
    return (
        <View style={[styles.header, style]}>
            {onBack
                ? <HeaderBackButton onPress={onBack} dark={dark} accessibilityLabel={backLabel} />
                : <View style={styles.side} />}

            <View style={styles.titleBlock}>
                {eyebrow ? (
                    <Text style={[styles.eyebrow, { color: titleColor }]} numberOfLines={1}>{eyebrow}</Text>
                ) : null}
                <Text style={[styles.title, { color: titleColor }]} numberOfLines={2}>{title}</Text>
                {subtitle ? (
                    <Text style={[styles.subtitle, dark && { color: 'rgba(255,255,255,0.7)' }]} numberOfLines={2}>
                        {subtitle}
                    </Text>
                ) : null}
            </View>

            {right ? <View style={styles.side}>{right}</View> : <View style={styles.side} />}
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: HEADER_CONTENT_GAP,
        gap: spacing.sm,
    },
    side: {
        width: HEADER_SIDE,
        height: HEADER_SIDE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backCircle: {
        borderRadius: HEADER_SIDE / 2,
        backgroundColor: BACK_BG,
    },
    backCircleDark: {
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    titleBlock: {
        flex: 1,
        alignItems: 'center',
    },
    eyebrow: {
        fontFamily: 'Poppins-Light',
        fontSize: 14,
        textAlign: 'center',
    },
    title: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 21,
        textAlign: 'center',
    },
    subtitle: {
        fontFamily: 'Poppins-Regular',
        fontSize: 12,
        color: SUBTITLE_COLOR,
        textAlign: 'center',
        marginTop: 2,
    },
});
