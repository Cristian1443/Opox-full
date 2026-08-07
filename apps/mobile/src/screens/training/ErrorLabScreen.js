import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import TrainingHeader from '../../components/TrainingHeader';
import { colors } from '../../theme';
import { trainingApi } from '../../api/training';

const COLORS = {
    purple: colors.textDark,
    gray: colors.textMuted,
    orange: colors.accentOrange,
    orangeTrack: 'rgba(246,150,36,0.15)',
    green: colors.ctaGreen,
    white: colors.white,
    border: 'rgba(65,41,80,0.3)',
};

// ─── Item de debilidad con expansión propia ──────────────────────────────────
function WeaknessItem({ item }) {
    const [open, setOpen] = useState(false);

    return (
        <View style={styles.itemWrapper}>
            <TouchableOpacity style={styles.itemHeader} onPress={() => setOpen((v) => !v)} activeOpacity={0.7}>
                <Ionicons
                    name={open ? 'chevron-down' : 'chevron-forward'}
                    size={16}
                    color={COLORS.orange}
                    style={{ marginRight: 6 }}
                />
                <Text style={styles.itemTitle} numberOfLines={1}>{item.topic}</Text>
                <Text style={styles.itemPct}>{item.domain}%</Text>
            </TouchableOpacity>

            {open && (
                <View style={styles.expandedCard}>
                    <View style={styles.warningRow}>
                        <Ionicons name="close-circle" size={18} color={COLORS.orange} />
                        <Text style={styles.warningText}>Patrón de fallo detectado</Text>
                    </View>

                    <Text style={styles.paragraph}>{item.description}</Text>
                    <Text style={[styles.paragraph, { marginTop: 8 }]}>
                        La IA ha preparado un test quirúrgico para eliminar esta debilidad.
                    </Text>

                    <View style={styles.dominioRow}>
                        <Text style={styles.dominioLabel}>Dominio actual del tema:</Text>
                        <Text style={styles.dominioValue}>{item.domain}%</Text>
                    </View>
                    <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${item.domain}%` }]} />
                    </View>
                </View>
            )}
        </View>
    );
}

function IconTargetBig({ color = colors.grayMid }) {
    return (
        <Ionicons name="locate-outline" size={48} color={color} />
    );
}

const MIN_QUESTIONS_FOR_PATTERNS = 30;

export default function ErrorLabScreen({ navigation }) {
    const [patterns, setPatterns] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        trainingApi.listErrorPatterns().then(({ data }) => {
            if (cancelled) return;
            setPatterns((data ?? []).map((p, i) => ({
                id: p.topicId,
                topicId: p.topicId,
                topic: p.topic,
                domain: p.domain,
                failRate: p.failRate,
                description: `Fallas el ${p.failRate}% de las preguntas sobre ${p.topic}.`,
                isPrimary: i === 0,
            })));
            setLoading(false);
        });
        return () => { cancelled = true; };
    }, []);

    const primary = patterns.find((p) => p.isPrimary);

    const startSurgical = () => {
        if (!primary) return;
        navigation.navigate('SurgicalTestPreview', {
            topicId: primary.topicId,
            topic: primary.topic,
            domain: primary.domain,
        });
    };

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

            <TrainingHeader title="Laboratorio de errores" onBack={() => navigation.goBack()} onSettings={() => navigation.navigate('Settings')} />

            {loading ? (
                <View style={styles.emptyWrap}>
                    <ActivityIndicator color={COLORS.orange} />
                </View>
            ) : patterns.length === 0 ? (
                <View style={styles.emptyWrap}>
                    <IconTargetBig />
                    <Text style={styles.emptyTitle}>Aún no hay patrones que atacar</Text>
                    <Text style={styles.emptyDesc}>
                        Necesitamos que hagas al menos {MIN_QUESTIONS_FOR_PATTERNS} preguntas para que
                        la IA detecte en qué temas fallas más.
                    </Text>
                    <TouchableOpacity
                        style={styles.emptyBtn}
                        onPress={() => navigation.navigate('GeneratorConfig')}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.emptyBtnText}>Hacer un test rápido</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.cabecera}>
                        <View style={styles.iconBox}>
                            <MaterialCommunityIcons name="microscope" size={30} color={COLORS.orange} />
                        </View>
                        <View style={styles.cabeceraTextBox}>
                            <Text style={styles.cabeceraTitle}>Laboratorio de errores</Text>
                            <Text style={styles.cabeceraSubtitle}>
                                Repaso quirúrgico de fallos y puntos débiles
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.sectionLabel}>DEBILIDADES</Text>

                    {patterns.map((item) => (
                        <WeaknessItem key={item.id} item={item} />
                    ))}

                    <TouchableOpacity style={styles.boton} activeOpacity={0.85} onPress={startSurgical}>
                        <Text style={styles.botonText}>Iniciar test quirúrgico</Text>
                    </TouchableOpacity>
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.white },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 40 },

    cabecera: {
        marginHorizontal: 25,
        marginTop: 18,
        minHeight: 111,
        backgroundColor: COLORS.white,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    iconBox: {
        width: 62,
        height: 62,
        borderRadius: 14,
        backgroundColor: 'rgba(246,150,36,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    cabeceraTextBox: { flex: 1 },
    cabeceraTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 18,
        color: COLORS.purple,
        marginBottom: 4,
    },
    cabeceraSubtitle: {
        fontFamily: 'Poppins-Regular',
        fontSize: 13,
        lineHeight: 17,
        color: COLORS.gray,
        opacity: 0.6,
    },

    sectionLabel: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: COLORS.purple,
        marginHorizontal: 25,
        marginTop: 24,
        marginBottom: 10,
    },

    itemWrapper: {
        marginHorizontal: 25,
        marginBottom: 10,
    },
    itemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    itemTitle: {
        flex: 1,
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
        color: COLORS.purple,
    },
    itemPct: {
        fontFamily: 'Poppins-Light',
        fontSize: 14,
        color: COLORS.purple,
    },

    expandedCard: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        padding: 16,
        marginTop: -1,
    },
    warningRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    warningText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        color: COLORS.purple,
        marginLeft: 6,
    },
    paragraph: {
        fontFamily: 'Poppins-Light',
        fontSize: 13,
        lineHeight: 18,
        color: COLORS.purple,
    },
    dominioRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginTop: 16,
        marginBottom: 6,
    },
    dominioLabel: {
        fontFamily: 'Poppins-Regular',
        fontSize: 12,
        color: COLORS.purple,
    },
    dominioValue: {
        fontFamily: 'Poppins-Light',
        fontSize: 16,
        color: COLORS.purple,
    },
    progressTrack: {
        height: 11,
        borderRadius: 6,
        backgroundColor: COLORS.orangeTrack,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 6,
        backgroundColor: COLORS.orange,
    },

    boton: {
        marginHorizontal: 37,
        marginTop: 24,
        height: 57,
        borderRadius: 14,
        backgroundColor: COLORS.green,
        alignItems: 'center',
        justifyContent: 'center',
    },
    botonText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: COLORS.white,
    },

    // ── Empty state ──────────────────────────────────
    emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
    emptyTitle: { fontSize: 15, fontFamily: 'Poppins-SemiBold', color: colors.textDark, marginTop: 14, marginBottom: 6 },
    emptyDesc: { fontSize: 12.5, fontFamily: 'Poppins-Regular', color: colors.textMuted, opacity: 0.6, textAlign: 'center', lineHeight: 18, marginBottom: 20 },
    emptyBtn: { backgroundColor: colors.ctaGreen, borderRadius: 12, paddingHorizontal: 22, paddingVertical: 12 },
    emptyBtnText: { color: colors.white, fontSize: 13.5, fontFamily: 'Poppins-SemiBold' },
});
