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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
                    <Ionicons name="chevron-back" size={scale(28)} color={COLORS.purple900} />
                </TouchableOpacity>

                <Text style={styles.headerTitle} numberOfLines={1}>
                    Zona de entrenamiento
                </Text>

                <TouchableOpacity style={styles.iconCircle} activeOpacity={0.7} onPress={() => navigation.navigate('Settings')}>
                    <Ionicons name="settings-outline" size={scale(34)} color={COLORS.purple900} />
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
                    <MaterialCommunityIcons
                        name="camera-outline"
                        size={scale(150)}
                        color={COLORS.gray200}
                    />
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
                    <Ionicons name="image-outline" size={scale(50)} color={COLORS.gray300} />
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
                    <Ionicons name="sync-outline" size={scale(50)} color={COLORS.gray300} />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: COLORS.white,
        paddingTop: scale(189),
    },

    /* ---------- HEADER ---------- */
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: scale(56),
        height: scale(54.03),
    },
    iconCircle: {
        width: scale(54.04),
        height: scale(54.04),
        borderRadius: scale(27.02),
        backgroundColor: 'rgba(65,41,80,0.1)',
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
        borderRadius: scale(15),
        borderWidth: scale(3),
        borderColor: COLORS.gray300,
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
