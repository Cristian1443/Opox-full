import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Image,
    Alert,
    ScrollView,
} from 'react-native';
import Text from '../../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { File as FSFile } from 'expo-file-system';
import { colors, spacing } from '../../theme';
import NotesFormatErrorModal from '../../components/NotesFormatErrorModal';
import { notesApi, authApi } from '../../api';

// Colores confirmados contra Figma (frame SUBIR APUNTES · selector, Bloque
// 9) sin equivalente exacto en theme.js.
const FIGMA = {
    cardBorder: 'rgba(65,41,80,0.3)',
};
const NOTES_ACCENT = colors.accentOrange;

// Formatos aceptados por la Factoría de Apuntes — el backend valida lo mismo.
// Incluimos HEIC/HEIF por defecto de iPhone y WEBP por Android moderno.
const ACCEPTED_MIME = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'application/pdf',
];

// Fallback por extensión cuando el sistema no devuelve mimeType.
const ACCEPTED_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.pdf'];

// Convierte ArrayBuffer a base64 en chunks para no reventar el stack con archivos grandes.
function bufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const CHUNK = 8192;
    for (let i = 0; i < bytes.length; i += CHUNK) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
    }
    return btoa(binary);
}


function extOf(name = '') {
    const idx = name.lastIndexOf('.');
    return idx >= 0 ? name.slice(idx).toLowerCase() : '';
}

function isAcceptedAsset(asset) {
    if (!asset) return false;
    if (asset.mimeType && ACCEPTED_MIME.includes(asset.mimeType.toLowerCase())) return true;
    return ACCEPTED_EXT.includes(extOf(asset.name ?? asset.uri ?? ''));
}

