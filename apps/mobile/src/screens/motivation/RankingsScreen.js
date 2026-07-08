import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import ScreenHeader from '../../components/ScreenHeader';
import { motivationApi } from '../../api';

const TABS = [
    { key: 'weekly', label: 'Semanal' },
    { key: 'global', label: 'Global' },
    { key: 'oposicion', label: 'Mi oposición' },
    { key: 'topic', label: 'Tema' },
];

const MEDALS = ['🥇', '🥈', '🥉'];
const AVATAR_COLORS = ['#2D6FB0', '#7B4BC4', '#1f9d6b', '#E0552F', '#46506A'];

function initials(name) {
    if (!name) return '?';
    return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('');
}

function RankRow({ entry, index, isMe }) {
    return (
        <View style={[styles.row, isMe && styles.rowMe]}>
            <Text style={[styles.pos, isMe && { color: '#FF6B4A' }]}>{MEDALS[index] || entry.position}</Text>
            <View style={[styles.avatar, { backgroundColor: isMe ? '#1B2A4A' : AVATAR_COLORS[index % AVATAR_COLORS.length] }]}>
                <Text style={styles.avatarText}>{initials(entry.displayName)}</Text>
            </View>
            <Text style={styles.name} numberOfLines={1}>{isMe ? 'Tú' : (entry.displayName || 'Opositor')}</Text>
            <Text style={[styles.score, isMe && { color: '#FF6B4A' }]}>{entry.points.toLocaleString('es-ES')}</Text>
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

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F4F6FA" />
            <View style={styles.statusBar}><Text style={styles.statusBarTime}>9:41</Text></View>
            <ScreenHeader title="Rankings" onBack={() => navigation.goBack()} />

            <View style={styles.tabs}>
                {TABS.map((t) => (
                    <TouchableOpacity
                        key={t.key}
                        style={[styles.tab, tab === t.key && styles.tabActive]}
                        onPress={() => setTab(t.key)}
                    >
                        <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
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
    container: { flex: 1, backgroundColor: '#F4F6FA' },
    statusBar: { height: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 16 },
    statusBarTime: { fontSize: 10, fontWeight: '700', color: '#1B2A4A', marginRight: 'auto' },
    tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingHorizontal: 16, paddingBottom: 10 },
    tab: { backgroundColor: '#F0F2F7', borderRadius: 15, paddingVertical: 6, paddingHorizontal: 11 },
    tabActive: { backgroundColor: '#1B2A4A' },
    tabText: { fontSize: 10.5, fontWeight: '700', color: '#7A8290' },
    tabTextActive: { color: '#fff' },
    scroll: { flex: 1 },
    body: { paddingHorizontal: 16, paddingBottom: 24 },
    empty: { textAlign: 'center', color: '#8A92A0', fontSize: 12.5, marginTop: 30 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 10, borderRadius: 12, marginBottom: 7, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#EEF1F7' },
    rowMe: { borderColor: '#FF6B4A', backgroundColor: '#FFF6F3' },
    pos: { width: 22, textAlign: 'center', fontWeight: '800', fontSize: 13, color: '#8A92A0' },
    avatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    name: { fontSize: 12, fontWeight: '700', color: '#1B2A4A', flex: 1 },
    score: { fontSize: 12, fontWeight: '800', color: '#1B2A4A' },
    ellipsis: { textAlign: 'center', color: '#C4CBD6', fontSize: 14, marginVertical: 4 },
});
