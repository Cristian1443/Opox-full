import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing } from '../theme';

// ─── Popups del Bloque 5 · Motivación ─────────────────────────────────────────
// Fondo negro de borde a borde + tarjeta modal blanca centrada, mismo patrón
// confirmado vía API REST para los popups de Bloque 0 (no el bottom-sheet de
// NudgeModal, que es un componente distinto compartido con otros bloques).

// Icono de llama exacto exportado de Figma — mismo path para "récord" (naranja)
// y "en peligro" (gris), solo cambia el color.
function IconFlame({ color = colors.accentOrange, size = 48 }) {
    return (
        <Svg width={(size * 149) / 203} height={size} viewBox="0 0 149 203" fill="none">
            <Path d="M148.307 129.206C146.315 114.734 137.692 103.435 129.786 91.5041C129.213 92.6349 128.819 93.4469 128.396 94.239C125.536 99.5545 123.046 105.114 119.748 110.136C113.237 120.144 103.712 124.797 91.6316 124.583C91.5976 124.33 91.5976 124.073 91.6316 123.82C92.0949 122.854 92.5781 121.893 93.0563 120.931C98.8449 109.349 102.96 97.2629 103.597 84.2208C104.365 68.6629 100.315 54.2607 92.9019 40.6756C84.3335 24.9732 72.2033 12.23 59.4155 -0.000121637C59.3557 -0.0549205 59.1415 0.0496955 58.9173 0.094531C59.007 0.831825 59.1266 1.56414 59.1863 2.30143C59.9485 11.4479 61.1441 20.5893 61.3434 29.7507C61.6273 42.748 57.9011 54.6194 48.989 64.4384C44.8194 69.0365 40.3857 73.4055 36.0866 77.889C27.7474 86.5772 22.0235 96.6452 19.8067 108.601C19.2139 111.8 18.8353 115.033 18.362 118.251L17.6945 118.445L9.1859 97.0238C4.98142 107.191 1.78323 117.205 0.587642 127.831C-2.53417 155.622 6.80303 178.222 28.5992 195.632C31.9818 198.332 35.7977 200.489 39.5588 203L43.9177 194.695C10.2221 175.959 6.24675 142.517 10.8647 124.717C15.0692 133.017 21.8243 138.551 28.6341 144.868C28.5494 143.299 28.4896 142.328 28.4498 141.381C28.1858 134.93 27.6179 128.473 27.7275 122.027C27.9566 108.048 32.2109 95.5144 42.0795 85.247C45.8622 81.3115 49.6582 77.3925 53.4674 73.4902C62.5888 64.1295 68.4123 53.1149 69.9516 40.0479C70.5095 35.4049 70.7487 30.7221 71.187 25.3917C74.5546 30.0247 77.8275 34.1496 80.687 38.5384C88.7273 50.8881 94.0028 64.1943 94.2918 79.1793C94.5209 91.3745 91.3476 102.758 86.1319 113.638C83.1429 119.885 79.9298 126.037 76.7565 132.349C99.7466 137.102 118.652 132.23 130.717 110.474C137.617 119.696 140.765 132.17 139.296 144.679C136.64 167.286 124.48 183.462 104.923 194.616L109.097 202.522C109.333 202.531 109.569 202.509 109.8 202.457C110.173 202.288 110.537 202.083 110.895 201.884C123.275 194.865 133.208 185.34 140.088 172.836C147.58 159.221 150.444 144.619 148.307 129.206Z" fill={color} />
            <Path d="M109.526 148.634C107.13 152.465 105.087 155.852 102.93 159.165C97.3606 167.724 84.4981 170.872 75.591 165.915C69.0203 162.249 64.8208 156.764 62.9078 149.506C60.3224 139.722 61.4133 129.947 63.1519 120.203C64.1981 114.375 65.4883 108.586 66.7088 102.588C26.5072 130.461 29.3467 176.317 57.1142 201.485L63.6999 195.283C55.5948 186.879 49.2532 177.518 46.8073 165.945C44.3463 154.283 46.1148 143.234 51.754 132.752C51.9433 133.615 52.0418 134.495 52.0479 135.378C52.6308 140.857 52.6756 146.497 53.9608 151.817C58.7581 171.654 79.6759 184.731 101.077 173.443C101.422 173.321 101.777 173.231 102.138 173.174C99.6074 182.779 93.5597 189.345 85.8332 194.799L91.034 202.526C99.9262 196.409 106.631 188.901 110.253 178.848C113.875 168.795 111.618 159.031 109.526 148.634Z" fill={color} />
        </Svg>
    );
}