// ─── Iconos exactos exportados de Figma ────────────────────────────────────────
function CameraIcon({ height = 50, color = colors.accentOrange }) {
    return (
        <Svg width={(height * 98) / 87} height={height} viewBox="0 0 98 87" fill="none">
            <Path d="M48.62 32.4102C44.3451 32.4102 40.1662 33.6781 36.6121 36.0535C33.0579 38.4289 30.2881 41.8051 28.6531 45.755C27.018 49.7049 26.5913 54.0509 27.4267 58.2434C28.2622 62.4359 30.3223 66.2864 33.3465 69.3078C36.3707 72.3292 40.2231 74.3858 44.4164 75.2174C48.6096 76.0489 52.9553 75.6181 56.9037 73.9795C60.852 72.3408 64.2257 69.5678 66.5978 66.0115C68.9699 62.4551 70.234 58.2751 70.23 54.0002C70.2168 48.2747 67.9351 42.7879 63.8848 38.7413C59.8344 34.6946 54.3454 32.4181 48.62 32.4102ZM48.62 70.2302C45.4148 70.2302 42.2816 69.28 39.6163 67.4997C36.951 65.7194 34.8733 63.1889 33.6458 60.2281C32.4184 57.2672 32.0962 54.009 32.72 50.8651C33.3439 47.7212 34.8857 44.8328 37.1508 42.565C39.4158 40.2972 42.3022 38.7518 45.4454 38.1241C48.5885 37.4963 51.8471 37.8145 54.8095 39.0383C57.7718 40.2622 60.3048 42.3367 62.0884 44.9998C63.872 47.6629 64.8261 50.795 64.83 54.0002C64.83 58.3012 63.1228 62.4263 60.0834 65.4694C57.044 68.5126 52.921 70.2249 48.62 70.2302Z" fill={color} />
            <Path d="M24.3101 21.6099H13.5101C12.794 21.6099 12.1072 21.8943 11.6009 22.4007C11.0945 22.907 10.8101 23.5938 10.8101 24.3099C10.8101 25.0259 11.0945 25.7127 11.6009 26.2191C12.1072 26.7254 12.794 27.0099 13.5101 27.0099H24.3101C25.0261 27.0099 25.7129 26.7254 26.2192 26.2191C26.7256 25.7127 27.0101 25.0259 27.0101 24.3099C27.0101 23.5938 26.7256 22.907 26.2192 22.4007C25.7129 21.8943 25.0261 21.6099 24.3101 21.6099Z" fill={color} />
            <Path d="M89.13 10.8H75.13C74.4255 10.7905 73.7534 10.503 73.26 10L65.62 2.37003C64.0938 0.860478 62.0366 0.00957266 59.89 2.84795e-05H37.35C36.2857 -0.00280061 35.2314 0.205174 34.248 0.611949C33.2645 1.01872 32.3713 1.61625 31.62 2.37003L24 10C23.7495 10.2511 23.4517 10.4502 23.1239 10.5858C22.7961 10.7214 22.4447 10.7908 22.09 10.79H8.10001C7.03499 10.7913 5.98065 11.0024 4.9972 11.4112C4.01376 11.82 3.12045 12.4184 2.3683 13.1725C1.61614 13.9265 1.01987 14.8213 0.613515 15.8057C0.207163 16.7902 -0.00130786 17.845 6.17338e-06 18.91V78.33C6.17338e-06 80.4783 0.853397 82.5386 2.37244 84.0576C3.89149 85.5766 5.95175 86.43 8.10001 86.43H89.1C91.2492 86.43 93.3105 85.577 94.8311 84.0582C96.3517 82.5394 97.2074 80.4792 97.21 78.33V18.91C97.2074 16.7651 96.3562 14.7084 94.8424 13.1889C93.3285 11.6694 91.2749 10.8106 89.13 10.8ZM91.84 78.33C91.8295 79.0418 91.5394 79.7209 91.0323 80.2205C90.5252 80.7201 89.8419 81.0001 89.13 81H8.10001C7.74544 81 7.39434 80.9302 7.06676 80.7945C6.73918 80.6588 6.44154 80.4599 6.19082 80.2092C5.9401 79.9585 5.74122 79.6609 5.60553 79.3333C5.46984 79.0057 5.40001 78.6546 5.40001 78.3V18.91C5.40001 18.1939 5.68447 17.5072 6.19082 17.0008C6.69717 16.4945 7.38392 16.21 8.10001 16.21H22.1C23.1655 16.2149 24.2212 16.0069 25.2051 15.5982C26.1891 15.1895 27.0815 14.5883 27.83 13.83L35.47 6.19003C35.9785 5.68654 36.6644 5.40285 37.38 5.40003H59.89C60.6056 5.40285 61.2915 5.68654 61.8 6.19003L69.44 13.83C70.9603 15.3497 73.0205 16.2054 75.17 16.21H89.17C89.887 16.21 90.5748 16.4942 91.0827 17.0002C91.5907 17.5063 91.8774 18.193 91.88 18.91L91.84 78.33Z" fill={color} />
        </Svg>
    );
}

function PdfIcon({ height = 58, color = colors.accentOrange }) {
    return (
        <Svg width={(height * 88) / 115} height={height} viewBox="0 0 88 115" fill="none">
            <Path d="M54.8408 115H2.74497H0V112.266V2.74088V0H2.74497H85.0061H87.7511V2.74088V79.4051H82.2685V5.47445H5.48261V109.526H54.8408V115Z" fill={color} />
            <Path d="M57.6663 107.961V82.146H88L83.7618 86.7361L62.4242 109.811L57.6663 114.927V107.932V107.961ZM63.1489 87.6204V100.967L75.4902 87.6204H63.1489Z" fill={color} />
            <Path d="M68.5582 19.1641H16.4551V24.6385H68.5582V19.1641Z" fill={color} />
            <Path d="M68.5582 41.0693H16.4551V46.5438H68.5582V41.0693Z" fill={color} />
            <Path d="M68.5582 62.9746H16.4551V68.4491H68.5582V62.9746Z" fill={color} />
        </Svg>
    );
}

