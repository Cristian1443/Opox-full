import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import ScreenHeader from '../../components/ScreenHeader';
import NudgeModal from '../../components/NudgeModal';
import { motivationApi, planningApi } from '../../api';

function IconFlame({ size = 44, color = '#fff' }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path d="M12 2c1 3-1 4-1 6a3 3 0 0 0 6 0c0 4-2 6-2 6 3-1 4-4 4-7 2 2 3 5 3 8a9 9 0 1 1-18 0c0-5 4-8 7-12 1 2 0 5 0 5s2-2 0-9c2 0 3 2 3 4z" fill={color} />
        </Svg>
    );
}

function IconRankings() {
    return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M6 9V3h12v6a6 6 0 0 1-12 0zM9 21h6M12 15v6" stroke="#E0552F" strokeWidth={1.6} strokeLinecap="round" />
        </Svg>
    );
}

function IconClan() {
    return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M9 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" stroke="#7B4BC4" strokeWidth={1.6} />
            <Path d="M3 19a6 6 0 0 1 12 0M16 7a3 3 0 0 1 0 6M21 19a5 5 0 0 0-3-4.5" stroke="#7B4BC4" strokeWidth={1.5} strokeLinecap="round" />
        </Svg>
    );
}

function IconChallenge() {
    return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M13 2L4 14h7l-1 8 9-12h-7z" stroke="#2BB673" strokeWidth={1.6} strokeLinejoin="round" />
        </Svg>
    );
}

function ExploreRow({ icon, label, onPress }) {
    return (
        <TouchableOpacity style={styles.exploreRow} onPress={onPress} activeOpacity={0.7}>
            {icon}
            <Text style={styles.exploreLabel}>{label}</Text>
            <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
    );
}

export default function MotivationHomeScreen({ navigation }) {
    const [summary, setSummary] = useState(null);
    const [dangerVisible, setDangerVisible] = useState(false);

    useEffect(() => {
        let cancelled = false;
        Promise.all([motivationApi.getSummary(), planningApi.getSummary()]).then(([m, p]) => {
            if (cancelled) return;
            if (m.data) setSummary(m.data);
            const hour = new Date().getHours();
            const goalPending = p.data && p.data.today.completedCount < p.data.today.goalCount;
            if (hour >= 21 && goalPending && m.data?.gamification.currentStreak > 0) {
                setDangerVisible(true);
            }
        });
        return () => { cancelled = true; };
    }, []);

    const gamification = summary?.gamification ?? { currentStreak: 0, opopointsBalance: 0 };
    const myClan = summary?.myClan ?? null;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F4F6FA" />
            <View style={styles.statusBar}><Text style={styles.statusBarTime}>9:41</Text></View>
            <ScreenHeader title="Motivación" onBack={() => navigation.goBack()} />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                <TouchableOpacity style={styles.streakCard} onPress={() => navigation.navigate('StreakDetail')} activeOpacity={0.85}>
                    <IconFlame />
                    <Text style={styles.streakValue}>{gamification.currentStreak}</Text>
                    <Text style={styles.streakCaption}>días de racha</Text>
                </TouchableOpacity>

                <View style={styles.pointsCard}>
                    <View style={styles.pointsBadge}><Text style={styles.pointsBadgeText}>O</Text></View>
                    <View>
                        <Text style={styles.pointsValue}>{gamification.opopointsBalance.toLocaleString('es-ES')}</Text>
                        <Text style={styles.muted}>Opopoints disponibles</Text>
                    </View>
                </View>

                <Text style={styles.groupTitle}>EXPLORAR</Text>
                <ExploreRow icon={<IconRankings />} label="Rankings" onPress={() => navigation.navigate('Rankings')} />
                <ExploreRow
                    icon={<IconClan />}
                    label={myClan ? myClan.name : 'Mis clanes'}
                    onPress={() => navigation.navigate(myClan ? 'ClanDetail' : 'ClansList', myClan ? { clanId: myClan.id } : undefined)}
                />
                {myClan && (
                    <ExploreRow icon={<IconChallenge />} label="Retos" onPress={() => navigation.navigate('Challenges', { clanId: myClan.id })} />
                )}
            </ScrollView>

            {dangerVisible && (
                <NudgeModal
                    visible
                    iconBg="#FFF4E5"
                    icon={<IconFlame size={26} color="#E89B2C" />}
                    title="Tu racha está en peligro"
                    description={`Te quedan unas horas para no perder tus ${gamification.currentStreak} días. Un test rápido la mantiene.`}
                    primaryLabel="Hacer test rápido"
                    secondaryLabel="Luego"
                    onPrimaryPress={() => { setDangerVisible(false); navigation.navigate('PlanningToday'); }}
                    onSecondaryPress={() => setDangerVisible(false)}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F6FA' },
    statusBar: { height: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 16 },
    statusBarTime: { fontSize: 10, fontWeight: '700', color: '#1B2A4A', marginRight: 'auto' },
    scroll: { flex: 1 },
    body: { paddingHorizontal: 16, paddingBottom: 24 },
    streakCard: { backgroundColor: '#FF6B4A', borderRadius: 14, alignItems: 'center', padding: 18, marginBottom: 11 },
    streakValue: { fontSize: 34, fontWeight: '800', color: '#fff', marginTop: 4, lineHeight: 38 },
    streakCaption: { fontSize: 12, color: 'rgba(255,255,255,0.9)' },
    pointsCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#EEF1F7', borderRadius: 14, padding: 13, marginBottom: 11 },
    pointsBadge: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#F5A623', alignItems: 'center', justifyContent: 'center' },
    pointsBadgeText: { color: '#fff', fontWeight: '800', fontSize: 16 },
    pointsValue: { fontSize: 18, fontWeight: '800', color: '#0F1B33' },
    muted: { fontSize: 11, color: '#8A92A0' },
    groupTitle: { fontSize: 10.5, fontWeight: '700', color: '#5A6373', letterSpacing: 0.4, marginBottom: 8 },
    exploreRow: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#EEF1F7', borderRadius: 14, padding: 13, marginBottom: 8 },
    exploreLabel: { fontSize: 12.5, fontWeight: '700', color: '#1B2A4A' },
    chevron: { marginLeft: 'auto', color: '#C4CBD6', fontSize: 16 },
});
