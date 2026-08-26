import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Image,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { File as FSFile } from 'expo-file-system';
import { colors, spacing } from '../../theme';
import NotesFormatErrorModal from '../../components/NotesFormatErrorModal';
import { notesApi, authApi } from '../../api';

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

const NOTES_ACCENT = '#2563EB';

const SOURCES = [
    {
        id: 'camera',
        icon: 'camera-outline',
        title: 'Hacer fotos',
        desc: 'Fotografía tus apuntes en papel. Soporta multipágina.',
        color: '#10B981',
        bg: '#D1FAE5',
    },
    {
        id: 'pdf',
        icon: 'document-text-outline',
        title: 'Subir PDF',
        desc: 'Desde tus archivos locales o servicios en la nube.',
        color: '#EF4444',
        bg: '#FEE2E2',
    },
    {
        id: 'gallery',
        icon: 'images-outline',
        title: 'Desde galería',
        desc: 'Selecciona imágenes que ya tienes guardadas.',
        color: '#8B5CF6',
        bg: '#EDE9FE',
    },
];

function SourceCard({ source, onPress }) {
    return (
        <TouchableOpacity
            style={styles.card}
            onPress={onPress}
            activeOpacity={0.8}
            accessibilityLabel={source.title}
            accessibilityRole="button"
        >
            <View style={[styles.iconBox, { backgroundColor: source.bg }]}>
                <Ionicons name={source.icon} size={28} color={source.color} />
            </View>
            <View style={styles.cardTexts}>
                <Text style={styles.cardTitle}>{source.title}</Text>
                <Text style={styles.cardDesc}>{source.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
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
                <View style={styles.headerTop}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityLabel="Volver"
                    >
                        <Text style={styles.backChevron}>‹</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Subir apuntes</Text>
                </View>
                <Text style={styles.subtitle}>
                    Elige cómo quieres añadir tus apuntes al repositorio.
                </Text>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.body}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.list}>
                    {SOURCES.map((s) => (
                        <SourceCard
                            key={s.id}
                            source={s}
                            onPress={() => handleSource(s.id)}
                        />
                    ))}
                </View>
            </ScrollView>

            <View style={styles.infoFooter}>
                <Text style={styles.infoFooterText}>
                    A diferencia del Foto-Test, aquí puedes subir varios documentos para crear tu banco personal.
                </Text>
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
        backgroundColor: colors.card,
    },

    // Header
    header: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.separator,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    backBtn: {
        paddingRight: spacing.xs,
    },
    backChevron: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.primary,
        lineHeight: 32,
        marginRight: spacing.sm,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.dark,
        flex: 1,
    },
    subtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 20,
        marginLeft: 34,
    },

    // Cuerpo
    scroll: {
        flex: 1,
        backgroundColor: colors.background,
    },
    body: {
        padding: spacing.md,
        paddingTop: spacing.lg,
    },
    list: {
        gap: spacing.md,
    },

    // Card de fuente
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.separator,
        borderRadius: 16,
        padding: spacing.md + 4,
        shadowColor: '#000',
        shadowOpacity: 0.02,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
    },
    iconBox: {
        width: 56,
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    cardTexts: {
        flex: 1,
        marginRight: spacing.xs,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.dark,
        marginBottom: 3,
    },
    cardDesc: {
        fontSize: 13,
        color: colors.textSecondary,
        lineHeight: 18,
    },

    // Footer informativo
    infoFooter: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        backgroundColor: '#F9FAFB',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.separator,
    },
    infoFooterText: {
        fontSize: 12,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 18,
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
