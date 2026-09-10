import React, { useEffect, useRef, useState } from 'react';
import {
    StyleSheet,
    View,
    TouchableOpacity,
    Dimensions,
    Animated,
    Modal,
} from 'react-native';
import Text from './AppText';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '../theme';

const { width } = Dimensions.get('window');

// ─── Fiel al Figma (PushAlertaBoeNotification.tsx) ────────────────────────────
// Mockup de una notificación push tal como aparecería en la pantalla de
// bloqueo del teléfono; este es su único uso real en la app (banner in-app
// cuando llega una alerta BOE con la app en foreground) — no es un componente
// compartido con otros bloques, así que se puede ajustar 1:1 al diseño.
const FIGMA = {
    subtitleMuted: 'rgba(52, 58, 61, 0.5)',
    bodyMuted: 'rgba(52, 58, 61, 0.7)',
};

// Logo exacto exportado de Figma (mascota OPOX) — reemplaza el glifo
// genérico de balanza que hacía de placeholder.
function AppLogoIcon({ size = 19 }) {
    return (
        <Svg width={size} height={(size * 58) / 50} viewBox="0 0 50 58" fill="none">
            <Path d="M23.3247 26.4121C22.4602 27.1755 18.6595 30.2204 18.6595 30.2204C18.1991 29.6428 17.7145 29.0067 17.2035 28.3383L17.1828 28.3113C14.6911 25.0409 11.5885 20.9697 7.74402 18.734L7.6361 18.6759C6.15548 17.9276 4.47098 18.2292 3.44514 19.4246C2.4193 20.62 2.35997 22.3684 3.30297 23.6832L12.5443 36.0018C11.7621 36.7668 10.9139 37.5429 10.0187 38.362C6.3319 41.7386 2.1505 45.5636 0.315061 50.8664C-0.659404 53.6658 0.892095 54.924 1.39028 55.2423C2.70005 56.0777 4.44589 55.7594 5.83172 54.4363L18.6985 42.5175C19.5049 43.3171 20.3312 44.1708 21.1305 44.9998C25.3043 49.3185 29.6199 53.7843 35.6375 55.7805C36.0029 55.9047 36.3861 55.9688 36.7721 55.9703C37.8103 55.9703 38.7298 55.4726 39.2308 54.64C39.7588 53.762 39.8898 52.2758 38.5207 50.9766C35.947 48.5455 33.5624 45.9944 31.0384 43.2928L31.0356 43.2901C28.9796 41.0894 26.8542 38.8171 24.5843 36.5738L28.5825 32.7238C29.8672 31.4023 28.8609 21.5314 23.3247 26.4121Z" fill="#412950" />
            <Path d="M22.8603 36.4911C22.8842 36.2643 20.7573 34.7916 18.8888 34.2065C18.8888 34.2065 23.617 29.4761 25.6635 27.3737C27.8776 27.9127 29.2077 29.9519 29.365 29.8747C29.465 29.8254 29.1006 27.0391 27.8661 25.4192C29.33 24.2847 30.9161 23.3152 32.501 22.4233C33.3178 21.9634 34.2274 21.4383 35.1294 20.8468C36.7732 21.7045 37.7648 23.2512 37.8982 23.1859C37.9819 23.1461 37.7358 21.1491 36.9126 19.5539C38.5701 18.2093 39.9228 16.6029 40.1889 14.7261C43.2699 14.8056 44.6777 16.9781 45.2695 18.3963C44.7497 19.1884 44.1577 19.9307 43.5009 20.6137C42.2314 18.8633 40.0196 17.8012 39.9029 17.9137C39.7862 18.0263 41.4696 19.9557 41.4919 22.436C39.7197 23.8483 37.7298 25.027 35.7574 26.1755C34.6821 24.0297 32.3597 23.102 32.2306 23.2209C32.114 23.3267 33.3564 25.0059 33.374 27.5777C31.1897 28.8969 29.1615 30.2777 27.6263 32.0177C25.2608 30.876 22.6286 31.8701 22.6086 32.0575C22.5967 32.2051 23.9786 31.968 25.6623 33.5827C24.859 35.0713 22.8332 36.7381 22.8603 36.4911Z" fill="#F49424" />
            <Path d="M36.0891 18.371C37.1671 17.3713 37.9962 16.3083 38.4466 15.0811C38.4725 15.0106 38.496 14.9406 38.5195 14.8706C39.0687 14.7636 39.6278 14.7155 40.1873 14.727C39.9213 16.6039 38.5685 18.2102 36.9111 19.5548C36.6833 19.1129 36.4109 18.7015 36.0891 18.371Z" fill="#F37D27" />
            <Path d="M33.6014 20.3413C34.1351 20.4232 34.6511 20.5944 35.1278 20.8477C34.2274 21.4393 33.3179 21.9644 32.4995 22.4242C30.9146 23.3161 29.3284 24.2856 27.8645 25.4202C27.6751 25.1651 27.4511 24.9375 27.1991 24.7439C28.5049 23.7545 29.8613 22.8543 31.1754 21.9823C32.0212 21.4226 32.8372 20.8811 33.6014 20.3413Z" fill="#F37D27" />
            <Path d="M25.6638 27.3739C23.6169 29.4779 18.8888 34.2067 18.8888 34.2067C18.3225 34.149 17.9079 33.3824 17.2935 33.5224C17.2935 33.5224 22.077 29.4512 24.2776 27.2565C24.743 27.2237 25.2106 27.2633 25.6638 27.3739Z" fill="#F37D27" />
            <Path d="M38.334 0.069566C41.1805 -0.359672 44.3743 1.22322 46.4706 4.10535C49.2446 7.91797 49.515 12.9638 47.1938 17.6031C44.7996 22.3883 40.3641 24.9709 36.0752 27.4688C30.7477 30.5717 28.084 33.204 24.5831 36.5723C23.9627 37.169 19.4755 40.6101 19.5814 41.4033C19.5814 41.4033 18.2473 40.0905 18.5062 39.9994C18.5062 39.9994 24.7703 34.4679 25.6659 33.5823C23.9822 31.9676 22.5996 32.2047 22.6123 32.0571C22.6306 31.8713 25.2629 30.8772 27.63 32.0173C29.1652 30.2777 31.1933 28.8969 33.3776 27.5778C33.3601 25.0059 32.1176 23.3268 32.2343 23.221C32.3633 23.1016 34.6846 24.0297 35.761 26.1755C37.7319 25.027 39.7218 23.8483 41.4955 22.4361C41.4732 19.9557 39.7831 18.0275 39.9066 17.9138C40.03 17.8 42.235 18.8621 43.5046 20.6137C44.1615 19.9308 44.7535 19.1885 45.2731 18.3963C44.6813 16.9781 43.2736 14.8065 40.1925 14.7261C39.6331 14.7146 39.074 14.7627 38.5247 14.8697C38.5012 14.9397 38.4777 15.0097 38.4519 15.0802C38.0015 16.3074 37.1723 17.3703 36.0943 18.37C36.4161 18.7006 36.6885 19.112 36.9163 19.5539C37.7394 21.1492 37.9855 23.1446 37.9019 23.1859C37.7685 23.2512 36.7769 21.7045 35.133 20.8468C34.6563 20.5935 34.1403 20.4223 33.6066 20.3404C32.8424 20.8802 32.0264 21.4217 31.1814 21.9826C29.8672 22.8546 28.5109 23.7548 27.2051 24.7442C27.4574 24.9377 27.6816 25.1653 27.8713 25.4204C29.1058 27.0395 29.4702 29.8258 29.3702 29.8759C29.211 29.9531 27.8829 27.9139 25.6691 27.3749C25.216 27.2637 24.7484 27.2234 24.2829 27.2555C22.0823 29.4503 17.2987 33.5215 17.2987 33.5215C17.9132 33.3814 22.4908 35.5296 23.8819 37.2243C23.8819 37.2243 19.5121 40.612 19.5866 41.4013C19.5866 41.4013 12.158 36.4287 12.8211 35.7043C16.7018 31.4739 25.0614 24.5103 30.4745 20.9188C33.648 18.8132 36.3886 16.9948 37.2524 14.6406C38.0823 12.3778 37.2416 10.6788 36.2684 8.7132C35.6352 7.43344 34.9805 6.11032 34.7463 4.533C34.7463 4.52624 34.7463 4.51948 34.7435 4.51271C34.4612 2.61237 35.4655 0.501986 38.334 0.069566Z" fill="#412950" />
            <Path d="M22.6819 26.7437C21.8162 27.5071 15.4576 32.8143 15.4576 32.8143L22.6803 38.3065L29.6597 31.9168C31.9184 29.919 28.2181 21.8634 22.6819 26.7437Z" fill="url(#appLogoGrad1)" />
            <Path d="M46.4311 50.8696C45.7252 50.8696 45.0352 51.0787 44.4483 51.4705C43.8614 51.8622 43.404 52.419 43.1339 53.0705C42.8637 53.7219 42.7931 54.4388 42.9308 55.1303C43.0685 55.8219 43.4084 56.4572 43.9075 56.9558C44.4066 57.4544 45.0425 57.7939 45.7348 57.9315C46.4272 58.069 47.1447 57.9984 47.7969 57.7286C48.449 57.4588 49.0064 57.0018 49.3986 56.4155C49.7907 55.8292 50 55.1399 50 54.4348C50.0001 53.9666 49.9078 53.503 49.7285 53.0704C49.5491 52.6378 49.2863 52.2448 48.9548 51.9137C48.6234 51.5827 48.23 51.3201 47.7969 51.1409C47.3639 50.9618 46.8998 50.8696 46.4311 50.8696ZM46.4311 57.6352C44.6717 57.6352 43.2274 56.1919 43.2274 54.4348C43.2274 52.6689 44.6717 51.2261 46.4311 51.2261C48.1905 51.2261 49.6345 52.6689 49.6345 54.4348C49.6345 56.1919 48.1901 57.6352 46.4311 57.6352Z" fill="#412950" />
            <Path d="M46.9273 52.6355H45.215V56.2265H45.6259V54.9424H46.5156L47.2029 56.2341H47.6366L46.9337 54.9424H47.0309C47.5689 54.9424 47.9428 54.5991 47.9428 53.9717V53.6432C47.944 53.0086 47.5625 52.6355 46.9273 52.6355ZM47.5402 53.897C47.5402 54.2948 47.3383 54.5541 46.9122 54.5541H45.6267V53.0309H46.8676C47.3383 53.0309 47.5402 53.2847 47.5402 53.6957V53.897Z" fill="#412950" />
            <Path d="M43.9716 18.238C42.0601 18.238 39.6182 16.7896 38.7126 15.4931C38.5462 15.2544 38.4876 15.0929 38.4737 15.0253C39.4581 12.2744 38.4195 10.1748 37.4148 8.14315C36.8254 6.94972 36.2161 5.72048 36.0118 4.34207C35.9238 3.74058 35.845 1.73999 38.5254 1.33581C38.7727 1.29884 39.0225 1.28036 39.2725 1.28052C41.466 1.28052 43.8263 2.65098 45.4319 4.85723C47.9185 8.27522 48.1478 12.8246 46.0448 17.0271C45.6322 17.8517 44.9736 18.2356 43.9716 18.2356V18.238Z" fill="url(#appLogoGrad2)" opacity={0.7} />
            <Defs>
                <LinearGradient id="appLogoGrad1" x1="30.2419" y1="28.8282" x2="16.575" y2="35.2078" gradientUnits="userSpaceOnUse">
                    <Stop stopColor="#412950" stopOpacity={0} />
                    <Stop offset="0.04" stopColor="#412950" stopOpacity={0.12} />
                    <Stop offset="0.21" stopColor="#412950" stopOpacity={0.5} />
                    <Stop offset="0.37" stopColor="#412950" stopOpacity={0.78} />
                    <Stop offset="0.52" stopColor="#412950" stopOpacity={0.94} />
                    <Stop offset="0.66" stopColor="#412950" />
                </LinearGradient>
                <LinearGradient id="appLogoGrad2" x1="43.849" y1="2.57698" x2="38.7345" y2="16.6434" gradientUnits="userSpaceOnUse">
                    <Stop stopColor="#7241B8" />
                    <Stop offset="0.27" stopColor="#7241B8" stopOpacity={0.5} />
                    <Stop offset="0.85" stopColor="#020001" stopOpacity={0} />
                </LinearGradient>
            </Defs>
        </Svg>
    );
}

