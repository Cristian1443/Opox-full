import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Svg, { Path, Circle } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../theme';

// ------------------------------------------------------------------
// Escalado proporcional 1:1 respecto al frame original de Figma
// (905px de ancho). Así cada medida es exacta respecto al diseño,
// sin importar el ancho real del dispositivo.
// ------------------------------------------------------------------
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DESIGN_WIDTH = 905;
const scale = (value) => (SCREEN_WIDTH / DESIGN_WIDTH) * value;

const COLORS = {
    purple900: colors.textDark,
    purple400: colors.selectionBorder, // #9F6EE4 — esquinas del visor
    gray300: '#D9D9D9',
    gray200: '#EBEBEB',
    gray600: 'rgba(52,58,61,0.5)',
    white: colors.white,
};

// Iconos exactos exportados de Figma (antes Ionicons/MaterialCommunityIcons
// genéricos con proporciones distintas).
function IconGear({ size, color = COLORS.purple900 }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 54 54" fill="none">
            <Path d="M51.4399 30.8795V23.7995L45.2299 23.2795C44.8079 21.0153 43.9778 18.8467 42.78 16.8795L46.9299 11.8795L41.9899 6.87945L37.2399 10.9495C35.3532 9.6517 33.2453 8.70957 31.02 8.16945L30.4899 1.68945H23.4899L22.97 7.96945C20.7427 8.41611 18.6148 9.26316 16.6899 10.4695L11.7899 6.26945L6.84991 11.2695L10.8499 16.0795C9.56076 17.9964 8.62909 20.1308 8.09991 22.3795L1.68994 22.8795V29.9495L7.89996 30.4695C8.32019 32.7389 9.14679 34.9138 10.34 36.8895L6.19995 41.8895L11.1299 46.8895L15.89 42.8195C17.7719 44.1193 19.8769 45.0616 22.0999 45.5995L22.6899 52.0795H29.6899L30.21 45.7994C32.4541 45.3678 34.5998 44.5272 36.5399 43.3195L41.4399 47.5195L46.3799 42.5195L42.3799 37.7095C43.6691 35.7925 44.6008 33.6581 45.1299 31.4095L51.4399 30.8795Z" stroke={color} strokeWidth={3.38} />
            <Path d="M34.3099 26.8793C34.2902 28.4077 33.819 29.8961 32.9555 31.1574C32.092 32.4186 30.8748 33.3964 29.4571 33.9677C28.0393 34.5389 26.4843 34.6782 24.9876 34.368C23.4909 34.0578 22.1193 33.3119 21.0455 32.2241C19.9716 31.1364 19.2433 29.7554 18.9523 28.2548C18.6613 26.7543 18.8205 25.2012 19.4099 23.7909C19.9993 22.3806 20.9926 21.176 22.2648 20.3288C23.537 19.4815 25.0314 19.0294 26.5599 19.0293C27.5842 19.0358 28.5972 19.2441 29.5411 19.6421C30.4849 20.0402 31.3411 20.6202 32.0608 21.3492C32.7804 22.0781 33.3494 22.9417 33.7353 23.8905C34.1212 24.8394 34.3165 25.855 34.3099 26.8793Z" stroke={color} strokeWidth={3.38} />
        </Svg>
    );
}

