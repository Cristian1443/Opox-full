import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView, ActivityIndicator } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import TrainingHeader from '../../components/TrainingHeader';
import { colors, spacing } from '../../theme';
import { trainingApi } from '../../api/training';

function IconChevronRight({ color = colors.primary }) {
    return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path d="M9 6l6 6-6 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function IconChevronDown({ color = colors.primary }) {
    return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function IconTarget({ color = colors.white }) {
    return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.7} />
            <Circle cx={12} cy={12} r={5} stroke={color} strokeWidth={1.7} />
            <Circle cx={12} cy={12} r={1.5} fill={color} />
        </Svg>
    );
}

function IconTargetBig({ color = colors.grayMid }) {
    return (
        <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.5} />
            <Circle cx={12} cy={12} r={5} stroke={color} strokeWidth={1.5} />
            <Circle cx={12} cy={12} r={1.5} fill={color} />
        </Svg>
    );
}

function IconMicroscopeBig({ color = colors.primary }) {
    return (
        <Svg width={44} height={44} viewBox="0 0 24 24" fill="none">
            <Path d="M7 21h10M12 21v-4" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
            <Path d="M9 3h6v9H9z" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
            <Path d="M12 12v5" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
            <Path d="M7 17a5 5 0 0 1 10 0" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
            <Path d="M10 6h4" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
        </Svg>
    );
}

// ─── Item de debilidad con expansión ─────────────────────────────────────────
function WeaknessItem({ item, expanded, onToggle, onStartSurgical }) {
    return (
        <View style={[styles.weaknessWrapper, expanded && styles.weaknessWrapperExpanded]}>
            <TouchableOpacity
                style={styles.weaknessRow}
                onPress={onToggle}
                activeOpacity={0.75}
            >
                <View style={styles.weaknessChevron}>
                    {expanded ? <IconChevronDown /> : <IconChevronRight />}
                </View>
                <Text style={styles.weaknessTopic}>
                    {item.topic}
                </Text>
                <Text style={styles.weaknessDomain}>{item.domain}%</Text>
            </TouchableOpacity>

            {expanded && (
                <View style={styles.weaknessDetail}>
                    {/* Patrón detectado */}
                    <View style={styles.patternHeader}>
                        <View style={styles.patternIcon}>
                            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                                <Circle cx={12} cy={12} r={9} stroke={colors.error} strokeWidth={1.7} />
                                <Path d="M8 8l8 8M16 8l-8 8" stroke={colors.error} strokeWidth={1.7} strokeLinecap="round" />
                            </Svg>
                        </View>
                        <Text style={styles.patternTitle}>Patrón de fallo detectado</Text>
                    </View>
                    <Text style={styles.patternDesc}>{item.description}</Text>
                    <Text style={styles.patternNote}>
                        La IA ha preparado un test quirúrgico para eliminar esta debilidad.
                    </Text>

                    {/* Barra de dominio */}
                    <Text style={styles.domainLabel}>Dominio actual del tema:</Text>
                    <View style={styles.domainRow}>
                        <View style={styles.progressTrack}>
                            <View style={[styles.progressFill, { width: `${item.domain}%` }]} />
                        </View>
                        <Text style={styles.domainPct}>{item.domain}%</Text>
                    </View>
                </View>
            )}
        </View>
    );
}

const MIN_QUESTIONS_FOR_PATTERNS = 30;

