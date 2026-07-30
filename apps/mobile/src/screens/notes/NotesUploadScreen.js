import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing } from '../../theme';
import NotesFormatErrorModal from '../../components/NotesFormatErrorModal';
import { notesApi } from '../../api';
import * as FileSystem from 'expo-file-system';

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

const NOTES_ACCENT = '#2563EB';

// Cada opción tiene su color propio — mismo criterio del selector del Bloque 6 (Foto-Test hub).
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
            <StatusBar barStyle="dark-content" backgroundColor={colors.card} />

            {/* Header con chevron + título alineado a la izquierda + subtítulo debajo */}
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

    // Card
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
});