function GalleryIcon({ size = 50, color = colors.accentOrange }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 113 113" fill="none">
            <Path d="M103.581 113H9.41893C6.92161 112.998 4.52726 112.004 2.76139 110.239C0.995513 108.473 0.00239551 106.078 0 103.581L0 9.41893C0.00239551 6.92161 0.995513 4.52726 2.76139 2.76139C4.52726 0.995513 6.92161 0.00239551 9.41893 0L103.581 0C106.078 0.00239551 108.473 0.995513 110.239 2.76139C112.004 4.52726 112.998 6.92161 113 9.41893V103.581C112.998 106.078 112.004 108.473 110.239 110.239C108.473 112.004 106.078 112.998 103.581 113ZM9.41893 6.27929C8.58624 6.27929 7.78766 6.61007 7.19887 7.19887C6.61007 7.78766 6.27929 8.58624 6.27929 9.41893V103.581C6.27329 103.997 6.35007 104.41 6.50517 104.796C6.66026 105.183 6.89058 105.534 7.18272 105.83C7.47486 106.127 7.823 106.362 8.2069 106.523C8.5908 106.683 9.00279 106.766 9.41893 106.766H103.581C104.414 106.766 105.212 106.435 105.801 105.846C106.39 105.258 106.721 104.459 106.721 103.626V9.41893C106.721 8.58624 106.39 7.78766 105.801 7.19887C105.212 6.61007 104.414 6.27929 103.581 6.27929H9.41893Z" fill={color} />
            <Path d="M3.13966 91.0314C2.48148 91.0314 1.83993 90.8246 1.30571 90.4401C0.771479 90.0556 0.371587 89.513 0.162551 88.8889C-0.0464863 88.2648 -0.054096 87.5908 0.140797 86.9621C0.33569 86.3334 0.723229 85.7819 1.24864 85.3855L24.1581 68.1401C25.7905 66.9148 27.7765 66.2524 29.8176 66.2524C31.8587 66.2524 33.8446 66.9148 35.4771 68.1401L47.9542 77.5137C48.4988 77.9212 49.1606 78.1415 49.8407 78.1415C50.5208 78.1415 51.1827 77.9212 51.7272 77.5137L70.8456 63.1184C72.48 61.8938 74.4673 61.2319 76.5096 61.2319C78.5519 61.2319 80.5392 61.8938 82.1736 63.1184L111.751 85.3855C112.416 85.887 112.854 86.632 112.97 87.4567C113.085 88.2814 112.868 89.1181 112.367 89.7828C112.118 90.1119 111.808 90.3889 111.452 90.598C111.097 90.807 110.704 90.944 110.295 91.0011C109.471 91.1165 108.634 90.8996 107.969 90.398L78.4006 68.131C77.8553 67.7214 77.1916 67.4999 76.5096 67.4999C75.8275 67.4999 75.1639 67.7214 74.6186 68.131L55.4912 82.5263C53.8587 83.7516 51.8728 84.4139 49.8317 84.4139C47.7906 84.4139 45.8046 83.7516 44.1722 82.5263L31.6679 73.1526C31.1216 72.7493 30.4604 72.5316 29.7814 72.5316C29.1023 72.5316 28.4412 72.7493 27.8949 73.1526L5.03069 90.398C4.48562 90.8085 3.82198 91.0307 3.13966 91.0314Z" fill={color} />
            <Path d="M43.946 56.4955C40.2195 56.4973 36.5761 55.3938 33.4769 53.3246C30.3776 51.2553 27.9617 48.3133 26.5348 44.8708C25.1079 41.4283 24.7341 37.6399 25.4607 33.9848C26.1872 30.3298 27.9815 26.9724 30.6166 24.3373C33.2517 21.7022 36.6091 19.9079 40.2641 19.1814C43.9192 18.4548 47.7076 18.8286 51.1501 20.2555C54.5926 21.6824 57.5346 24.0983 59.6039 27.1976C61.6731 30.2968 62.7766 33.9402 62.7748 37.6667C62.7677 42.6582 60.7816 47.4433 57.2521 50.9728C53.7225 54.5023 48.9375 56.4884 43.946 56.4955ZM43.946 25.1082C41.4618 25.1064 39.0328 25.8414 36.9664 27.2203C34.9 28.5991 33.2889 30.5599 32.337 32.8545C31.3851 35.1491 31.1351 37.6745 31.6186 40.1112C32.1022 42.548 33.2975 44.7865 35.0535 46.5438C36.8095 48.301 39.0472 49.498 41.4836 49.9833C43.92 50.4686 46.4455 50.2205 48.7409 49.2702C51.0362 48.3199 52.9981 46.7103 54.3784 44.6448C55.7588 42.5794 56.4956 40.151 56.4956 37.6667C56.4908 34.339 55.1674 31.1489 52.8152 28.795C50.463 26.4411 47.2737 25.1153 43.946 25.1082Z" fill={color} />
        </Svg>
    );
}

