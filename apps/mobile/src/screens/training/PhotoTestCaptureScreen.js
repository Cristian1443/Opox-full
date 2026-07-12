import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

// ─── Iconos SVG del bloque 6.3 ───────────────────────────────────────────────

function IconClose({ color = '#FFF' }) {
    return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path d="M6 6l12 12M18 6l-12 12" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
        </Svg>
    );
}

function IconImages({ color = '#FFF' }) {
    return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Rect x={3} y={5} width={16} height={14} rx={2} stroke={color} strokeWidth={1.8} />
            <Path d="M3 15l4-4 4 4 3-3 5 5" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
            <Circle cx={13} cy={10} r={1.5} fill={color} />
        </Svg>
    );
}

function IconFlashOff({ color = '#FFF' }) {
    return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path d="M13 2L4 14h6l-1 8 9-12h-6z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
            <Path d="M4 4l16 16" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
    );
}

function IconFlashOn({ color = '#FFD84A' }) {
    return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path d="M13 2L4 14h6l-1 8 9-12h-6z" fill={color} stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
        </Svg>
    );
}

// Marco de encuadre con 4 esquinas (crop guide) dibujado en SVG.
function FrameCorners({ w, h }) {
    const c = 22;
    const s = 3;
    return (
        <Svg width={w} height={h} pointerEvents="none">
            <Path d={`M0 ${c} L0 0 L${c} 0`} stroke="#FFF" strokeWidth={s} fill="none" strokeLinecap="round" />
            <Path d={`M${w - c} 0 L${w} 0 L${w} ${c}`} stroke="#FFF" strokeWidth={s} fill="none" strokeLinecap="round" />
            <Path d={`M0 ${h - c} L0 ${h} L${c} ${h}`} stroke="#FFF" strokeWidth={s} fill="none" strokeLinecap="round" />
            <Path d={`M${w - c} ${h} L${w} ${h} L${w} ${h - c}`} stroke="#FFF" strokeWidth={s} fill="none" strokeLinecap="round" />
        </Svg>
    );
}

// ─── Pantalla 6.3 · Foto-Test · Captura ──────────────────────────────────────
export default function PhotoTestCaptureScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const cameraRef = useRef(null);
    const [permission, requestPermission] = useCameraPermissions();
    const [flash, setFlash] = useState('off'); // 'off' | 'on'
    const [busy, setBusy] = useState(false);

    // Permiso aún cargando (primer render antes de que Expo resuelva)
    if (!permission) {
        return (
            <View style={[styles.container, styles.center]}>
                <StatusBar barStyle="light-content" backgroundColor="#000" />
                <ActivityIndicator color="#FFF" />
            </View>
        );
    }

    // Permiso denegado — estado informativo con CTA para reintentar
    if (!permission.granted) {
        return (
            <View style={[styles.container, styles.center]}>
                <StatusBar barStyle="light-content" backgroundColor="#000" />
                <Text style={styles.permTitle}>Necesitamos acceso a la cámara</Text>
                <Text style={styles.permDesc}>
                    Para capturar tus apuntes o preguntas y resolverlas con IA.
                </Text>
                <TouchableOpacity style={styles.permBtn} onPress={requestPermission} activeOpacity={0.85}>
                    <Text style={styles.permBtnText}>Permitir acceso</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.permCancel}>Volver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const takePhoto = async () => {
        if (!cameraRef.current || busy) return;
        setBusy(true);
        try {
            const photo = await cameraRef.current.takePictureAsync({ quality: 0.9, skipProcessing: false });
            // La validación real (foto legible / con texto) la hace el backend
            // con IA de visión, en 6.4 · Análisis. Aquí solo enviamos.
            navigation.navigate('PhotoTestAnalysis', { uri: photo.uri, source: 'camera' });
        } catch (err) {
            console.warn('takePictureAsync failed', err);
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
        });
        if (!result.canceled && result.assets?.[0]) {
            navigation.navigate('PhotoTestAnalysis', { uri: result.assets[0].uri, source: 'gallery' });
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                facing="back"
                flash={flash}
            />

            {/* Overlay oscuro con hueco central (marco de encuadre) */}
            <View style={styles.overlay} pointerEvents="none">
                <View style={styles.overlayTop} />
                <View style={styles.frameRow}>
                    <View style={styles.overlaySide} />
                    <View style={styles.frameBox}>
                        <FrameCorners w={FRAME_W} h={FRAME_H} />
                        <Text style={styles.frameHint}>Encuadra tu apunte o pregunta</Text>
                    </View>
                    <View style={styles.overlaySide} />
                </View>
                <View style={styles.overlayBottom} />
            </View>

            {/* Botón cerrar */}
            <TouchableOpacity
                style={[styles.closeBtn, { top: insets.top + 12 }]}
                onPress={() => navigation.goBack()}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
                <IconClose />
            </TouchableOpacity>

            {/* Controles inferiores: galería · disparador · flash */}
            <View style={[styles.controls, { paddingBottom: insets.bottom + 24 }]}>
                <TouchableOpacity style={styles.sideBtn} onPress={openGallery} activeOpacity={0.8}>
                    <IconImages />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.shutter, busy && { opacity: 0.7 }]}
                    onPress={takePhoto}
                    disabled={busy}
                    activeOpacity={0.85}
                >
                    <View style={styles.shutterInner}>
                        {busy && <ActivityIndicator color="#000" />}
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.sideBtn}
                    onPress={() => setFlash((f) => (f === 'off' ? 'on' : 'off'))}
                    activeOpacity={0.8}
                >
                    {flash === 'off' ? <IconFlashOff /> : <IconFlashOn />}
                </TouchableOpacity>
            </View>

        </View>
    );
}

const OVERLAY_BG = 'rgba(0,0,0,0.55)';
const FRAME_W = 280;
const FRAME_H = 280;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    center: { alignItems: 'center', justifyContent: 'center', padding: 32 },

    overlay: { ...StyleSheet.absoluteFillObject, flexDirection: 'column' },
    overlayTop: { flex: 1, backgroundColor: OVERLAY_BG },
    frameRow: { height: FRAME_H, flexDirection: 'row' },
    overlaySide: { flex: 1, backgroundColor: OVERLAY_BG },
    frameBox: { width: FRAME_W, height: FRAME_H, alignItems: 'center', justifyContent: 'center' },
    frameHint: {
        position: 'absolute',
        bottom: 10,
        color: '#FFF',
        fontSize: 11.5,
        fontWeight: '600',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        overflow: 'hidden',
    },
    overlayBottom: { flex: 1, backgroundColor: OVERLAY_BG },

    closeBtn: {
        position: 'absolute',
        left: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    controls: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingTop: 20,
        paddingHorizontal: 40,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    sideBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    shutter: {
        width: 74,
        height: 74,
        borderRadius: 37,
        backgroundColor: 'rgba(0,0,0,0.25)',
        borderWidth: 4,
        borderColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    shutterInner: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
    },

    permTitle: { color: '#FFF', fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
    permDesc: { color: '#9AA2B1', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
    permBtn: { backgroundColor: '#FF6B4A', paddingHorizontal: 24, paddingVertical: 13, borderRadius: 12, marginBottom: 16 },
    permBtnText: { color: '#FFF', fontSize: 13.5, fontWeight: '700' },
    permCancel: { color: '#9AA2B1', fontSize: 13, fontWeight: '600' },
});
