import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, spacing } from '../theme';

// ─── Popups del Bloque 5 · Motivación ─────────────────────────────────────────
// Fondo negro de borde a borde + tarjeta modal blanca centrada, mismo patrón
// confirmado vía API REST para los popups de Bloque 0 (no el bottom-sheet de
// NudgeModal, que es un componente distinto compartido con otros bloques).

function IconFlameSolid({ color = colors.accentOrange, size = 48 }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
                d="M12 2c1 3-1 4-1 6a3 3 0 0 0 6 0c0 4-2 6-2 6 3-1 4-4 4-7 2 2 3 5 3 8a9 9 0 1 1-18 0c0-5 4-8 7-12 1 2 0 5 0 5s2-2 0-9c2 0 3 2 3 4z"
                fill={color}
            />
        </Svg>
    );
}

function IconTrophy({ size = 48 }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
                d="M7 4h10v4a5 5 0 0 1-10 0V4z"
                stroke={colors.accentOrange}
                strokeWidth={1.6}
                strokeLinejoin="round"
            />
            <Path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" stroke={colors.accentOrange} strokeWidth={1.6} strokeLinecap="round" />
            <Path d="M12 13v4M9 20h6M9.5 17h5" stroke={colors.accentOrange} strokeWidth={1.6} strokeLinecap="round" />
        </Svg>
    );
}

function IconChallenge({ size = 48 }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path d="M13 2L4 14h7l-1 8 9-12h-7z" stroke={colors.accentOrange} strokeWidth={1.6} strokeLinejoin="round" />
        </Svg>
    );
}

function BaseModal({ visible, icon, title, description, primaryLabel, onPrimaryPress, secondaryLabel, onSecondaryPress }) {
    return (
        <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onSecondaryPress}>
            <View style={styles.backdrop}>
                <View style={styles.card}>
                    <View style={styles.cardIcon}>{icon}</View>
                    <Text style={styles.cardTitle}>{title}</Text>
                    <Text style={styles.cardDesc}>{description}</Text>
                    <TouchableOpacity style={styles.btnAllow} onPress={onPrimaryPress} activeOpacity={0.85}>
                        <Text style={styles.btnAllowText}>{primaryLabel}</Text>
                    </TouchableOpacity>
                    {secondaryLabel ? (
                        <TouchableOpacity style={styles.btnDeny} onPress={onSecondaryPress} activeOpacity={0.7}>
                            <Text style={styles.btnDenyText}>{secondaryLabel}</Text>
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>
        </Modal>
    );
}

// Figma "POP-UP RÉCORD RACHA" (2337:1032)
export function RachaRecordModal({ visible, days, points, onPress }) {
    return (
        <BaseModal
            visible={visible}
            icon={<IconTrophy />}
            title="¡Récord de racha!"
            description={`${days} días seguidos, tu mejor marca. Has ganado ${points} Opopoints.`}
            primaryLabel="¡A por más!"
            onPrimaryPress={onPress}
        />
    );
}

// Figma "POP-UP RACHA EN PELIGRO" (2337:1053)
export function RachaPeligroModal({ visible, hours, days, onPrimaryPress, onSecondaryPress }) {
    return (
        <BaseModal
            visible={visible}
            icon={<IconFlameSolid />}
            title="Tu racha está en peligro"
            description={`Te quedan ${hours} horas para no perder tus ${days} días. Un test rápido la mantiene.`}
            primaryLabel="Hacer test rápido"
            onPrimaryPress={onPrimaryPress}
            secondaryLabel="En otro momento"
            onSecondaryPress={onSecondaryPress}
        />
    );
}

// Figma "POP-UP RETO RECIBIDO" (2337:1067)
export function RetoRecibidoModal({ visible, challengerName, description, onPrimaryPress, onSecondaryPress }) {
    return (
        <BaseModal
            visible={visible}
            icon={<IconChallenge />}
            title={`${challengerName} te ha retado`}
            description={description}
            primaryLabel="Aceptar reto"
            onPrimaryPress={onPrimaryPress}
            secondaryLabel="Ahora no"
            onSecondaryPress={onSecondaryPress}
        />
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: '#000000',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
    },
    card: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: colors.white,
        borderRadius: 28,
        alignItems: 'center',
        paddingVertical: spacing.xl,
        paddingHorizontal: spacing.lg,
    },
    cardIcon: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.textDark,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    cardDesc: {
        fontSize: 14,
        color: colors.textDark,
        marginBottom: spacing.xl,
        textAlign: 'center',
        lineHeight: 20,
    },
    btnAllow: {
        backgroundColor: colors.ctaGreen,
        borderRadius: 999,
        paddingVertical: spacing.md,
        alignItems: 'center',
        alignSelf: 'stretch',
    },
    btnAllowText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
    btnDeny: {
        backgroundColor: 'transparent',
        paddingVertical: spacing.md,
        alignItems: 'center',
        alignSelf: 'stretch',
    },
    btnDenyText: {
        color: colors.textDark,
        fontSize: 14,
        fontWeight: '700',
    },
});
