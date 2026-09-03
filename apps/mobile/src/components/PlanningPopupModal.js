// Pop-ups centrados del Bloque 4 · Planificación (OBJETIVO DIARIO OK,
// TE SALTASTE DÍAS, EXAMEN PRÓXIMO). Distinto del NudgeModal genérico
// (bottom-sheet, compartido con Dashboard/Motivación) — Figma confirma un
// patrón propio: overlay a pantalla completa + tarjeta blanca centrada.
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import Svg, { Path } from 'react-native-svg';
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

export function WarningIcon({ size = 90, color = FIGMA.warningOrange }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 185 185" fill="none">
            <Path
                d="M92.4995 175C138.063 175 175 138.063 175 92.5C175 46.9365 138.063 10 92.4995 10C46.936 10 9.99951 46.9365 9.99951 92.5C9.99951 138.063 46.936 175 92.4995 175Z"
                stroke={color}
                strokeWidth={15.32}
                strokeMiterlimit={10}
            />
            <Path d="M75.9995 42L84.2495 115H100.75L109 42H75.9995Z" fill={color} />
            <Path
                d="M106 138.5C106 131.044 99.9554 125 92.4995 125C85.0437 125 78.9995 131.044 78.9995 138.5C78.9995 145.956 85.0437 152 92.4995 152C99.9554 152 106 145.956 106 138.5Z"
                fill={color}
            />
        </Svg>
    );
}

export function CalendarCheckIcon({ size = 65, color = colors.accentOrange }) {
    return (
        <Svg width={(size * 133) / 141} height={size} viewBox="0 0 133 141" fill="none">
            <Path d="M100.365 11.2324H31.7461V15.5576H100.365V11.2324Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M132.21 43.4796H0.209961V11.2324H20.3211V15.5394H4.53514V39.1727H127.885V15.5394H110.73V11.2324H132.21V43.4796Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M26.9825 55.7969H19.7739V60.1221H26.9825V55.7969Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M41.2723 55.7969H34.0637V60.1221H41.2723V55.7969Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M55.5431 55.7969H48.3345V60.1221H55.5431V55.7969Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M69.8141 55.7969H62.6055V60.1221H69.8141V55.7969Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M84.0861 55.7969H76.8774V60.1221H84.0861V55.7969Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M98.3571 55.7969H91.1484V60.1221H98.3571V55.7969Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M112.629 55.7969H105.42V60.1221H112.629V55.7969Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M26.9825 69.541H19.7739V73.8662H26.9825V69.541Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M41.2723 69.541H34.0637V73.8662H41.2723V69.541Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M55.5431 69.541H48.3345V73.8662H55.5431V69.541Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M69.8141 69.541H62.6055V73.8662H69.8141V69.541Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M84.0861 69.541H76.8774V73.8662H84.0861V69.541Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M98.3571 69.541H91.1484V73.8662H98.3571V69.541Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M112.629 69.541H105.42V73.8662H112.629V69.541Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M26.9825 83.2852H19.7739V87.6103H26.9825V83.2852Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M41.2723 83.2852H34.0637V87.6103H41.2723V83.2852Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M55.5431 83.2852H48.3345V87.6103H55.5431V83.2852Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M69.8141 83.2852H62.6055V87.6103H69.8141V83.2852Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M26.9825 97.0254H19.7739V101.351H26.9825V97.0254Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M41.2723 97.0254H34.0637V101.351H41.2723V97.0254Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M55.5431 97.0254H48.3345V101.351H55.5431V97.0254Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M129.619 41.4922H125.294V80.218H129.619V41.4922Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M62.4601 122.776H2.82007V41.4922H7.127V118.451H62.4601V122.776Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M113.887 28.9177H101.003V24.5925H109.58V4.53611H101.003V0.210938H113.887V28.9177Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M33.5706 28.9177H20.6863V24.5925H29.2454V4.53611H20.6863V0.210938H33.5706V28.9177Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M81.6041 24.5039H50.7986V28.8291H81.6041V24.5039Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M99.1972 140.61C93.0468 140.678 87.0148 138.917 81.8674 135.55C76.7201 132.183 72.6897 127.362 70.2883 121.7C67.8868 116.037 67.2228 109.789 68.3804 103.748C69.538 97.707 72.4651 92.1466 76.7899 87.773C81.1146 83.3994 86.6418 80.41 92.6692 79.1845C98.6966 77.9591 104.952 78.5529 110.641 80.8905C116.331 83.2281 121.197 87.2041 124.621 92.3133C128.046 97.4225 129.874 103.434 129.875 109.585C129.909 117.764 126.699 125.622 120.948 131.438C115.198 137.253 107.376 140.552 99.1972 140.61ZM99.1972 82.831C93.8944 82.7586 88.6899 84.2649 84.2454 87.1583C79.801 90.0517 76.3175 94.2015 74.2378 99.08C72.1582 103.959 71.5764 109.345 72.5664 114.555C73.5564 119.765 76.0735 124.563 79.7976 128.339C83.5217 132.115 88.2846 134.697 93.4806 135.759C98.6765 136.821 104.071 136.313 108.977 134.3C113.884 132.288 118.081 128.862 121.036 124.458C123.99 120.053 125.567 114.87 125.568 109.567C125.612 102.524 122.86 95.7518 117.916 90.7359C112.972 85.7201 106.24 82.8706 99.1972 82.8127V82.831Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M92.8091 120.495L83.739 111.316L86.8232 108.268L92.8091 114.345L111.351 95.5664L114.435 98.5959L92.8091 120.495Z" fill={color} stroke={color} strokeWidth={0.42} />
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
