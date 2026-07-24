import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView, ActivityIndicator } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import ScreenHeader from '../../components/ScreenHeader';
import { colors, spacing } from '../../theme';
import { trainingApi } from '../../api/training';

function getDomainColor(domain) {
    if (domain < 40) return colors.error;
    if (domain < 70) return colors.warning;
    return colors.success;
}

function IconChevronRight({ color = colors.textSecondary }) {
    return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path d="M9 6l6 6-6 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function IconChevronDown({ color = colors.purple }) {
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

// ─── Item de debilidad con expansión ─────────────────────────────────────────
function WeaknessItem({ item, expanded, onToggle, onStartSurgical }) {
    const domainColor = getDomainColor(item.domain);

    return (
        <View style={styles.weaknessWrapper}>
            <TouchableOpacity
                style={styles.weaknessRow}
                onPress={onToggle}
                activeOpacity={0.75}
            >
                <View style={styles.weaknessChevron}>
                    {expanded ? <IconChevronDown /> : <IconChevronRight />}
                </View>
                <Text style={[styles.weaknessTopic, expanded && { color: colors.purple }]}>
                    {item.topic}
                </Text>
                <Text style={[styles.weaknessDomain, { color: domainColor }]}>{item.domain}%</Text>
            </TouchableOpacity>

            {expanded && (
                <View style={styles.weaknessDetail}>
                    {/* Patrón detectado */}
                    <View style={styles.patternCard}>
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
                        <Text style={styles.domainLabel}>Dominio actual del tema</Text>
                        <View style={styles.progressTrack}>
                            <View style={[styles.progressFill, { width: `${item.domain}%`, backgroundColor: domainColor }]} />
                        </View>
                        <Text style={[styles.domainPct, { color: domainColor }]}>{item.domain}%</Text>
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
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

            <ScreenHeader title="Laboratorio de errores" onBack={() => navigation.goBack()} />

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
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    body: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg },

    groupTitle: {
        fontSize: 10.5,
        fontWeight: '700',
        color: colors.textSecondary,
        letterSpacing: 0.5,
        marginBottom: spacing.sm,
        marginTop: spacing.sm,
    },

    // ── Fila de debilidad ─────────────────────────────
    weaknessWrapper: {
        backgroundColor: colors.card,
        borderRadius: 12,
        marginBottom: 8,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    weaknessRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: 14,
    },
    weaknessChevron: { marginRight: 8, width: 18 },
    weaknessTopic: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.dark },
    weaknessDomain: { fontSize: 14, fontWeight: '800' },

    // ── Detalle expandido ─────────────────────────────
    weaknessDetail: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
    },
    patternCard: {
        backgroundColor: colors.grayLight,
        borderRadius: 10,
        padding: spacing.md,
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
    patternTitle: { fontSize: 13, fontWeight: '700', color: colors.error },
    patternDesc: { fontSize: 13, color: colors.dark, lineHeight: 19, marginBottom: 6 },
    patternNote: { fontSize: 12, color: colors.textSecondary, lineHeight: 17, marginBottom: spacing.sm },
    domainLabel: { fontSize: 11, color: colors.textSecondary, marginBottom: 6 },
    progressTrack: { height: 6, borderRadius: 3, backgroundColor: colors.separator, overflow: 'hidden', marginBottom: 4 },
    progressFill: { height: '100%', borderRadius: 3 },
    domainPct: { fontSize: 12, fontWeight: '700' },

    // ── Empty state ──────────────────────────────────
    emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
    emptyTitle: { fontSize: 15, fontWeight: '800', color: colors.dark, marginTop: 14, marginBottom: 6 },
    emptyDesc: { fontSize: 12.5, color: colors.textSecondary, textAlign: 'center', lineHeight: 18, marginBottom: 20 },
    emptyBtn: { backgroundColor: colors.success, borderRadius: 12, paddingHorizontal: 22, paddingVertical: 12 },
    emptyBtnText: { color: colors.white, fontSize: 13.5, fontWeight: '700' },

    // ── CTA fijo ────────────────────────────────────
    btnRow: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.lg,
        paddingTop: spacing.sm,
        backgroundColor: colors.background,
    },
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: colors.success,
        borderRadius: 14,
        paddingVertical: spacing.md,
    },
    btnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
