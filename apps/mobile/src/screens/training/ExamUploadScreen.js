import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    TextInput,
    Alert,
    ScrollView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import Text from '../../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { File as FSFile } from 'expo-file-system';
import { colors } from '../../theme';
import { trainingApi } from '../../api/training';

// ─── Constantes ──────────────────────────────────────────────────────────────

const COLORS = {
    purple: colors.textDark,
    orange: colors.accentOrange,
    green: colors.ctaGreen,
    white: colors.white,
    cardBorder: 'rgba(65,41,80,0.3)',
    fieldBg: '#F6F5F8',
    error: '#D64550',
};

const ACCEPTED_MIME = new Set([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
]);

// El usuario elige entre 'profesor' y 'otro'. 'oficial' queda reservado al equipo.
const SOURCE_OPTIONS = [
    {
        key: 'profesor',
        label: 'De profesor',
        desc: 'Material de una academia, un docente o preparador oficial.',
    },
    {
        key: 'otro',
        label: 'Otro',
        desc: 'Simulacro personal, apuntes propios u otras fuentes.',
    },
];

const MAX_FILE_BYTES = 20 * 1024 * 1024;

// Chunks para evitar reventar el stack con archivos grandes.
function bufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const CHUNK = 8192;
    for (let i = 0; i < bytes.length; i += CHUNK) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
    }
    return btoa(binary);
}

function humanSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// El picker no siempre trae mimeType — completar por extensión para PDF/DOCX.
function inferMimeType(asset) {
    if (asset?.mimeType && ACCEPTED_MIME.has(asset.mimeType)) return asset.mimeType;
    const name = String(asset?.name ?? asset?.uri ?? '').toLowerCase();
    if (name.endsWith('.pdf')) return 'application/pdf';
    if (name.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (name.endsWith('.doc')) return 'application/msword';
    return asset?.mimeType ?? '';
}

// ─── Pantalla ────────────────────────────────────────────────────────────────

export default function ExamUploadScreen({ navigation }) {
    const [titulo, setTitulo] = useState('');
    const [anio, setAnio] = useState('');
    const [fuente, setFuente] = useState('profesor');
    const [asset, setAsset] = useState(null); // { name, size, mimeType, base64 }
    const [uploading, setUploading] = useState(false);
    const [reading, setReading] = useState(false);

    const pickFile = async () => {
        try {
            const res = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
                // false replica el patrón de NotesUploadScreen (Bloque 9) que sí
                // funciona en SDK 57. Con true el picker devuelve un URI de cache
                // que en algunos dispositivos pierde permisos entre pick y read.
                copyToCacheDirectory: false,
                multiple: false,
            });
            if (res.canceled || !res.assets?.length) return;
            const picked = res.assets[0];
            const mimeType = inferMimeType(picked);
            if (!ACCEPTED_MIME.has(mimeType)) {
                Alert.alert('Formato no soportado', 'Solo se aceptan archivos PDF o Word (.pdf / .docx).');
                return;
            }
            if (picked.size && picked.size > MAX_FILE_BYTES) {
                Alert.alert(
                    'Archivo demasiado grande',
                    `El archivo supera el límite de ${Math.floor(MAX_FILE_BYTES / (1024 * 1024))} MB.`,
                );
                return;
            }
            // Leer el arrayBuffer INMEDIATAMENTE tras el pick — mismo patrón que
            // NotesUploadScreen. Si se lee más tarde (en handleUpload), el URI
            // content:// puede haber perdido permisos de lectura por hot reload,
            // reciclaje de cache o simplemente por el paso del tiempo → error
            // "Missing 'READ' permission for accessing the file".
            setReading(true);
            try {
                const buf = await new FSFile(picked.uri).arrayBuffer();
                const base64 = bufferToBase64(buf);
                setAsset({
                    name: picked.name || `examen.${mimeType === 'application/pdf' ? 'pdf' : 'docx'}`,
                    size: picked.size ?? 0,
                    mimeType,
                    base64,
                });
            } finally {
                setReading(false);
            }
        } catch (err) {
            setReading(false);
            Alert.alert('Error', err?.message || 'No se pudo abrir el archivo.');
        }
    };

    const canSubmit =
        !uploading &&
        !reading &&
        titulo.trim().length >= 1 &&
        /^\d{4}$/.test(anio) &&
        Number(anio) >= 1900 && Number(anio) <= 2100 &&
        !!asset?.base64;

    const handleUpload = async () => {
        if (!canSubmit) return;
        setUploading(true);
        try {
            // El base64 ya se leyó en pickFile — aquí solo lo enviamos.
            const { data, error } = await trainingApi.uploadBankExam({
                titulo: titulo.trim(),
                anio: Number(anio),
                fuente,
                file: {
                    base64: asset.base64,
                    mimeType: asset.mimeType,
                    fileName: asset.name,
                },
            });

            if (error) {
                const code = error.code || '';
                if (code === 'MOTOR_UNAVAILABLE') {
                    Alert.alert('Servicio no disponible', 'El banco de exámenes no está operativo ahora mismo. Inténtalo más tarde.');
                } else if (code.startsWith('bank_exam/')) {
                    Alert.alert('No se pudo subir', error.message || 'Revisa el archivo y los datos e inténtalo de nuevo.');
                } else {
                    Alert.alert('Error al subir', error.message || 'Ha ocurrido un error inesperado.');
                }
                setUploading(false);
                return;
            }

            const jobId = data?.jobId;
            if (!jobId) {
                Alert.alert('Error', 'El servidor no devolvió un identificador de trabajo.');
                setUploading(false);
                return;
            }

            navigation.replace('ExamUploadJob', { jobId, titulo: titulo.trim() });
        } catch (err) {
            setUploading(false);
            Alert.alert('Error', err?.message || 'No se pudo leer el archivo.');
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <View style={styles.nav}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={24} color={COLORS.purple} />
                    </TouchableOpacity>
                    <View style={styles.navTitleWrap}>
                        <Text style={styles.navTitle}>Subir examen</Text>
                        <Text style={styles.navSubtitle}>Al banco del curso</Text>
                    </View>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.intro}>
                        Sube un examen en PDF o Word (.docx). El sistema extrae las preguntas y las
                        añade al banco del curso. Todos los usuarios podrán practicar con ellas.
                    </Text>

                    {/* Bloque preventivo — evita que el usuario suba textos de leyes/temario
                        y luego vea "0 preguntas detectadas" sin entender por qué. */}
                    <View style={styles.formatCard}>
                        <View style={styles.formatHeader}>
                            <Ionicons name="information-circle" size={18} color={COLORS.orange} />
                            <Text style={styles.formatTitle}>Qué debe contener el archivo</Text>
                        </View>
                        <View style={styles.formatRow}>
                            <Text style={styles.formatCheck}>✅</Text>
                            <Text style={styles.formatText}>
                                Examen tipo test con preguntas numeradas y opciones a/b/c/d.
                            </Text>
                        </View>
                        <View style={styles.formatRow}>
                            <Text style={styles.formatCheck}>✅</Text>
                            <Text style={styles.formatText}>
                                Simulacros oficiales de convocatorias anteriores o test de academia.
                            </Text>
                        </View>
                        <View style={styles.formatRow}>
                            <Text style={styles.formatCross}>❌</Text>
                            <Text style={styles.formatText}>
                                Textos de leyes, BOE consolidado, temario o apuntes — el sistema no puede
                                convertirlos en preguntas automáticamente.
                            </Text>
                        </View>
                    </View>

                    {/* Título */}
                    <Text style={styles.fieldLabel}>Título del examen</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej. Simulacro Test Unitaria 2024"
                        placeholderTextColor="#B0AAB8"
                        value={titulo}
                        onChangeText={setTitulo}
                        maxLength={120}
                    />

                    {/* Año */}
                    <Text style={styles.fieldLabel}>Año</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej. 2024"
                        placeholderTextColor="#B0AAB8"
                        value={anio}
                        onChangeText={(v) => setAnio(v.replace(/[^0-9]/g, '').slice(0, 4))}
                        keyboardType="numeric"
                        maxLength={4}
                    />

                    {/* Procedencia */}
                    <Text style={styles.fieldLabel}>Procedencia</Text>
                    {SOURCE_OPTIONS.map((opt) => {
                        const active = fuente === opt.key;
                        return (
                            <TouchableOpacity
                                key={opt.key}
                                onPress={() => setFuente(opt.key)}
                                style={[styles.radioRow, active && styles.radioRowActive]}
                                activeOpacity={0.85}
                            >
                                <View style={[styles.radioOuter, active && styles.radioOuterActive]}>
                                    {active && <View style={styles.radioDot} />}
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.radioLabel}>{opt.label}</Text>
                                    <Text style={styles.radioDesc}>{opt.desc}</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                    <Text style={styles.hint}>
                        La procedencia "Oficial" está reservada al equipo. Si has descargado el
                        examen de la Junta u organismo, marca "De profesor" para que se distinga.
                    </Text>

                    {/* Archivo */}
                    <Text style={styles.fieldLabel}>Archivo</Text>
                    <TouchableOpacity
                        style={styles.pickBtn}
                        onPress={pickFile}
                        activeOpacity={0.85}
                        disabled={reading}
                    >
                        {reading ? (
                            <ActivityIndicator size="small" color={COLORS.purple} />
                        ) : (
                            <Ionicons name="document-attach-outline" size={22} color={COLORS.purple} />
                        )}
                        <Text style={styles.pickBtnLabel}>
                            {reading ? 'Leyendo archivo…' : asset ? 'Cambiar archivo' : 'Seleccionar PDF o Word'}
                        </Text>
                    </TouchableOpacity>
                    {asset && (
                        <View style={styles.fileCard}>
                            <Ionicons name="document" size={20} color={COLORS.orange} style={{ marginRight: 8 }} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.fileName} numberOfLines={1}>{asset.name}</Text>
                                <Text style={styles.fileMeta}>
                                    {asset.mimeType === 'application/pdf' ? 'PDF' : 'Word'}
                                    {asset.size ? ` · ${humanSize(asset.size)}` : ''}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setAsset(null)}>
                                <Ionicons name="close-circle" size={22} color={COLORS.purple} />
                            </TouchableOpacity>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.submit, !canSubmit && styles.submitDisabled]}
                        onPress={handleUpload}
                        disabled={!canSubmit}
                        activeOpacity={0.85}
                    >
                        {uploading ? (
                            <ActivityIndicator color={COLORS.white} />
                        ) : (
                            <Text style={styles.submitLabel}>Subir examen</Text>
                        )}
                    </TouchableOpacity>
                    <Text style={styles.footHint}>
                        Máximo {Math.floor(MAX_FILE_BYTES / (1024 * 1024))} MB · La extracción puede
                        tardar entre 30 y 90 segundos.
                    </Text>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.white },
    nav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 44,
        marginTop: 8,
        marginHorizontal: 25,
        marginBottom: 8,
    },
    backBtn: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: '#F0F0F2',
        alignItems: 'center', justifyContent: 'center',
    },
    navTitleWrap: { alignItems: 'center' },
    navTitle: {
        fontFamily: 'Poppins-SemiBold', fontSize: 18, color: COLORS.purple, lineHeight: 22,
    },
    navSubtitle: {
        fontFamily: 'Poppins-Light', fontSize: 14, color: COLORS.purple, lineHeight: 18,
    },

    scroll: { paddingHorizontal: 25, paddingTop: 8, paddingBottom: 40 },

    intro: {
        fontFamily: 'Poppins-Regular',
        fontSize: 13,
        color: COLORS.purple,
        opacity: 0.75,
        lineHeight: 19,
        marginBottom: 12,
    },

    formatCard: {
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(246,150,36,0.35)',
        backgroundColor: 'rgba(246,150,36,0.08)',
        marginBottom: 16,
        gap: 8,
    },
    formatHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 2,
    },
    formatTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 13,
        color: COLORS.purple,
    },
    formatRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    formatCheck: {
        fontSize: 13,
        marginTop: 1,
    },
    formatCross: {
        fontSize: 13,
        marginTop: 1,
    },
    formatText: {
        flex: 1,
        fontFamily: 'Poppins-Regular',
        fontSize: 12,
        lineHeight: 17,
        color: COLORS.purple,
    },

    fieldLabel: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 14,
        color: COLORS.purple,
        marginTop: 12,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        color: COLORS.purple,
        backgroundColor: COLORS.fieldBg,
    },
    hint: {
        fontFamily: 'Poppins-Light',
        fontSize: 12,
        color: COLORS.purple,
        opacity: 0.65,
        marginTop: 4,
        lineHeight: 16,
    },

    radioRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        borderRadius: 12,
        marginBottom: 10,
        gap: 12,
    },
    radioRowActive: {
        borderColor: COLORS.orange,
        backgroundColor: 'rgba(246,150,36,0.08)',
    },
    radioOuter: {
        width: 22, height: 22, borderRadius: 11,
        borderWidth: 2, borderColor: COLORS.cardBorder,
        alignItems: 'center', justifyContent: 'center',
    },
    radioOuterActive: { borderColor: COLORS.orange },
    radioDot: {
        width: 12, height: 12, borderRadius: 6,
        backgroundColor: COLORS.orange,
    },
    radioLabel: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 14,
        color: COLORS.purple,
    },
    radioDesc: {
        fontFamily: 'Poppins-Light',
        fontSize: 12,
        color: COLORS.purple,
        opacity: 0.7,
        marginTop: 2,
    },

    pickBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: COLORS.cardBorder,
        backgroundColor: COLORS.fieldBg,
    },
    pickBtnLabel: {
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
        color: COLORS.purple,
    },
    fileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        padding: 12,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        borderRadius: 12,
        backgroundColor: COLORS.white,
    },
    fileName: {
        fontFamily: 'Poppins-Medium', fontSize: 13, color: COLORS.purple,
    },
    fileMeta: {
        fontFamily: 'Poppins-Light', fontSize: 11, color: COLORS.purple, opacity: 0.6, marginTop: 2,
    },

    submit: {
        marginTop: 24,
        backgroundColor: COLORS.green,
        borderRadius: 30,
        paddingVertical: 16,
        alignItems: 'center',
    },
    submitDisabled: {
        opacity: 0.5,
    },
    submitLabel: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 15,
        color: COLORS.white,
    },
    footHint: {
        marginTop: 12,
        textAlign: 'center',
        fontFamily: 'Poppins-Light',
        fontSize: 11,
        color: COLORS.purple,
        opacity: 0.6,
    },
});