export default function ErrorLabScreen({ navigation }) {
    const [patterns, setPatterns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);

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
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

            <TrainingHeader title="Laboratorio de errores" onBack={() => navigation.goBack()} onSettings={() => navigation.navigate('Settings')} />

            {loading ? (
                <View style={styles.emptyWrap}>
                    <ActivityIndicator color={colors.error} />
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
                <>
                    <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                        {/* Card hero: microscopio + título + descripción */}
                        <View style={styles.hero}>
                            <IconMicroscopeBig />
                            <View style={styles.heroText}>
                                <Text style={styles.heroTitle}>Laboratorio de errores</Text>
                                <Text style={styles.heroSub}>
                                    Repaso quirúrgico de fallos{'\n'}y puntos débiles
                                </Text>
                            </View>
                        </View>

                        <Text style={styles.groupTitle}>DEBILIDADES</Text>

                        {patterns.map((item) => (
                            <WeaknessItem
                                key={item.id}
                                item={item}
                                expanded={expandedId === item.id}
                                onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                                onStartSurgical={() => navigation.navigate('SurgicalTestPreview', {
                                    topicId: item.topicId,
                                    topic: item.topic,
                                    domain: item.domain,
                                })}
                            />
                        ))}

                        <View style={{ height: 100 }} />
                    </ScrollView>

                    <View style={styles.btnRow}>
                        <TouchableOpacity style={styles.btn} onPress={startSurgical} activeOpacity={0.85}>
                            <IconTarget />
                            <Text style={styles.btnText}>Iniciar test quirúrgico</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.white },
    scroll: { flex: 1 },
    body: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg },

    groupTitle: {
        fontSize: 16,
        fontFamily: 'Poppins-SemiBold',
        color: colors.textDark,
        marginBottom: spacing.sm,
        marginTop: spacing.md,
    },

    hero: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: '#F1F3F7',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 14,
        marginTop: 4,
    },
    heroText: { flex: 1 },
    heroTitle: { fontSize: 16, fontFamily: 'Poppins-SemiBold', color: colors.textDark, marginBottom: 3 },
    heroSub: { fontSize: 12, fontFamily: 'Poppins-Regular', color: colors.textMuted, opacity: 0.6, lineHeight: 16 },

    // ── Fila de debilidad ─────────────────────────────
    weaknessWrapper: {
        borderRadius: 12,
        marginBottom: 4,
    },
    weaknessWrapperExpanded: {
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: 'rgba(65, 41, 80, 0.15)',
        marginBottom: 8,
    },
    weaknessRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: 14,
    },
    weaknessChevron: { marginRight: 8, width: 18 },
    weaknessTopic: { flex: 1, fontSize: 14, fontFamily: 'Poppins-Medium', color: colors.textDark },
    weaknessDomain: { fontSize: 14, fontFamily: 'Poppins-Light', color: colors.textDark },

    // ── Detalle expandido ─────────────────────────────
    weaknessDetail: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
    },
    patternHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: spacing.sm,
    },
    patternIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.errorBg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    patternTitle: { fontSize: 13, fontFamily: 'Poppins-Regular', color: colors.textDark },
    patternDesc: { fontSize: 13, fontFamily: 'Poppins-Light', color: colors.textDark, lineHeight: 19, marginBottom: 6 },
    patternNote: { fontSize: 13, fontFamily: 'Poppins-Light', color: colors.textDark, lineHeight: 17, marginBottom: spacing.sm },
    domainLabel: { fontSize: 12, fontFamily: 'Poppins-Regular', color: colors.textDark, marginBottom: 6 },
    domainRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    progressTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: '#FDE7D8', overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3, backgroundColor: colors.primary },
    domainPct: { fontSize: 15, fontFamily: 'Poppins-Light', color: colors.textDark },

    // ── Empty state ──────────────────────────────────
    emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
    emptyTitle: { fontSize: 15, fontFamily: 'Poppins-SemiBold', color: colors.textDark, marginTop: 14, marginBottom: 6 },
    emptyDesc: { fontSize: 12.5, fontFamily: 'Poppins-Regular', color: colors.textMuted, opacity: 0.6, textAlign: 'center', lineHeight: 18, marginBottom: 20 },
    emptyBtn: { backgroundColor: colors.ctaGreen, borderRadius: 12, paddingHorizontal: 22, paddingVertical: 12 },
    emptyBtnText: { color: colors.white, fontSize: 13.5, fontFamily: 'Poppins-SemiBold' },

    // ── CTA fijo ────────────────────────────────────
    btnRow: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.lg,
        paddingTop: spacing.sm,
        backgroundColor: colors.white,
    },
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: colors.ctaGreen,
        borderRadius: 14,
        paddingVertical: spacing.md,
    },
    btnText: { color: colors.white, fontSize: 16, fontFamily: 'Poppins-SemiBold' },
});
