import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import ScreenHeader from '../../components/ScreenHeader';
import { motivationApi } from '../../api';

function IconChat() {
    return (
        <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
            <Path d="M4 5h16v11H7l-3 3z" stroke="#fff" strokeWidth={1.7} strokeLinejoin="round" />
        </Svg>
    );
}

const AVATAR_COLORS = ['#2D6FB0', '#E0552F', '#1B2A4A', '#7B4BC4', '#1f9d6b'];

function initials(name) {
    if (!name) return '?';
    return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('');
}

export default function ClanDetailScreen({ navigation, route }) {
    const { clanId } = route.params;
    const [detail, setDetail] = useState(null);

    const load = useCallback(() => {
        motivationApi.getClanDetail(clanId).then(({ data }) => { if (data) setDetail(data); });
    }, [clanId]);

    useEffect(() => { load(); }, [load]);

    if (!detail) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#F4F6FA" />
                <View style={styles.statusBar}><Text style={styles.statusBarTime}>9:41</Text></View>
                <ScreenHeader title="Clan" onBack={() => navigation.goBack()} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F4F6FA" />
            <View style={styles.statusBar}><Text style={styles.statusBarTime}>9:41</Text></View>
            <ScreenHeader title={detail.name} onBack={() => navigation.goBack()} dark />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                <View style={styles.hero}>
                    <View style={styles.heroIcon}><Text style={styles.heroIconText}>{detail.initials}</Text></View>
                    <Text style={styles.heroName}>{detail.name}</Text>
                    {detail.rankPosition && <Text style={styles.heroCaption}>Puesto {detail.rankPosition} en el ranking de clanes</Text>}
                </View>

                <View style={styles.actionsRow}>
                    <TouchableOpacity
                        style={styles.chatBtn}
                        onPress={() => navigation.navigate('ClanChat', { clanId })}
                        activeOpacity={0.85}
                    >
                        <IconChat />
                        <Text style={styles.chatBtnText}>Chat</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.challengesBtn}
                        onPress={() => navigation.navigate('Challenges', { clanId })}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.challengesBtnText}>Retos</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.groupTitle}>MIEMBROS · {detail.memberCount}</Text>
                {detail.members.map((m, i) => (
                    <View key={m.userId} style={styles.memberRow}>
                        <View style={[styles.avatar, { backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }]}>
                            <Text style={styles.avatarText}>{initials(m.displayName)}</Text>
                        </View>
                        <View>
                            <Text style={styles.memberName}>{m.displayName || 'Opositor'}</Text>
                            <Text style={styles.memberCaption}>
                                {m.role === 'leader' ? 'Líder · ' : ''}{m.points.toLocaleString('es-ES')} pts
                            </Text>
                        </View>
                    </View>
                ))}

                <Text style={styles.groupTitle}>FASE 2 · VISTA PREVIA</Text>
                <TouchableOpacity
                    style={styles.f2Row}
                    onPress={() => navigation.navigate('GloryWall', { clanId })}
                    activeOpacity={0.7}
                >
                    <Text style={styles.f2RowText}>🏆 Muro de la Gloria</Text>
                    <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.f2Row}
                    onPress={() => navigation.navigate('DuelsPlaceholder')}
                    activeOpacity={0.7}
                >
                    <Text style={styles.f2RowText}>⚡ Duelos en vivo</Text>
                    <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F6FA' },
    statusBar: { height: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 16 },
    statusBarTime: { fontSize: 10, fontWeight: '700', color: '#1B2A4A', marginRight: 'auto' },
    scroll: { flex: 1 },
    body: { paddingHorizontal: 16, paddingBottom: 24 },
    hero: { backgroundColor: '#7B4BC4', borderRadius: 14, alignItems: 'center', padding: 16, marginBottom: 11 },
    heroIcon: { width: 50, height: 50, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    heroIconText: { color: '#fff', fontWeight: '800', fontSize: 18 },
    heroName: { color: '#fff', fontSize: 14, fontWeight: '800' },
    heroCaption: { color: 'rgba(255,255,255,0.85)', fontSize: 11 },
    actionsRow: { flexDirection: 'row', gap: 8, marginBottom: 11 },
    chatBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FF6B4A', borderRadius: 12, paddingVertical: 13 },
    chatBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    challengesBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#D4DAE6', borderRadius: 12, paddingVertical: 13 },
    challengesBtnText: { color: '#1B2A4A', fontSize: 13, fontWeight: '700' },
    groupTitle: { fontSize: 10.5, fontWeight: '700', color: '#5A6373', letterSpacing: 0.4, marginBottom: 8, marginTop: 4 },
    memberRow: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 8 },
    avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    memberName: { fontSize: 12, fontWeight: '700', color: '#1B2A4A' },
    memberCaption: { fontSize: 10, color: '#8A92A0' },
    f2Row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F4FE', borderWidth: 1.5, borderColor: '#D9CCEC', borderRadius: 12, padding: 12, marginBottom: 8 },
    f2RowText: { fontSize: 12, fontWeight: '700', color: '#7B4BC4' },
    chevron: { marginLeft: 'auto', color: '#C4A9E8', fontSize: 16 },
});