function IconCameraGlyph({ size, color = COLORS.gray200 }) {
    return (
        <Svg width={size} height={(size * 158) / 206} viewBox="0 0 206 158" fill="none">
            <Path d="M205.15 42.1595C205.15 32.2695 198.15 25.2695 188.15 25.1595C178.03 25.0995 167.913 25.0995 157.8 25.1595C156.954 25.1965 156.111 25.0432 155.332 24.7109C154.553 24.3786 153.859 23.8758 153.3 23.2395C147.64 17.3995 141.82 11.7095 136.17 5.84953C134.344 3.91344 132.125 2.38991 129.662 1.381C127.2 0.372089 124.55 -0.0989174 121.89 -0.000469752C109.31 0.10953 96.72 0.0895303 84.14 -0.000469752C81.432 -0.116664 78.7312 0.360096 76.2267 1.39647C73.7221 2.43284 71.4741 4.00382 69.64 5.99953C64 11.9995 58.17 17.8195 52.28 23.5595C51.2292 24.5053 49.8824 25.0568 48.47 25.1195C38.68 25.2395 28.9 25.1895 19.11 25.1895C8.33 25.1895 3.36 28.8995 0.37 39.1895C0.270083 39.4156 0.14603 39.6302 0 39.8295L0 142.91C0.1 143.03 0.28 143.15 0.3 143.29C1.87 151.13 6.56 155.85 14.43 157.41C14.57 157.41 14.68 157.6 14.81 157.71H190.51C190.849 157.493 191.211 157.315 191.59 157.18C200.09 155.18 205.15 149.02 205.16 140.27C205.18 107.57 205.177 74.8662 205.15 42.1595ZM102.65 133.09C77.65 133.09 56.85 112.27 56.77 87.2295C56.77 75.0587 61.6048 63.3864 70.2109 54.7804C78.8169 46.1744 90.4892 41.3395 102.66 41.3395C114.831 41.3395 126.503 46.1744 135.109 54.7804C143.715 63.3864 148.55 75.0587 148.55 87.2295C148.44 112.34 127.64 133.09 102.65 133.09ZM185.65 51.6695C183.787 51.6142 182.018 50.8386 180.715 49.5057C179.412 48.1728 178.677 46.3866 178.664 44.5227C178.651 42.6589 179.361 40.8626 180.645 39.5117C181.93 38.1609 183.688 37.3607 185.55 37.2795C187.413 37.3348 189.182 38.1105 190.485 39.4434C191.788 40.7762 192.523 42.5625 192.536 44.4263C192.549 46.2902 191.839 48.0865 190.555 49.4373C189.27 50.7882 187.512 51.5884 185.65 51.6695Z" fill={color} />
            <Path d="M102.91 52.7997C96.1052 52.7125 89.428 54.6492 83.7259 58.3638C78.0238 62.0785 73.554 67.4036 70.8838 73.6632C68.2137 79.9227 67.4636 86.8346 68.7288 93.5212C69.9941 100.208 73.2175 106.368 77.99 111.219C82.7625 116.071 88.8688 119.394 95.5339 120.769C102.199 122.144 109.122 121.507 115.425 118.94C121.727 116.372 127.125 111.99 130.932 106.35C134.74 100.71 136.786 94.065 136.81 87.2597C136.869 78.1992 133.334 69.4849 126.979 63.0258C120.625 56.5667 111.97 52.8895 102.91 52.7997Z" fill={color} />
        </Svg>
    );
}

function IconGalleryFrame({ size, color = COLORS.gray300 }) {
    return (
        <Svg width={size} height={(size * 83) / 123} viewBox="0 0 123 83" fill="none">
            <Path d="M15 1.5H108C115.456 1.5 121.5 7.54416 121.5 15V68C121.5 75.4558 115.456 81.5 108 81.5H15C7.54416 81.5 1.5 75.4558 1.5 68V15C1.5 7.54416 7.54416 1.5 15 1.5Z" stroke={color} strokeWidth={3} />
            <Circle cx={21} cy={20} r={10.5} stroke={color} strokeWidth={3} />
        </Svg>
    );
}

function IconRotateArrows({ size, color = COLORS.gray300 }) {
    return (
        <Svg width={size} height={(size * 88) / 102} viewBox="0 0 102 88" fill="none">
            <Path d="M102 25.2781L87.2604 20.6159L85.291 20L84.4602 21.9092L78.4475 35.7974L82.6632 37.6451L86.7619 28.1666C90.0042 35.4148 90.9688 43.4778 89.5279 51.2871C88.087 59.0963 84.3087 66.2829 78.6936 71.8944C71.342 79.2489 61.3727 83.3804 50.9777 83.3804C40.5828 83.3804 30.6134 79.2489 23.2618 71.8944L20 75.1586C24.0673 79.2297 28.8962 82.4592 34.2109 84.6626C39.5256 86.8659 45.2219 88 50.9746 88C56.7273 88 62.4237 86.8659 67.7383 84.6626C73.053 82.4592 77.8819 79.2297 81.9493 75.1586C88.1678 68.9361 92.3709 60.9846 94.0119 52.3389C95.6528 43.6931 94.6556 34.7532 91.15 26.6823L100.609 29.6755L102 25.2781Z" fill={color} />
            <Path d="M19.3383 50.3777L15.2331 59.8605C11.9922 52.6083 11.0289 44.5414 12.471 36.7288C13.9131 28.9162 17.6924 21.7267 23.3081 16.1129C26.9473 12.4675 31.2683 9.57563 36.0243 7.60261C40.7803 5.62959 45.878 4.61407 51.0261 4.61407C56.1743 4.61407 61.272 5.62959 66.0279 7.60261C70.7839 9.57563 75.1049 12.4675 78.7441 16.1129L82 12.8473C77.9324 8.77423 73.1031 5.54328 67.788 3.33893C62.4729 1.13457 56.7762 0 51.023 0C45.2699 0 39.5732 1.13457 34.2581 3.33893C28.943 5.54328 24.1137 8.77423 20.0461 12.8473C13.8319 19.0691 9.63128 27.0187 7.99029 35.6625C6.3493 44.3062 7.34387 53.2443 10.8447 61.3146L1.38482 58.3201L0 62.7195L14.7714 67.3838L16.741 68L17.5719 66.0837L23.5851 52.1893L19.3383 50.3777Z" fill={color} />
        </Svg>
    );
}