/**
 * Banner de alerta BOE estilo notificación push del SO (lock-screen).
 *
 * Aparece cuando la app está en foreground y llega una notificación BOE.
 * En background, el SO muestra la push nativa (expo-notifications, Paso 2).
 *
 * Props:
 *   visible     — muestra / oculta el banner
 *   title       — título de la alerta (default: "¡Alerta BOE!")
 *   body        — cuerpo del mensaje
 *   onPress     — tap en la tarjeta → navegar al detalle BOE
 *   onDismiss   — tap fuera, swipe o botón cerrar → cerrar sin navegar
 */
export default function BoeAlertBanner({
    visible,
    title = '¡Alerta BOE!',
    body = 'El art. 14 de tu temario ha sido modificado. Toca para ver el cambio y hacer un mini-test.',
    onPress,
    onDismiss,
}) {
    const translateY = useRef(new Animated.Value(-120)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    // Estado interno: el Modal permanece montado durante la animación de salida
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        if (visible) {
            setModalVisible(true);
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0,
                    tension: 70,
                    friction: 10,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            // Animar salida primero; solo entonces ocultar el Modal
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: -120,
                    duration: 220,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 180,
                    useNativeDriver: true,
                }),
            ]).start(({ finished }) => {
                if (finished) setModalVisible(false);
            });
        }
    }, [visible]);

    return (
        <Modal
            transparent
            visible={modalVisible}
            animationType="none"
            statusBarTranslucent
            onRequestClose={onDismiss}
        >
            {/* Overlay: tap fuera cierra el banner */}
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onDismiss}
            >
                <Animated.View
                    style={[
                        styles.cardWrapper,
                        { transform: [{ translateY }], opacity },
                    ]}
                >
                    {/* La tarjeta no propaga el tap al overlay */}
                    <TouchableOpacity
                        style={styles.card}
                        activeOpacity={0.9}
                        onPress={onPress}
                        accessibilityLabel={`Alerta BOE: ${title}. Tocar para ver el detalle.`}
                    >
                        <View style={styles.header}>
                            {/* Icono exacto exportado de Figma (mascota OPOX). */}
                            <View style={styles.appIcon}>
                                <AppLogoIcon />
                            </View>
                            <Text style={styles.appName}>Opox.ai</Text>
                            <View style={styles.spacer} />
                            <Text style={styles.time}>ahora</Text>
                            <TouchableOpacity
                                onPress={onDismiss}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                accessibilityLabel="Cerrar notificación"
                            >
                                <Ionicons name="close" size={14} color={FIGMA.subtitleMuted} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.alertTitle}>{title}</Text>
                        <Text style={styles.alertBody} numberOfLines={3}>{body}</Text>
                    </TouchableOpacity>
                </Animated.View>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 56, // debajo de la status bar del SO
    },
    cardWrapper: {
        width: width * 0.9,
        maxWidth: 400,
    },
    card: {
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderRadius: 16,
        padding: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
        elevation: 10,
    },

    // ── Encabezado: ícono + nombre app + hora + cerrar ─────────────
    header: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    appIcon: {
        width: 22,
        height: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    appName: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 13,
        color: colors.textDark,
        marginLeft: 8,
    },
    spacer: {
        flex: 1,
    },
    time: {
        fontFamily: 'Poppins-Regular',
        fontSize: 10,
        color: FIGMA.subtitleMuted,
        marginRight: 8,
    },

    // ── Texto ─────────────────────────────────────────────────────
    alertTitle: {
        fontFamily: 'Poppins-Bold',
        fontSize: 15,
        color: colors.textDark,
        marginTop: 8,
    },
    alertBody: {
        fontFamily: 'Poppins-Regular',
        fontSize: 12.5,
        color: FIGMA.bodyMuted,
        marginTop: 2,
        lineHeight: 17,
    },
});
