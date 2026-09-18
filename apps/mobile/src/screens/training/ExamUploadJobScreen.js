import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import Text from '../../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { trainingApi } from '../../api/training';

const COLORS = {
    purple: colors.textDark,
    orange: colors.accentOrange,
    green: colors.ctaGreen,
    white: colors.white,
    cardBorder: 'rgba(65,41,80,0.3)',
    successBg: 'rgba(63,178,96,0.08)',
    errorBg: 'rgba(214,69,80,0.08)',
    errorText: '#D64550',
};

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000; // 5 min

// Polling del job de incorporación al banco. Termina en:
// - done → tarjeta de éxito con detalle (guardadas / duplicadas / sin_tema…)
// - error → tarjeta roja con reintentar
// - timeout → tarjeta roja con reintentar (el Motor puede seguir trabajando en fondo)
export default function ExamUploadJobScreen({ navigation, route }) {
    const { jobId, titulo } = route.params ?? {};
    const [status, setStatus] = useState('pending');
    const [result, setResult] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const startedAt = useRef(Date.now());
    const cancelledRef = useRef(false);

    useEffect(() => {
        cancelledRef.current = false;
        let timer = null;

        const poll = async () => {
            if (cancelledRef.current) return;
            const { data, error } = await trainingApi.getBankExamJob(jobId);

            if (cancelledRef.current) return;

            if (error) {
                setStatus('error');
                setErrorMsg(error.code === 'MOTOR_UNAVAILABLE'
                    ? 'El servicio no está disponible ahora mismo.'
                    : (error.message || 'No pudimos consultar el estado del trabajo.'),
                );
                return;
            }

            if (!data) {
                setStatus('error');
                setErrorMsg('El servidor devolvió una respuesta vacía.');
                return;
            }

            if (data.status === 'done') {
                setStatus('done');
                setResult(data.result ?? {});
                return;
            }
            if (data.status === 'error') {
                setStatus('error');
                setErrorMsg(data.error || 'El trabajo falló en el Motor.');
                return;
            }

            setStatus(data.status);

            if (Date.now() - startedAt.current > POLL_TIMEOUT_MS) {
                setStatus('error');
                setErrorMsg('El trabajo está tardando más de lo esperado. Puede seguir procesándose en segundo plano — vuelve al banco más tarde.');
                return;
            }

            timer = setTimeout(poll, POLL_INTERVAL_MS);
        };

        poll();

        return () => {
            cancelledRef.current = true;
            if (timer) clearTimeout(timer);
        };
    }, [jobId]);

    const goBank = () => navigation.replace('OfficialMocks');
    const retry = () => navigation.replace('ExamUpload');

    // ─── Estados de UI ────────────────────────────────────────────────────────
    const isProcessing = status !== 'done' && status !== 'error';
    const yaIncorporado = result?.yaIncorporado === true;
    const sinTemaHigh = (result?.sinTema ?? 0) > 0
        && (result?.guardadas ?? 0) > 0
        && (result?.sinTema ?? 0) / (result?.guardadas ?? 1) > 0.5;
    // El Motor detectó 0 preguntas — casi siempre significa que el archivo NO era
    // un examen tipo test (era un texto de ley, un temario, un BOE consolidado…).
    // No mostrar checkmark verde porque el usuario cree que fue éxito.
    const noQuestionsDetected =
        status === 'done' && !yaIncorporado && (result?.extraidas ?? 0) === 0;

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

            <View style={styles.nav}>
                <TouchableOpacity style={styles.backBtn} onPress={goBank}>
                    <Ionicons name="chevron-back" size={24} color={COLORS.purple} />
                </TouchableOpacity>
                <View style={styles.navTitleWrap}>
                    <Text style={styles.navTitle}>{titulo || 'Procesando'}</Text>
                    <Text style={styles.navSubtitle}>Incorporación al banco</Text>
                </View>
                <View style={{ width: 44 }} />
            </View>

            <View style={styles.body}>
                {isProcessing ? (
                    <View style={styles.center}>
                        <ActivityIndicator color={COLORS.orange} size="large" />
                        <Text style={styles.processingTitle}>Procesando examen…</Text>
                        <Text style={styles.processingDesc}>
                            El Motor está leyendo el archivo, extrayendo las preguntas y clasificándolas
                            por tema. Suele tardar entre 30 y 90 segundos.
                        </Text>
                    </View>
                ) : status === 'error' ? (
                    <View style={styles.errorCard}>
                        <Ionicons name="alert-circle" size={44} color={COLORS.errorText} />
                        <Text style={styles.errorTitle}>No pudimos incorporar el examen</Text>
                        <Text style={styles.errorDesc}>{errorMsg || 'Ha ocurrido un error inesperado.'}</Text>
                        <TouchableOpacity style={styles.primaryBtn} onPress={retry} activeOpacity={0.85}>
                            <Text style={styles.primaryBtnLabel}>Reintentar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.secondaryBtn} onPress={goBank} activeOpacity={0.85}>
                            <Text style={styles.secondaryBtnLabel}>Volver al banco</Text>
                        </TouchableOpacity>
                    </View>
                ) : noQuestionsDetected ? (
                    <View style={styles.noQuestionsCard}>
                        <Ionicons name="document-text-outline" size={44} color={COLORS.orange} />
                        <Text style={styles.noQuestionsTitle}>No detectamos preguntas tipo test</Text>
                        <Text style={styles.noQuestionsDesc}>
                            El archivo que subiste no parece contener preguntas con opciones a/b/c/d.
                            Suele pasar cuando se sube un texto de ley, temario o BOE consolidado.
                        </Text>
                        <View style={styles.tipBlock}>
                            <Text style={styles.tipTitle}>Prueba con:</Text>
                            <Text style={styles.tipItem}>• Simulacros oficiales de convocatorias anteriores.</Text>
                            <Text style={styles.tipItem}>• Tests preparados por una academia o docente.</Text>
                            <Text style={styles.tipItem}>• Preguntas numeradas con al menos 3-4 opciones.</Text>
                        </View>
                        <TouchableOpacity style={styles.primaryBtn} onPress={retry} activeOpacity={0.85}>
                            <Text style={styles.primaryBtnLabel}>Subir otro archivo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.secondaryBtn} onPress={goBank} activeOpacity={0.85}>
                            <Text style={styles.secondaryBtnLabel}>Volver al banco</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.successCard}>
                        <Ionicons
                            name={yaIncorporado ? 'information-circle' : 'checkmark-circle'}
                            size={44}
                            color={yaIncorporado ? COLORS.orange : COLORS.green}
                        />
                        <Text style={styles.successTitle}>
                            {yaIncorporado
                                ? 'Este examen ya estaba en el banco'
                                : '¡Examen incorporado!'}
                        </Text>
                        {!yaIncorporado && (
                            <>
                                <Text style={styles.successDesc}>
                                    {typeof result?.guardadas === 'number' && typeof result?.extraidas === 'number'
                                        ? `Se guardaron ${result.guardadas} de ${result.extraidas} preguntas detectadas.`
                                        : 'Las preguntas se han añadido al banco del curso.'}
                                </Text>
                                {result && (result.duplicadas || result.descartadas) ? (
                                    <View style={styles.metricsRow}>
                                        {typeof result.duplicadas === 'number' && result.duplicadas > 0 && (
                                            <View style={styles.metric}>
                                                <Text style={styles.metricValue}>{result.duplicadas}</Text>
                                                <Text style={styles.metricLabel}>Duplicadas</Text>
                                            </View>
                                        )}
                                        {typeof result.descartadas === 'number' && result.descartadas > 0 && (
                                            <View style={styles.metric}>
                                                <Text style={styles.metricValue}>{result.descartadas}</Text>
                                                <Text style={styles.metricLabel}>Descartadas</Text>
                                            </View>
                                        )}
                                        {typeof result.sinTema === 'number' && result.sinTema > 0 && (
                                            <View style={styles.metric}>
                                                <Text style={styles.metricValue}>{result.sinTema}</Text>
                                                <Text style={styles.metricLabel}>Sin tema</Text>
                                            </View>
                                        )}
                                    </View>
                                ) : null}
                                {sinTemaHigh && (
                                    <Text style={styles.warnLine}>
                                        Muchas preguntas no encajan con el temario de este curso — revisa
                                        si el examen es de la oposición correcta.
                                    </Text>
                                )}
                                {result?.corte && (
                                    <Text style={styles.warnLine}>
                                        La extracción se paró por límite de coste ("{result.corte}") y el
                                        examen quedó a medias. Vuelve a subirlo para completarlo.
                                    </Text>
                                )}
                            </>
                        )}

                        <TouchableOpacity style={styles.primaryBtn} onPress={goBank} activeOpacity={0.85}>
                            <Text style={styles.primaryBtnLabel}>Ver banco</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
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
    navTitleWrap: { alignItems: 'center', flex: 1 },
    navTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: COLORS.purple,
        lineHeight: 20,
        textAlign: 'center',
    },
    navSubtitle: {
        fontFamily: 'Poppins-Light',
        fontSize: 12,
        color: COLORS.purple,
        lineHeight: 16,
    },

    body: {
        flex: 1,
        paddingHorizontal: 25,
        paddingBottom: 40,
        justifyContent: 'center',
    },

    center: { alignItems: 'center', gap: 16 },
    processingTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 18,
        color: COLORS.purple,
        marginTop: 4,
    },
    processingDesc: {
        fontFamily: 'Poppins-Regular',
        fontSize: 13,
        color: COLORS.purple,
        opacity: 0.7,
        textAlign: 'center',
        lineHeight: 19,
        paddingHorizontal: 20,
    },

    successCard: {
        alignItems: 'center',
        padding: 24,
        borderRadius: 18,
        backgroundColor: COLORS.successBg,
        borderWidth: 1,
        borderColor: 'rgba(63,178,96,0.25)',
        gap: 10,
    },
    successTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 18,
        color: COLORS.purple,
        marginTop: 8,
        textAlign: 'center',
    },
    successDesc: {
        fontFamily: 'Poppins-Regular',
        fontSize: 13,
        color: COLORS.purple,
        opacity: 0.75,
        textAlign: 'center',
        lineHeight: 19,
    },
    metricsRow: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 8,
        marginBottom: 4,
    },
    metric: { alignItems: 'center' },
    metricValue: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 20,
        color: COLORS.purple,
    },
    metricLabel: {
        fontFamily: 'Poppins-Regular',
        fontSize: 11,
        color: COLORS.purple,
        opacity: 0.7,
    },
    warnLine: {
        fontFamily: 'Poppins-Regular',
        fontSize: 12,
        color: COLORS.errorText,
        textAlign: 'center',
        marginTop: 4,
        lineHeight: 17,
    },

    errorCard: {
        alignItems: 'center',
        padding: 24,
        borderRadius: 18,
        backgroundColor: COLORS.errorBg,
        borderWidth: 1,
        borderColor: 'rgba(214,69,80,0.25)',
        gap: 10,
    },

    // Estado "0 preguntas detectadas" — naranja informativo, ni éxito ni error.
    noQuestionsCard: {
        alignItems: 'center',
        padding: 24,
        borderRadius: 18,
        backgroundColor: 'rgba(246,150,36,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(246,150,36,0.35)',
        gap: 10,
    },
    noQuestionsTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 17,
        color: COLORS.purple,
        marginTop: 8,
        textAlign: 'center',
    },
    noQuestionsDesc: {
        fontFamily: 'Poppins-Regular',
        fontSize: 13,
        color: COLORS.purple,
        opacity: 0.75,
        textAlign: 'center',
        lineHeight: 19,
    },
    tipBlock: {
        alignSelf: 'stretch',
        padding: 12,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderWidth: 1,
        borderColor: 'rgba(246,150,36,0.2)',
        marginTop: 6,
    },
    tipTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 12,
        color: COLORS.purple,
        marginBottom: 6,
    },
    tipItem: {
        fontFamily: 'Poppins-Regular',
        fontSize: 12,
        color: COLORS.purple,
        lineHeight: 18,
    },
    errorTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 17,
        color: COLORS.errorText,
        textAlign: 'center',
    },
    errorDesc: {
        fontFamily: 'Poppins-Regular',
        fontSize: 13,
        color: COLORS.purple,
        opacity: 0.75,
        textAlign: 'center',
        lineHeight: 19,
    },

    primaryBtn: {
        marginTop: 16,
        backgroundColor: COLORS.green,
        borderRadius: 30,
        paddingVertical: 14,
        paddingHorizontal: 32,
        alignSelf: 'stretch',
        alignItems: 'center',
    },
    primaryBtnLabel: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 15,
        color: COLORS.white,
    },
    secondaryBtn: {
        marginTop: 6,
        paddingVertical: 10,
        alignItems: 'center',
    },
    secondaryBtnLabel: {
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
        color: COLORS.purple,
        opacity: 0.7,
    },
});
