import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing } from '../../theme';
import NotesFormatErrorModal from '../../components/NotesFormatErrorModal';
import { notesApi } from '../../api';
import * as FileSystem from 'expo-file-system';

// Colores confirmados contra Figma (frame SUBIR APUNTES · selector, Bloque
// 9) sin equivalente exacto en theme.js.
const FIGMA = {
    cardBorder: 'rgba(65,41,80,0.3)',
};

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

function extOf(name = '') {
    const idx = name.lastIndexOf('.');
    return idx >= 0 ? name.slice(idx).toLowerCase() : '';
}

function isAcceptedAsset(asset) {
    if (!asset) return false;
    if (asset.mimeType && ACCEPTED_MIME.includes(asset.mimeType.toLowerCase())) return true;
    // Fallback: aceptar por extensión.
    return ACCEPTED_EXT.includes(extOf(asset.name ?? asset.uri ?? ''));
}

// ─── Iconos (ver nota: en Figma los 3 están nombrados genéricamente "Capa_1") ──
function CameraIcon({ size = 38, color = colors.accentOrange }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 38 34">
            <Path
                d="M13 4L11 8H5C3.3 8 2 9.3 2 11V27C2 28.7 3.3 30 5 30H33C34.7 30 36 28.7 36 27V11C36 9.3 34.7 8 33 8H27L25 4H13Z"
                fill="none"
                stroke={color}
                strokeWidth={2.2}
                strokeLinejoin="round"
            />
            <Circle cx={19} cy={19} r={7} fill="none" stroke={color} strokeWidth={2.2} />
        </Svg>
    );
}

function PdfIcon({ size = 38, color = colors.accentOrange }) {
    return (
        <Svg width={size * 0.75} height={size} viewBox="0 0 30 40">
            <Path
                d="M4 2H18L26 10V36C26 37.1 25.1 38 24 38H4C2.9 38 2 37.1 2 36V4C2 2.9 2.9 2 4 2Z"
                fill="none"
                stroke={color}
                strokeWidth={2.2}
                strokeLinejoin="round"
            />
            <Path d="M18 2V10H26" fill="none" stroke={color} strokeWidth={2.2} strokeLinejoin="round" />
            <Rect x={7} y={19} width={16} height={2.2} rx={1.1} fill={color} />
            <Rect x={7} y={25} width={16} height={2.2} rx={1.1} fill={color} />
            <Rect x={7} y={31} width={10} height={2.2} rx={1.1} fill={color} />
        </Svg>
    );
}

function GalleryIcon({ size = 38, color = colors.accentOrange }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 38 34">
            <Rect x={2} y={2} width={34} height={30} rx={4} fill="none" stroke={color} strokeWidth={2.2} />
            <Circle cx={12} cy={12} r={3.2} fill="none" stroke={color} strokeWidth={2.2} />
            <Path d="M2 25L12 16L20 22L27 15L36 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
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
    // Estado del modal de error de formato. Se dispara cuando el fichero elegido no cumple ACCEPTED_MIME.
    const [formatErrorVisible, setFormatErrorVisible] = useState(false);
    const [lastAttemptedSource, setLastAttemptedSource] = useState(null);

    // Sube los assets al backend y arranca el análisis IA (9.3). Si el backend
    // aún no está disponible (sin Supabase configurado), navegamos igualmente al
    // análisis con noteId=null para que la pantalla siga siendo demostrable.
    const startAnalysis = async (assets, kind) => {
        try {
            const files = await Promise.all(assets.map(async (a) => {
                // Reutilizamos el base64 si expo-image-picker ya lo devolvió; si no,
                // lo leemos del URI con expo-file-system.
                const base64 = a.base64 ?? await FileSystem.readAsStringAsync(a.uri, {
                    encoding: FileSystem.EncodingType.Base64,
                });
                return {
                    base64,
                    mimeType: a.mimeType ?? (kind === 'pdf' ? 'application/pdf' : 'image/jpeg'),
                    sizeBytes: a.size ?? a.fileSize ?? Math.floor(base64.length * 0.75),
                };
            }));
            const fileName = assets[0]?.name ?? assets[0]?.fileName ?? `Apunte ${new Date().toISOString().slice(0, 10)}`;

            const res = await notesApi.upload({
                oposicion: 'justicia-tramitacion', // TODO: leer de la sesión del usuario
                kind,
                fileName,
                files,
            });
            const noteId = res?.data?.noteId ?? null;
            navigation.navigate('NotesAnalysis', {
                noteId,
                pageCount: assets.length,
            });
        } catch {
            // Fallback: seguimos al análisis con simulación local si upload falla.
            navigation.navigate('NotesAnalysis', {
                noteId: null,
                pageCount: assets.length,
            });
        }
    };

    const handleSource = async (id) => {
        setLastAttemptedSource(id);
        switch (id) {
            case 'camera': {
                // Captura simple con la cámara nativa. Multipágina real vendrá con
                // NotesCameraCaptureScreen (pantalla dedicada) cuando la diseñemos.
                const perm = await ImagePicker.requestCameraPermissionsAsync();
                if (!perm.granted) return;
                const result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    quality: 0.85,
                });
                if (result.canceled) return;
                const asset = result.assets?.[0];
                if (!isAcceptedAsset(asset)) {
                    setFormatErrorVisible(true);
                    return;
                }
                startAnalysis([asset], 'photo');
                break;
            }

            case 'pdf': {
                const result = await DocumentPicker.getDocumentAsync({
                    type: '*/*',
                    copyToCacheDirectory: true,
                    multiple: false,
                });
                if (result.canceled) return;
                const asset = result.assets?.[0];
                if (!isAcceptedAsset(asset)) {
                    setFormatErrorVisible(true);
                    return;
                }
                startAnalysis([asset], 'pdf');
                break;
            }

            case 'gallery': {
                // ImagePicker no devuelve mimeType siempre — validamos por extensión
                // del uri cuando falte.
                const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (!perm.granted) return;
                const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsMultipleSelection: true,
                    selectionLimit: 20,
                    quality: 0.85,
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

    // Al reintentar desde el modal, reabrimos el selector de la misma fuente que falló.
    const retryFromError = () => {
        setFormatErrorVisible(false);
        if (lastAttemptedSource) handleSource(lastAttemptedSource);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.iconBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Volver"
                >
                    <Ionicons name="chevron-back" size={24} color={colors.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Subir apuntes</Text>
                <View style={styles.iconBtn} />
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
});
