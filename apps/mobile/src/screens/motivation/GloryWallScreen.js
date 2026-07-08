import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import ScreenHeader from '../../components/ScreenHeader';
import { motivationApi } from '../../api';

const AVATAR_COLORS = ['#2BB673', '#2D6FB0', '#7B4BC4', '#E0552F'];

function initials(name) {
    if (!name) return '?';
    return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('');
}

function formatMonth(iso) {
    return new Date(iso).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
}

export default function GloryWallScreen({ navigation, route }) {
    const { clanId } = route.params;
    const [graduates, setGraduates] = useState([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        motivationApi.listGraduates(clanId).then(({ data }) => { setGraduates(data || []); setLoaded(true); });
    }, [clanId]);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F4F6FA" />
            <View style={styles.statusBar}><Text style={styles.statusBarTime}>9:41</Text></View>
            <ScreenHeader title="Muro de la Gloria" onBack={() => navigation.goBack()} dark />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                <View style={styles.hero}>
                    <Text style={{ fontSize: 30 }}>🏆</Text>
                    <Text style={styles.heroTitle}>Aprobados de tu clan</Text>
                    <Text style={styles.heroCaption}>Quienes lo consiguieron este año</Text>
                </View>

                <Text style={styles.groupTitle}>RECIÉN APROBADOS</Text>
                {!loaded ? null : graduates.length === 0 ? (
                    <Text style={styles.empty}>
                        Todavía no hay aprobados registrados en tu clan. Este muro (Fase 2) se llenará cuando el
                        producto tenga más volumen — por ahora ya lee datos reales, solo faltan aprobados que reportar.
                    </Text>
                ) : (
                    graduates.map((g, i) => (
                        <View key={g.displayName + i} style={styles.row}>
                            <View style={[styles.avatar, { backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }]}>
                                <Text style={styles.avatarText}>{initials(g.displayName)}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.name}>{g.displayName || 'Opositor'}</Text>
                                <Text style={styles.caption}>
                                    {g.oposicion || 'Oposición'} · {formatMonth(g.passedExamAt)}
                                </Text>
                            </View>
                            <Text style={{ fontSize: 16 }}>🎉</Text>
                        </View>
                    ))
                )}
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
    hero: { backgroundColor: '#1B2A4A', borderRadius: 14, alignItems: 'center', padding: 16, marginBottom: 11 },
    heroTitle: { color: '#fff', fontSize: 13, fontWeight: '800', marginTop: 4 },
    heroCaption: { color: 'rgba(255,255,255,0.8)', fontSize: 11 },
    groupTitle: { fontSize: 10.5, fontWeight: '700', color: '#5A6373', letterSpacing: 0.4, marginBottom: 8 },
    empty: { fontSize: 12, color: '#8A92A0', lineHeight: 18 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#EEF1F7', borderRadius: 12, padding: 11, marginBottom: 8 },
    avatar: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: '#fff', fontWeight: '800', fontSize: 12 },
    name: { fontSize: 12, fontWeight: '700', color: '#1B2A4A' },
    caption: { fontSize: 10, color: '#8A92A0' },
});