const SOURCES = [
    { id: 'camera', title: 'Hacer fotos', desc: 'Fotografía tus apuntes en papel', Icon: CameraIcon },
    { id: 'pdf', title: 'Subir PDF', desc: 'Desde tus archivos o la nube', Icon: PdfIcon },
    { id: 'gallery', title: 'Desde galería', desc: 'Imágenes ya guardadas', Icon: GalleryIcon },
];

function SourceCard({ source, onPress }) {
    const { Icon } = source;
    return (
        <TouchableOpacity
            style={styles.card}
            onPress={onPress}
            activeOpacity={0.8}
            accessibilityLabel={source.title}
            accessibilityRole="button"
        >
            <Icon />
            <Text style={styles.cardTitle}>{source.title}</Text>
            <Text style={styles.cardDesc}>{source.desc}</Text>
        </TouchableOpacity>
    );
}

export default function NotesUploadScreen({ navigation }) {
    const [formatErrorVisible, setFormatErrorVisible] = useState(false);
    const [lastAttemptedSource, setLastAttemptedSource] = useState(null);
    const [oposicion, setOposicion] = useState('justicia-tramitacion');

    // Estado de la sesión de captura multipágina con cámara.
    const [captureMode, setCaptureMode] = useState(false);
    const [capturedPhotos, setCapturedPhotos] = useState([]);
    const [uploading, setUploading] = useState(false);

    // Carga la oposición del perfil del usuario para enviársela al backend.
    useEffect(() => {
        authApi.me()
            .then(({ data }) => { if (data?.oposicion) setOposicion(data.oposicion); })
            .catch(() => {});
    }, []);

    const startAnalysis = async (assets, kind) => {
        setUploading(true);
        try {
            // Los assets ya vienen con base64 (ImagePicker base64:true para fotos,
            // o campo base64 inyectado por el caso PDF vía DocumentPicker + FileSystem).
            const files = assets.map((a) => ({
                base64: a.base64,
                mimeType: a.mimeType ?? (kind === 'pdf' ? 'application/pdf' : 'image/jpeg'),
                sizeBytes: a.size ?? a.fileSize ?? Math.floor((a.base64?.length ?? 0) * 0.75),
            }));
            const rawName = assets[0]?.name ?? assets[0]?.fileName ?? '';
            const nameBase = rawName.replace(/\.[^.]+$/, '');
            // Android devuelve IDs numéricos (galería) o UUIDs (cámara) como nombre.
            const looksGenerated = !nameBase
                || /^\d+$/.test(nameBase)
                || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(nameBase);
            const ext = kind === 'pdf' ? '.pdf' : '.jpg';
            const dateStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
            const fileName = looksGenerated ? `Apunte ${dateStr}${ext}` : rawName;

            const res = await notesApi.upload({ oposicion, kind, fileName, files });
            if (res?.error || !res?.data?.noteId) {
                Alert.alert(
                    'Error al subir',
                    res?.error?.message ?? 'No se pudo conectar con el servidor. Revisa tu red.',
                );
                return;
            }
            setCaptureMode(false);
            setCapturedPhotos([]);
            navigation.navigate('NotesAnalysis', { noteId: res.data.noteId, pageCount: assets.length });
        } catch (err) {
            setCaptureMode(false);
            setCapturedPhotos([]);
            Alert.alert(
                'Error inesperado',
                err?.message ?? 'Ocurrió un error al preparar el archivo.',
            );
        } finally {
            setUploading(false);
        }
    };

    // Abre la cámara una sola vez y devuelve el asset, o null si se canceló/falló.
    const takeCameraPhoto = async () => {
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.85,
            base64: true,
        });
        if (result.canceled) return null;
        const asset = result.assets?.[0];
        if (!isAcceptedAsset(asset)) {
            setFormatErrorVisible(true);
            return null;
        }
        return asset;
    };

    const handleSource = async (id) => {
        setLastAttemptedSource(id);
        switch (id) {
            case 'camera': {
                const perm = await ImagePicker.requestCameraPermissionsAsync();
                if (!perm.granted) return;
                const asset = await takeCameraPhoto();
                if (!asset) return;
                // Entrar en sesión de captura multipágina con la primera foto.
                setCapturedPhotos([asset]);
                setCaptureMode(true);
                break;
            }

            case 'pdf': {
                const result = await DocumentPicker.getDocumentAsync({
                    type: '*/*',
                    copyToCacheDirectory: false,
                    multiple: false,
                });
                if (result.canceled) return;
                const asset = result.assets?.[0];
                if (!isAcceptedAsset(asset)) {
                    setFormatErrorVisible(true);
                    return;
                }
                // readAsStringAsync no soporta las URIs content:// de Android en SDK 57.
                // FSFile.arrayBuffer() usa ContentResolver nativamente y sí funciona.
                const arrayBuf = await new FSFile(asset.uri).arrayBuffer();
                const base64 = bufferToBase64(arrayBuf);
                startAnalysis([{ ...asset, base64 }], 'pdf');
                break;
            }

            case 'gallery': {
                const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (!perm.granted) return;
                const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsMultipleSelection: true,
                    selectionLimit: 20,
                    quality: 0.85,
                    base64: true,
                });
                if (result.canceled) return;
                const assets = result.assets ?? [];
                const anyInvalid = assets.some((a) => !isAcceptedAsset(a));
                if (anyInvalid) {
                    setFormatErrorVisible(true);
                    return;
                }
                startAnalysis(assets, 'photo');
                break;
            }
        }
    };

    const addCameraPage = async () => {
        const asset = await takeCameraPhoto();
        if (!asset) return;
        setCapturedPhotos((prev) => [...prev, asset]);
    };

    const cancelCapture = () => {
        const count = capturedPhotos.length;
        Alert.alert(
            'Descartar fotos',
            `Se perderán ${count} ${count === 1 ? 'foto capturada' : 'fotos capturadas'}. ¿Continuar?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Descartar',
                    style: 'destructive',
                    onPress: () => {
                        setCaptureMode(false);
                        setCapturedPhotos([]);
                    },
                },
            ],
        );
    };

    const retryFromError = () => {
        setFormatErrorVisible(false);
        if (lastAttemptedSource) handleSource(lastAttemptedSource);
    };

    // ─── Sesión de captura multipágina ───────────────────────────────────────────
    if (captureMode) {
        const count = capturedPhotos.length;
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <StatusBar barStyle="dark-content" backgroundColor={colors.card} />

                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <TouchableOpacity
                            onPress={cancelCapture}
                            style={styles.backBtn}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            accessibilityLabel="Descartar"
                        >
                            <Text style={styles.backChevron}>‹</Text>
                        </TouchableOpacity>
                        <Text style={styles.title}>
                            {count} {count === 1 ? 'foto capturada' : 'fotos capturadas'}
                        </Text>
                    </View>
                    <Text style={styles.subtitle}>
                        Revisa las páginas y añade más si necesitas.
                    </Text>
                </View>

                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.captureBody}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.captureGrid}>
                        {capturedPhotos.map((photo, idx) => (
                            <View key={idx} style={styles.captureThumbWrap}>
                                <Image source={{ uri: photo.uri }} style={styles.captureThumb} />
                                <View style={styles.capturePageBadge}>
                                    <Text style={styles.capturePageBadgeText}>{idx + 1}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </ScrollView>

                <View style={styles.captureActions}>
                    {count < 20 ? (
                        <TouchableOpacity
                            style={styles.addPageBtn}
                            onPress={addCameraPage}
                            activeOpacity={0.8}
                            accessibilityLabel="Añadir otra página"
                        >
                            <Ionicons name="camera-outline" size={20} color={NOTES_ACCENT} />
                            <Text style={styles.addPageText}>Añadir página</Text>
                        </TouchableOpacity>
                    ) : null}

                    <TouchableOpacity
                        style={[styles.doneBtn, uploading && styles.doneBtnDisabled]}
                        onPress={() => startAnalysis(capturedPhotos, 'photo')}
                        disabled={uploading}
                        activeOpacity={0.85}
                        accessibilityLabel={`Subir ${count} páginas`}
                    >
                        <Ionicons name="cloud-upload-outline" size={20} color={colors.white} />
                        <Text style={styles.doneBtnText}>
                            {uploading ? 'Subiendo…' : `Listo · ${count} ${count === 1 ? 'página' : 'páginas'}`}
                        </Text>
                    </TouchableOpacity>
                </View>

                <NotesFormatErrorModal
                    visible={formatErrorVisible}
                    onRetry={() => { setFormatErrorVisible(false); addCameraPage(); }}
                    onCancel={() => setFormatErrorVisible(false)}
                />
            </SafeAreaView>
        );
    }

    // ─── Selector de fuente (vista principal) ────────────────────────────────────
    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.card} />
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Volver"
                >
                    <Feather name="chevron-left" size={22} color={colors.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Subir apuntes</Text>
                <View style={styles.headerPlaceholder} />
            </View>

            <View style={styles.cardsWrap}>
                {SOURCES.map((s) => (
                    <SourceCard key={s.id} source={s} onPress={() => handleSource(s.id)} />
                ))}
            </View>

            <NotesFormatErrorModal
                visible={formatErrorVisible}
                onRetry={retryFromError}
                onCancel={() => setFormatErrorVisible(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 27.1,
        paddingTop: spacing.sm,
        paddingBottom: spacing.xl + spacing.md,
    },
    iconBtn: { width: 32, alignItems: 'center' },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(65, 41, 80, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerPlaceholder: { width: 44, height: 44 },
    headerTitle: {
        flex: 1,
        fontFamily: 'Poppins-SemiBold',
        fontSize: 21.3,
        color: colors.textDark,
        textAlign: 'center',
    },

    cardsWrap: {
        paddingHorizontal: 27.1,
        gap: 15,
    },
    card: {
        borderWidth: 0.32,
        borderColor: FIGMA.cardBorder,
        borderRadius: 10.7,
        alignItems: 'center',
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.lg,
    },
    cardTitle: {
        marginTop: 12,
        fontFamily: 'Poppins-SemiBold',
        fontSize: 21.3,
        color: colors.textDark,
        textAlign: 'center',
    },
    cardDesc: {
        marginTop: 4,
        fontFamily: 'Poppins-Regular',
        fontSize: 8.9,
        color: colors.textDark,
        textAlign: 'center',
    },

    // ─── Sesión de captura multipágina ───────────────────────────────────────
    captureBody: {
        padding: spacing.md,
        paddingTop: spacing.lg,
    },
    captureGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm + 2,
    },
    captureThumbWrap: {
        width: '31%',
        aspectRatio: 3 / 4,
        borderRadius: 10,
        overflow: 'hidden',
        backgroundColor: colors.separator,
    },
    captureThumb: {
        width: '100%',
        height: '100%',
    },
    capturePageBadge: {
        position: 'absolute',
        top: 5,
        left: 5,
        backgroundColor: 'rgba(0,0,0,0.55)',
        borderRadius: 9,
        minWidth: 20,
        height: 20,
        paddingHorizontal: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    capturePageBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },

    captureActions: {
        gap: spacing.sm,
        padding: spacing.md,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.separator,
        backgroundColor: colors.card,
    },
    addPageBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        borderWidth: 1.5,
        borderColor: NOTES_ACCENT,
        borderRadius: 12,
        paddingVertical: 13,
    },
    addPageText: {
        color: NOTES_ACCENT,
        fontSize: 15,
        fontWeight: '700',
    },
    doneBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        backgroundColor: NOTES_ACCENT,
        borderRadius: 12,
        paddingVertical: 16,
        shadowColor: NOTES_ACCENT,
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 4,
    },
    doneBtnDisabled: {
        backgroundColor: colors.grayMid,
        shadowOpacity: 0,
    },
    doneBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
    },
});