// Icono de bandera exacto exportado de Figma (Figma llama a este pop-up "RETO
// RECIBIDO" — es una bandera, no un rayo).
function IconChallenge({ size = 48 }) {
    return (
        <Svg width={(size * 112) / 125} height={size} viewBox="0 0 112 125" fill="none">
            <Path d="M91.63 45.1L110 26.74C110.483 26.2528 110.811 25.6337 110.943 24.9606C111.076 24.2874 111.006 23.5902 110.743 22.9565C110.48 22.3229 110.036 21.781 109.466 21.3991C108.896 21.0172 108.226 20.8122 107.54 20.81H55.54V10.41C55.5401 9.94836 55.4481 9.49135 55.2693 9.06572C55.0906 8.64009 54.8287 8.25441 54.499 7.93126C54.1694 7.6081 53.7785 7.35398 53.3494 7.18377C52.9203 7.01356 52.4615 6.93069 52 6.94H6.94V3.47C6.94 2.5497 6.57441 1.66709 5.92366 1.01634C5.27291 0.365588 4.3903 0 3.47 0C2.5497 0 1.66709 0.365588 1.01634 1.01634C0.365588 1.66709 0 2.5497 0 3.47L0 121.47C0 122.39 0.365588 123.273 1.01634 123.924C1.66709 124.574 2.5497 124.94 3.47 124.94C4.3903 124.94 5.27291 124.574 5.92366 123.924C6.57441 123.273 6.94 122.39 6.94 121.47V55.51H34.69V65.91C34.69 66.8303 35.0556 67.7129 35.7063 68.3637C36.3571 69.0144 37.2397 69.38 38.16 69.38H107.54C108.226 69.3805 108.897 69.1777 109.468 68.797C110.039 68.4164 110.484 67.8751 110.747 67.2415C111.01 66.608 111.08 65.9106 110.947 65.2375C110.814 64.5644 110.484 63.9459 110 63.46L91.63 45.1ZM6.94 13.88H48.57V48.57H6.94V13.88ZM41.63 62.44V55.51H52C52.4621 55.514 52.9203 55.4259 53.3479 55.251C53.7756 55.076 54.1641 54.8176 54.4909 54.4909C54.8176 54.1641 55.076 53.7756 55.251 53.3479C55.4259 52.9203 55.514 52.4621 55.51 52V27.75H99.17L84.28 42.65C83.9565 42.9707 83.6997 43.3524 83.5245 43.7729C83.3492 44.1934 83.259 44.6444 83.259 45.1C83.259 45.5556 83.3492 46.0066 83.5245 46.4271C83.6997 46.8476 83.9565 47.2293 84.28 47.55L99.17 62.44H41.63Z" fill={colors.accentOrange} />
        </Svg>
    );
}

function BaseModal({ visible, icon, title, description, primaryLabel, onPrimaryPress, secondaryLabel, onSecondaryPress, tertiaryLabel, onTertiaryPress }) {
    return (
        <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onTertiaryPress ?? onSecondaryPress}>
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
                    {tertiaryLabel ? (
                        <TouchableOpacity style={styles.btnTertiary} onPress={onTertiaryPress} activeOpacity={0.7}>
                            <Text style={styles.btnTertiaryText}>{tertiaryLabel}</Text>
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
            icon={<IconFlame color={colors.accentOrange} />}
            title="¡Récord de racha!"
            description={`${days} días seguidos, tu mejor marca. Has ganado ${points} Opopoints.`}
            primaryLabel="¡A por más!"
            onPrimaryPress={onPress}
        />
    );
}

// Figma "POP-UP RACHA EN PELIGRO" (2337:1053)
export function RachaPeligroModal({ visible, hours, days, onPrimaryPress, onSecondaryPress, onDismissPress }) {
    return (
        <BaseModal
            visible={visible}
            icon={<IconFlame color={colors.neutralGray} />}
            title="Tu racha está en peligro"
            description={`Te quedan ${hours} horas para no perder tus ${days} días. Un test rápido la mantiene.`}
            primaryLabel="Hacer test rápido"
            onPrimaryPress={onPrimaryPress}
            secondaryLabel="Ver mis tareas"
            onSecondaryPress={onSecondaryPress}
            tertiaryLabel="En otro momento"
            onTertiaryPress={onDismissPress}
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
    btnTertiary: {
        paddingVertical: spacing.sm,
        alignItems: 'center',
        alignSelf: 'stretch',
    },
    btnTertiaryText: {
        color: colors.textMuted,
        fontSize: 12,
        fontWeight: '500',
    },
});
