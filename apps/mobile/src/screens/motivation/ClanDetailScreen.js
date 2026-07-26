import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import AvatarPlaceholder from '../../components/AvatarPlaceholder';
import { motivationApi } from '../../api';
import { colors, spacing } from '../../theme';

// Figma (NAV 2334:669): chevron de 5.6x11.1dp exacto dentro de un círculo de 24dp.
function IconBack() {
    return (
        <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
            <Path d="M15 5l-7 7 7 7" stroke={colors.textDark} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

// Figma (ICONO CHAT 2336:849): ~22x20dp exacto.
function IconChat() {
    return (
        <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
            <Path d="M4 5h16v11H7l-3 3z" stroke={colors.accentOrange} strokeWidth={1.7} strokeLinejoin="round" />
        </Svg>
    );
}

// Figma (RETOS Vector 2337:1263): ~17x19dp exacto.
function IconFlag() {
    return (
        <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
            <Path d="M5 3v18M5 4h13l-3 4 3 4H5" stroke={colors.accentOrange} strokeWidth={1.7} strokeLinejoin="round" />
        </Svg>
    );
}

// DATA GAP: ClanDetailDTO (packages/types/src/motivation.ts) has no `challengeCount` field
// today, so the real count of open challenges for this clan cannot be fetched yet.
// Figma frame "CLAN - DETALLE" (node 2334:667) shows "Retos (3)" as its example value —
// hardcoded from the design until the backend exposes a real per-clan challenge count.
const FIGMA_CHALLENGE_COUNT = 3;

export default function ClanDetailScreen({ navigation, route }) {
    const { clanId } = route.params;
    const [detail, setDetail] = useState(null);

    const load = useCallback(() => {
        motivationApi.getClanDetail(clanId).then(({ data }) => { if (data) setDetail(data); });
    }, [clanId]);

    useEffect(() => { load(); }, [load]);

    const headerTitle = detail ? `${detail.name} Clan` : 'Clan';

    if (!detail) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor={colors.grayLight} />
                <View style={styles.statusBar}><Text style={styles.statusBarTime}>9:41</Text></View>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <IconBack />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle} numberOfLines={1}>{headerTitle}</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.grayLight} />
            <View style={styles.statusBar}><Text style={styles.statusBarTime}>9:41</Text></View>

            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <IconBack />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{headerTitle}</Text>
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                {/* Figma: nombre del clan va DENTRO de la tarjeta verde (morado oscuro sobre verde),
                    entre las iniciales y el puesto en el ranking — no como título aparte arriba. */}
                <View style={styles.summaryBox}>
                    <Text style={styles.summaryInitials}>{detail.initials}</Text>
                    <Text style={styles.summaryName}>{detail.name}</Text>
                    {detail.rankPosition && <Text style={styles.summaryCaption}>Puesto {detail.rankPosition} en el ranking de clanes</Text>}
                </View>

                <View style={styles.actionsRow}>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => navigation.navigate('ClanChat', { clanId })}
                        activeOpacity={0.85}
                    >
                        <IconChat />
                        <Text style={styles.actionBtnText}>Chat</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => navigation.navigate('Challenges', { clanId })}
                        activeOpacity={0.85}
                    >
                        <IconFlag />
                        <Text style={styles.actionBtnText}>Retos ({FIGMA_CHALLENGE_COUNT})</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.separator} />

                <Text style={styles.groupTitle}>MIEMBROS: {detail.memberCount}</Text>
                {detail.members.map((m, i) => (
                    <React.Fragment key={m.userId}>
                        <View style={styles.memberRow}>
                            <AvatarPlaceholder size={39} />
                            <View>
                                <Text style={styles.memberName}>{m.displayName || 'Opositor'}</Text>
                                <Text style={styles.memberCaption}>
                                    {m.role === 'leader' ? 'Líder · ' : ''}{m.points.toLocaleString('es-ES')} Opopoints
                                </Text>
                            </View>
                        </View>
                        {i < detail.members.length - 1 && <View style={styles.separator} />}
                    </React.Fragment>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.grayLight },
    statusBar: { height: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 16 },
    statusBarTime: { fontSize: 10, fontWeight: '700', color: colors.textDark, marginRight: 'auto' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: spacing.md,
        paddingTop: 6,
        paddingBottom: spacing.sm,
    },
    // Figma (NAV 2334:669 "Ellipse 352"): botón de volver = 24x24dp exacto.
    backBtn: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(65, 41, 80, 0.1)', // colors.textDark @ 10% opacity
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Figma (2334:672 "Opo Justicia Clan"): fontSize 21dp exacto (1dp = 2.25px de Figma).
    headerTitle: { fontSize: 21, fontWeight: '800', color: colors.textDark, letterSpacing: -0.2, flexShrink: 1 },
    scroll: { flex: 1 },
    body: { paddingHorizontal: 27, paddingBottom: spacing.lg },
    summaryBox: { backgroundColor: colors.ctaGreen, borderRadius: 14, alignItems: 'center', padding: spacing.lg, marginBottom: 11 },
    // Figma (2334:703 "OJ"): fontSize 57dp exacto.
    summaryInitials: { color: colors.white, fontWeight: '800', fontSize: 57, lineHeight: 64 },
    // Figma: el nombre del clan, dentro de la tarjeta verde, va en morado oscuro (no blanco).
    // Figma (2334:680 "Opo Justicia"): fontSize 16dp exacto.
    summaryName: { color: colors.textDark, fontWeight: '700', fontSize: 16, marginTop: spacing.xs },
    // Figma (2335:821 "Puesto 5..."): fontSize 9dp exacto.
    summaryCaption: { color: colors.white, fontSize: 9, fontWeight: '400', marginTop: spacing.xs },
    actionsRow: { flexDirection: 'row', gap: 8, marginBottom: 11 },
    // Figma (2337:1257/1265 "CHAT"/"RETOS"): 172.4x65.8dp exacto — paddingVertical calibrado
    // para alcanzar esa altura con el icono+texto reales.
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: colors.white,
        borderWidth: 1.5,
        borderColor: colors.textDark,
        borderRadius: 24,
        paddingVertical: 21,
    },
    // Figma (2335:842 "Chat", 2336:847 "Retos (3)"): fontSize 16dp exacto.
    actionBtnText: { color: colors.textDark, fontSize: 16, fontWeight: '600' },
    // Figma (2334:677 "MIEMBROS: 28"): fontSize 16dp exacto.
    groupTitle: { fontSize: 16, fontWeight: '700', color: colors.textDark, letterSpacing: 0.4, marginBottom: spacing.sm, marginTop: spacing.xs },
    separator: { height: 1, backgroundColor: colors.separator, marginVertical: spacing.xs },
    memberRow: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: spacing.sm },
    // Figma (2335:822/835 "Nombre Apellido"): fontSize 16dp exacto.
    memberName: { fontSize: 16, fontWeight: '700', color: colors.textDark },
    // Figma (2334:692 "Líder · 1.450 Opopoints"): fontSize 9dp exacto.
    memberCaption: { fontSize: 9, color: colors.textMuted },
});
