// Pop-ups centrados del Bloque 4 · Planificación (OBJETIVO DIARIO OK,
// TE SALTASTE DÍAS, EXAMEN PRÓXIMO). Distinto del NudgeModal genérico
// (bottom-sheet, compartido con Dashboard/Motivación) — Figma confirma un
// patrón propio: overlay a pantalla completa + tarjeta blanca centrada.
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { colors } from '../theme';

// Colores confirmados contra Figma (frames POP-UP *, Bloque 4) sin
// equivalente exacto en theme.js.
const FIGMA = {
    // Los 3 frames usan un estilo de biblioteca de teclado/emoji reutilizado
    // por error para el fondo — visualmente resulta negro 100% opaco. Se
    // documenta tal cual está en Figma.
    overlay: '#000000',
    cardBorder: 'rgba(65,41,80,0.3)',
    warningOrange: '#F77D27', // tercer naranja distinto detectado en el sistema — a revisar con diseño
};

export function CheckBadgeIcon({ width = 107, height = 70, color = colors.ctaGreen }) {
    return (
        <Svg width={width} height={height} viewBox="0 0 107 70">
            <Path d="M4 36L38 66L103 4" stroke={color} strokeWidth={16} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

export function WarningIcon({ size = 82, color = FIGMA.warningOrange }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 82 82">
            <Circle cx={41} cy={41} r={33.5} stroke={color} strokeWidth={7.5} fill="none" />
            <Rect x={35} y={22} width={12} height={26} rx={4} fill={color} />
            <Circle cx={41} cy={57} r={6} fill={color} />
        </Svg>
    );
}

export function CalendarCheckIcon({ size = 59, color = colors.accentOrange }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 59 59">
            <Rect x={4} y={9} width={44} height={38} rx={5} stroke={color} strokeWidth={3} fill="none" />
            <Path d="M4 20H48" stroke={color} strokeWidth={3} />
            <Path d="M15 4V13" stroke={color} strokeWidth={3} strokeLinecap="round" />
            <Path d="M37 4V13" stroke={color} strokeWidth={3} strokeLinecap="round" />
            <Circle cx={44} cy={44} r={13} fill={colors.white} stroke={color} strokeWidth={3} />
            <Path d="M38.5 44L42.5 48L49.5 40" stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

export default function PlanningPopupModal({
    visible,
    icon,
    title,
    description,
    primaryLabel,
    onPrimaryPress,
    secondaryLabel,
    onSecondaryPress,
}) {
    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onSecondaryPress ?? onPrimaryPress}>
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <View style={styles.iconWrap}>{icon}</View>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.subtitle}>{description}</Text>
                    <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={onPrimaryPress}>
                        <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
                    </TouchableOpacity>
                    {secondaryLabel ? (
                        <TouchableOpacity activeOpacity={0.6} onPress={onSecondaryPress}>
                            <Text style={styles.secondaryLink}>{secondaryLabel}</Text>
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: FIGMA.overlay,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 27,
    },
    card: {
        width: 348,
        backgroundColor: colors.white,
        borderRadius: 24,
        borderWidth: 0.32,
        borderColor: FIGMA.cardBorder,
        alignItems: 'center',
        paddingVertical: 32,
        paddingHorizontal: 28,
    },
    iconWrap: {
        marginBottom: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 21.3,
        color: colors.textDark,
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontFamily: 'Poppins-Light',
        fontSize: 13.8,
        color: colors.textDark,
        textAlign: 'center',
        lineHeight: 16.6,
        marginBottom: 24,
    },
    primaryButton: {
        width: 322,
        height: 61,
        borderRadius: 14.2,
        backgroundColor: colors.ctaGreen,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButtonText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: colors.white,
    },
    secondaryLink: {
        fontFamily: 'Poppins-Medium',
        fontSize: 13.8,
        color: colors.textDark,
        marginTop: 16,
        textAlign: 'center',
    },
});
