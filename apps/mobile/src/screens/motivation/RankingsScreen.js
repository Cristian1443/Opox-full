import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import DestacadoBanner from '../../components/DestacadoBanner';
import AvatarPlaceholder from '../../components/AvatarPlaceholder';
import { motivationApi } from '../../api';
import { colors, spacing } from '../../theme';

// Icono de chevron para el botón de volver (mismo patrón que MotivationHomeScreen.js / ClanDetailScreen.js).
// Figma: ~5.5x11dp dentro de un círculo de 24dp.
function IconChevronLeft({ size = 11, color = colors.textDark }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

const TABS = [
    { key: 'weekly', label: 'Semanal' },
    { key: 'global', label: 'Global' },
    { key: 'oposicion', label: 'Mi oposición' },
    { key: 'topic', label: 'Tema' },
];

// Icono de "sliders" (3 líneas horizontales con círculos) — Figma lo muestra a la
// izquierda de los tabs, no un embudo.
function IconFilter() {
    return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M3 6h10M17 6h4M3 12h4M11 12h10M3 18h13M20 18h1" stroke={colors.textDark} strokeWidth={1.6} strokeLinecap="round" />
            <Circle cx={13} cy={6} r={2} stroke={colors.textDark} strokeWidth={1.6} />
            <Circle cx={8} cy={12} r={2} stroke={colors.textDark} strokeWidth={1.6} />
            <Circle cx={16} cy={18} r={2} stroke={colors.textDark} strokeWidth={1.6} />
        </Svg>
    );
}

// Medalla/cinta con el puesto en un círculo debajo (Figma: top 3 llevan esta insignia
// naranja en vez de un número plano).
function IconMedal({ position }) {
    return (
        <View style={styles.medalWrap}>
            <Svg width={26} height={22} viewBox="0 0 24 20" fill="none">
                <Path d="M6 1h12v11l-6 4-6-4V1z" stroke={colors.accentOrange} strokeWidth={1.5} strokeLinejoin="round" />
                <Path d="M9 4v7M12 4v7M15 4v7" stroke={colors.accentOrange} strokeWidth={1.3} strokeLinecap="round" />
            </Svg>
            <View style={styles.medalCircle}>
                <Text style={styles.medalNumber}>{position}</Text>
            </View>
        </View>
    );
}

function RankRow({ entry, index, isMe }) {
    const position = entry.position ?? index + 1;
    return (
        <View style={[styles.row, !isMe && styles.rowSeparator, isMe && styles.rowMe]}>
            <View style={styles.posWrap}>
                {index >= 0 && index < 3 ? <IconMedal position={position} /> : <Text style={styles.pos}>{position}</Text>}
            </View>
            <AvatarPlaceholder size={25} />
            <Text style={styles.name} numberOfLines={1}>{isMe ? 'Tú' : (entry.displayName || 'Opositor')}</Text>
            <Text style={styles.score}>{entry.points.toLocaleString('es-ES')}</Text>
        </View>
    );
}