// ─── Pantalla 6.3 · Foto-Test · Captura ──────────────────────────────────────
export default function PhotoTestCaptureScreen({ navigation }) {
    const [busy, setBusy] = useState(false);
    const [cameraFacing, setCameraFacing] = useState('back');
    const [cameraPerm, setCameraPerm] = useState(null);

    // Pedimos permisos de cámara al montar la pantalla para que el prompt del
    // SO aparezca antes de tocar los botones. NO auto-lanzamos la cámara: el
    // usuario ve el placeholder con los tres botones (galería · disparador ·
    // rotar) y elige — imprescindible para poder subir un screenshot.
    useEffect(() => {
        (async () => {
            const perm = await ImagePicker.requestCameraPermissionsAsync();
            setCameraPerm(perm.granted);
        })();
    }, []);

    const openCamera = async () => {
        if (busy) return;
        setBusy(true);
        try {
            const perm = cameraPerm
                ? { granted: true }
                : await ImagePicker.requestCameraPermissionsAsync();
            if (!perm.granted) {
                setCameraPerm(false);
                setBusy(false);
                return;
            }
            setCameraPerm(true);
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                quality: 0.9,
                base64: true,
                cameraType: cameraFacing === 'front'
                    ? ImagePicker.CameraType.front
                    : ImagePicker.CameraType.back,
            });
            if (!result.canceled && result.assets?.[0]) {
                const asset = result.assets[0];
                const ext = asset.uri.split('.').pop()?.toLowerCase();
                navigation.navigate('PhotoTestAnalysis', {
                    uri: asset.uri,
                    source: 'camera',
                    imageBase64: asset.base64,
                    mimeType: ext === 'png' ? 'image/png' : 'image/jpeg',
                });
            }
        } catch (err) {
            console.warn('launchCameraAsync failed', err);
        } finally {
            setBusy(false);
        }
    };

    const openGallery = async () => {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) return;
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.9,
            base64: true,
        });
        if (!result.canceled && result.assets?.[0]) {
            const asset = result.assets[0];
            const ext = asset.uri.split('.').pop()?.toLowerCase();
            navigation.navigate('PhotoTestAnalysis', {
                uri: asset.uri,
                source: 'gallery',
                imageBase64: asset.base64,
                mimeType: ext === 'png' ? 'image/png' : 'image/jpeg',
            });
        }
    };

    const toggleFacing = () => {
        setCameraFacing((f) => (f === 'back' ? 'front' : 'back'));
    };

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

            {/* ---------- HEADER (NAV) ---------- */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.iconCircle} activeOpacity={0.7} onPress={() => navigation.goBack()}>
                    <Feather name="chevron-left" size={22} color={COLORS.purple900} />
                </TouchableOpacity>

                <Text style={styles.headerTitle} numberOfLines={1}>
                    Zona de entrenamiento
                </Text>

                <TouchableOpacity style={styles.settingsButton} activeOpacity={0.7} onPress={() => navigation.navigate('Settings')}>
                    <IconGear size={22} />
                </TouchableOpacity>
            </View>

            <Text style={styles.headerSubtitle}>Foto-test</Text>

            {/* ---------- CARD ---------- */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Digitaliza tus apuntes</Text>
                <Text style={styles.cardSubtitle}>
                    Fotografía tus anotaciones para procesarlos con IA
                </Text>

                {/* Visor de cámara */}
                <TouchableOpacity
                    style={styles.viewfinder}
                    activeOpacity={0.8}
                    onPress={openCamera}
                    disabled={busy}
                    accessibilityLabel="Abrir cámara para tomar foto del apunte"
                >
                    <IconCameraGlyph size={scale(206)} />
                    <Text style={styles.placeholder}>Encuadra tu apunte o pregunta</Text>
                    <Text style={styles.placeholderCta}>
                        {cameraPerm === false
                            ? 'Concede acceso a la cámara para continuar'
                            : 'Toca para abrir la cámara'}
                    </Text>

                    {/* Esquina superior derecha */}
                    <View style={styles.cornerTopRight} />
                    {/* Esquina inferior izquierda */}
                    <View style={styles.cornerBottomLeft} />
                </TouchableOpacity>
            </View>

            {/* ---------- BARRA INFERIOR ---------- */}
            <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.galleryButton} activeOpacity={0.7} onPress={openGallery}>
                    <IconGalleryFrame size={scale(123)} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.shutterButton, busy && { opacity: 0.7 }]}
                    activeOpacity={0.8}
                    onPress={openCamera}
                    disabled={busy}
                    accessibilityLabel="Abrir cámara para tomar foto"
                >
                    {busy && <ActivityIndicator color={COLORS.white} />}
                </TouchableOpacity>

                <TouchableOpacity style={styles.rotateButton} activeOpacity={0.7} onPress={toggleFacing}>
                    <IconRotateArrows size={scale(102)} />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: COLORS.white,
        paddingTop: 12,
    },

    /* ---------- HEADER ---------- */
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: scale(56),
        height: 44,
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(65,41,80,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingsButton: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontFamily: 'Poppins-SemiBold',
        fontSize: scale(48),
        lineHeight: scale(48) * 1.547,
        color: COLORS.purple900,
    },
    headerSubtitle: {
        textAlign: 'center',
        fontFamily: 'Poppins-Light',
        fontSize: scale(48),
        lineHeight: scale(48) * 1.547,
        color: COLORS.purple900,
        marginTop: scale(-2),
    },

    /* ---------- CARD ---------- */
    card: {
        flex: 1,
        marginTop: scale(51),
        marginHorizontal: scale(60),
        marginBottom: scale(30),
        backgroundColor: 'rgba(235,235,235,0.5)',
        borderWidth: scale(1.49),
        borderColor: 'rgba(65,41,80,0.3)',
        borderRadius: scale(24),
        paddingTop: scale(64),
        paddingHorizontal: scale(33),
        paddingBottom: scale(26),
        alignItems: 'center',
    },
    cardTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: scale(48),
        lineHeight: scale(48) * 1.547,
        color: COLORS.purple900,
        textAlign: 'center',
    },
    cardSubtitle: {
        fontFamily: 'Poppins-Regular',
        fontSize: scale(26),
        color: COLORS.gray600,
        textAlign: 'center',
        marginTop: scale(8),
        marginBottom: scale(53),
    },

    /* ---------- VISOR DE CÁMARA ---------- */
    viewfinder: {
        flex: 1,
        width: '100%',
        backgroundColor: COLORS.white,
        borderRadius: scale(12),
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    placeholder: {
        fontFamily: 'Poppins-Regular',
        fontSize: scale(26),
        color: COLORS.gray600,
        textAlign: 'center',
        marginTop: scale(27),
        paddingHorizontal: scale(40),
    },
    placeholderCta: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: scale(22),
        color: COLORS.purple400,
        textAlign: 'center',
        marginTop: scale(8),
        paddingHorizontal: scale(40),
    },
    cornerTopRight: {
        position: 'absolute',
        top: scale(10),
        right: scale(8),
        width: scale(120),
        height: scale(140),
        borderTopWidth: scale(17),
        borderRightWidth: scale(17),
        borderColor: COLORS.purple400,
        borderTopRightRadius: scale(24),
    },
    cornerBottomLeft: {
        position: 'absolute',
        bottom: scale(10),
        left: scale(8),
        width: scale(125),
        height: scale(140),
        borderBottomWidth: scale(17),
        borderLeftWidth: scale(17),
        borderColor: COLORS.purple400,
        borderBottomLeftRadius: scale(24),
    },

    /* ---------- BARRA INFERIOR ---------- */
    bottomBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: scale(124),
        marginBottom: scale(40),
    },
    galleryButton: {
        width: scale(123),
        height: scale(83),
        alignItems: 'center',
        justifyContent: 'center',
    },
    shutterButton: {
        width: scale(158),
        height: scale(158),
        borderRadius: scale(79),
        backgroundColor: COLORS.gray300,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rotateButton: {
        width: scale(102),
        height: scale(88),
        alignItems: 'center',
        justifyContent: 'center',
    },
});
