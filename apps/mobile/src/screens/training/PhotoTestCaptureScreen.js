import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import TrainingHeader from '../../components/TrainingHeader';
import { colors, spacing } from '../../theme';

const CORNER_COLOR = colors.purple;

// ─── Iconos ──────────────────────────────────────────────────────────────────

function IconCameraPlaceholder({ color = '#B4BAC5' }) {
    return (
        <Svg width={72} height={72} viewBox="0 0 24 24" fill="none">
            <Path
                d="M4 8h3l2-3h6l2 3h3v11H4z"
                stroke={color}
                strokeWidth={1.4}
                strokeLinejoin="round"
            />
            <Circle cx={12} cy={13} r={3.5} stroke={color} strokeWidth={1.4} />
        </Svg>
    );
}

function IconGallery({ color = '#5A6373' }) {
    return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Rect x={3} y={5} width={16} height={14} rx={2} stroke={color} strokeWidth={1.7} />
            <Path d="M3 15l4-4 4 4 3-3 5 5" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
            <Circle cx={13} cy={10} r={1.4} fill={color} />
        </Svg>
    );
}

function IconRotateCamera({ color = '#5A6373' }) {
    return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path
                d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3"
                stroke={color}
                strokeWidth={1.7}
                strokeLinecap="round"
            />
            <Path d="M18 3v4h-4M6 21v-4h4" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

// Esquinas moradas del marco de encuadre
function FrameCorners({ w, h }) {
    if (!w || !h) return null;
    const c = 34;
    const s = 4;
    return (
        <Svg width={w} height={h} pointerEvents="none">
            <Path d={`M0 ${c} L0 0 L${c} 0`} stroke={CORNER_COLOR} strokeWidth={s} fill="none" strokeLinecap="round" />
            <Path d={`M${w - c} 0 L${w} 0 L${w} ${c}`} stroke={CORNER_COLOR} strokeWidth={s} fill="none" strokeLinecap="round" />
            <Path d={`M0 ${h - c} L0 ${h} L${c} ${h}`} stroke={CORNER_COLOR} strokeWidth={s} fill="none" strokeLinecap="round" />
            <Path d={`M${w - c} ${h} L${w} ${h} L${w} ${h - c}`} stroke={CORNER_COLOR} strokeWidth={s} fill="none" strokeLinecap="round" />
        </Svg>
    );
}

// ─── Pantalla 6.3 · Foto-Test · Captura ──────────────────────────────────────
export default function PhotoTestCaptureScreen({ navigation }) {
    const [busy, setBusy] = useState(false);
    const [frameSize, setFrameSize] = useState({ w: 0, h: 0 });
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
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

            <TrainingHeader
                eyebrow="Zona de entrenamiento"
                title="Foto-test"
                onBack={() => navigation.goBack()}
                onSettings={() => navigation.navigate('Settings')}
            />

            <View style={styles.body}>
                <View style={styles.previewCard}>
                    <Text style={styles.previewTitle}>Digitaliza tus apuntes</Text>
                    <Text style={styles.previewSubtitle}>
                        Fotografía tus anotaciones para procesarlas con IA
                    </Text>

                    <TouchableOpacity
                        style={styles.frameBox}
                        activeOpacity={0.8}
                        onPress={openCamera}
                        disabled={busy}
                        onLayout={(e) => {
                            const { width, height } = e.nativeEvent.layout;
                            if (width !== frameSize.w || height !== frameSize.h) {
                                setFrameSize({ w: width, h: height });
                            }
                        }}
                        accessibilityLabel="Abrir cámara para tomar foto del apunte"
                    >
                        <View style={StyleSheet.absoluteFill} pointerEvents="none">
                            <FrameCorners w={frameSize.w} h={frameSize.h} />
                        </View>
                        <IconCameraPlaceholder />
                        <Text style={styles.frameHint}>Encuadra tu apunte o pregunta</Text>
                        <Text style={styles.frameCta}>
                            {cameraPerm === false
                                ? 'Concede acceso a la cámara para continuar'
                                : 'Toca para abrir la cámara'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Controles inferiores: galería · disparador · rotar cámara */}
                <View style={styles.controls}>
                    <TouchableOpacity style={styles.sideBtn} onPress={openGallery} activeOpacity={0.7}>
                        <IconGallery />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.shutter, busy && { opacity: 0.7 }]}
                        onPress={openCamera}
                        disabled={busy}
                        activeOpacity={0.85}
                        accessibilityLabel="Abrir cámara para tomar foto"
                    >
                        {busy ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <View style={styles.shutterDot} />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.sideBtn} onPress={toggleFacing} activeOpacity={0.7}>
                        <IconRotateCamera />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.white },
    body: {
        flex: 1,
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.lg,
    },

    previewCard: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        borderRadius: 16,
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    previewTitle: {
        fontSize: 20,
        fontFamily: 'Poppins-SemiBold',
        color: colors.textDark,
        textAlign: 'center',
        marginTop: 4,
    },
    previewSubtitle: {
        fontSize: 12,
        fontFamily: 'Poppins-Regular',
        color: colors.textMuted,
        opacity: 0.6,
        textAlign: 'center',
        marginTop: 4,
        marginBottom: spacing.md,
    },
    frameBox: {
        flex: 1,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: 'rgba(65, 41, 80, 0.15)',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    frameHint: {
        color: colors.textMuted,
        opacity: 0.6,
        fontSize: 12,
        fontFamily: 'Poppins-Regular',
        marginTop: 10,
        textAlign: 'center',
    },
    frameCta: {
        color: colors.purple,
        fontSize: 12,
        fontFamily: 'Poppins-SemiBold',
        marginTop: 4,
        textAlign: 'center',
    },

    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 30,
    },
    sideBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    shutter: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: '#C4CBD6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    shutterDot: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: '#B4BAC5',
    },
});