export default function RankingsScreen({ navigation }) {
    const [tab, setTab] = useState('weekly');
    const [ranking, setRanking] = useState(null);

    useEffect(() => {
        if (tab === 'topic') { setRanking(null); return; }
        let cancelled = false;
        motivationApi.getRanking(tab).then(({ data }) => { if (!cancelled && data) setRanking(data); });
        return () => { cancelled = true; };
    }, [tab]);

    const entries = ranking?.entries ?? [];
    const meInTop = entries.some((e) => ranking.me && e.userId === ranking.me.userId);

    // NOTA (gap de datos vs. Figma "DESTACADO"): RankingResultDTO solo expone `me.position`
    // (posición del usuario dentro del scope consultado) y `me.points`; no existe un campo
    // "globalRank"/"localRank" independiente del scope activo, ni esta pantalla llama a
    // motivationApi.getSummary() (de donde saldría `gamification.opopointsBalance`). Para no
    // inventar cifras: usamos los puntos del ranking como aproximación de opopoints, y solo
    // mostramos rango global/local cuando el scope correspondiente está efectivamente cargado.
    const opopoints = ranking?.me?.points ?? 0;
    const globalRank = tab === 'global' ? (ranking?.me?.position ?? '—') : '—';
    const localRank = tab === 'oposicion' ? (ranking?.me?.position ?? '—') : '—';

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.grayLight} />
            <View style={styles.statusBar}><Text style={styles.statusBarTime}>9:41</Text></View>

            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <IconChevronLeft />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Rankings</Text>
            </View>

            <View style={styles.tabs}>
                <View style={styles.filterIcon}><IconFilter /></View>
                {/* Fila de tabs con scroll horizontal: a fontSize 16dp (medida exacta de Figma),
                    las 4 pills + ícono de filtro no caben en una sola fila fija en todos los
                    anchos de pantalla — el scroll evita que desborde y rompa el layout. */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabsScroll}
                >
                    {TABS.map((t) => (
                        <TouchableOpacity
                            key={t.key}
                            style={[styles.tab, tab === t.key && styles.tabActive]}
                            onPress={() => setTab(t.key)}
                        >
                            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                <DestacadoBanner opopoints={opopoints} globalRank={globalRank} localRank={localRank} />

                {tab === 'topic' ? (
                    <Text style={styles.empty}>El ranking por tema llegará cuando existan estadísticas por tema (Bloque 6/7).</Text>
                ) : entries.length === 0 ? (
                    <Text style={styles.empty}>
                        {tab === 'oposicion' ? 'Configura tu oposición para ver este ranking.' : 'Aún no hay datos suficientes.'}
                    </Text>
                ) : (
                    <>
                        {entries.map((e, i) => (
                            <RankRow key={e.userId} entry={e} index={i} isMe={ranking?.me?.userId === e.userId} />
                        ))}
                        {ranking?.me && !meInTop && (
                            <>
                                <Text style={styles.ellipsis}>···</Text>
                                <RankRow entry={ranking.me} index={-1} isMe />
                            </>
                        )}
                    </>
                )}
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
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingTop: 6,
        paddingBottom: spacing.sm,
    },
    // Figma (2334:260): botón de volver = 24x24dp exacto (1dp = 2.25px de Figma).
    backBtn: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(65, 41, 80, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Figma (2334:262 "Rankings"): fontSize 21dp exacto.
    headerTitle: { fontSize: 21, fontWeight: '600', color: colors.textDark, letterSpacing: -0.3 },
    tabs: { flexDirection: 'row', alignItems: 'center', paddingLeft: 27, paddingBottom: 12 },
    tabsScroll: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingLeft: 7, paddingRight: 27 },
    tab: { paddingVertical: 6, paddingHorizontal: 11, borderRadius: 15, borderWidth: 1.5, borderColor: 'transparent' },
    // Figma: el tab activo es un pill de BORDE (no relleno)
    tabActive: { borderColor: colors.textDark, backgroundColor: colors.white },
    // Figma (2334:451/454/457 "Semanal"/"Global"/"Justicia"): fontSize 16dp exacto.
    tabText: { fontSize: 16, fontWeight: '500', color: colors.textMuted },
    tabTextActive: { fontWeight: '700', color: colors.textDark },
    filterIcon: { padding: 4 },
    scroll: { flex: 1 },
    // Figma: 27dp de padding horizontal (tarjetas de 348dp dentro de una pantalla de 402dp).
    body: { paddingHorizontal: 27, paddingBottom: 24 },
    empty: { textAlign: 'center', color: colors.textMuted, fontSize: 12.5, marginTop: 30 },
    // Figma (2337:1245 "1" — grupo de fila): 348dp de ancho x 44.5dp de alto.
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 3, paddingVertical: spacing.sm },
    rowSeparator: { borderBottomWidth: 1, borderBottomColor: 'rgba(65, 41, 80, 0.12)' },
    // Figma (2334:367 "TÚ", 2334:436 "BG ACTIVO"): la fila resaltada se extiende de
    // borde a borde de la pantalla (402dp), sin el padding lateral de las demás filas.
    rowMe: {
        backgroundColor: 'rgba(36, 189, 144, 0.25)',
        marginHorizontal: -27,
        paddingHorizontal: 27,
        marginVertical: 2,
    },
    posWrap: { width: 40, alignItems: 'center' },
    // Figma (2334:431 "22"): fontSize 18dp exacto para los puestos sin medalla.
    pos: { textAlign: 'center', fontWeight: '800', fontSize: 18, color: colors.textDark },
    medalWrap: { alignItems: 'center' },
    medalCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1.3,
        borderColor: colors.accentOrange,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -4,
    },
    medalNumber: { fontSize: 11, fontWeight: '800', color: colors.accentOrange },
    // Figma (2334:370 "Nombre Apellido", 2334:404 "2.200"): fontSize 16dp exacto para ambos.
    name: { fontSize: 16, fontWeight: '700', color: colors.textDark, flex: 1 },
    score: { fontSize: 16, fontWeight: '400', color: colors.textMuted, textAlign: 'right' },
    ellipsis: { textAlign: 'center', color: colors.textMuted, opacity: 0.5, fontSize: 14, marginVertical: 4 },
});
