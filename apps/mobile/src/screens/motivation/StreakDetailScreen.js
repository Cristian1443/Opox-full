import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import ScreenHeader from '../../components/ScreenHeader';
import { motivationApi } from '../../api';

function IconFlame({ size = 52, color = '#FF6B4A' }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path d="M12 2c1 3-1 4-1 6a3 3 0 0 0 6 0c0 4-2 6-2 6 3-1 4-4 4-7 2 2 3 5 3 8a9 9 0 1 1-18 0c0-5 4-8 7-12 1 2 0 5 0 5s2-2 0-9c2 0 3 2 3 4z" fill={color} />
        </Svg>
    );
}

function last14Dates() {
    const out = [];
    for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        out.push(d.toISOString().slice(0, 10));
    }
    return out;
}

export default function StreakDetailScreen({ navigation }) {
    const [detail, setDetail] = useState(null);

    useEffect(() => {
        motivationApi.getStreak().then(({ data }) => { if (data) setDetail(data); });
    }, []);

    const activeSet = new Set(detail?.recentActivityDates ?? []);
    const days = last14Dates();

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F4F6FA" />
            <View style={styles.statusBar}><Text style={styles.statusBarTime}>9:41</Text></View>
            <ScreenHeader title="Tu racha" onBack={() => navigation.goBack()} />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                <View style={styles.heroWrap}>
                    <IconFlame />
                    <Text style={styles.heroValue}>{detail?.currentStreak ?? 0}</Text>
                    <Text style={styles.muted}>días consecutivos · récord: {detail?.longestStreak ?? 0}</Text>
                </View>

                <Text style={styles.groupTitle}>ÚLTIMOS 14 DÍAS</Text>
                <View style={styles.grid}>
                    {days.map((d) => (
                        <View
                            key={d}
                            style={[
                                styles.cell,
                                activeSet.has(d) ? styles.cellActive : styles.cellInactive,
                            ]}
                        />
                    ))}
                </View>

                {detail?.nextMilestone && (
                    <>
                        <Text style={styles.groupTitle}>PRÓXIMO HITO</Text>
                        <View style={styles.milestoneCard}>
                            <View style={styles.milestoneIcon}><Text style={{ fontSize: 18 }}>🏅</Text></View>
                            <View>
                                <Text style={styles.milestoneTitle}>Racha de {detail.nextMilestone.days} días</Text>
                                <Text style={styles.milestoneCaption}>
                                    +{detail.nextMilestone.points} Opopoints · te falta{detail.nextMilestone.remaining === 1 ? '' : 'n'} {detail.nextMilestone.remaining}
                                </Text>
                            </View>
                        </View>
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
    scroll: { flex: 1 },
    body: { paddingHorizontal: 16, paddingBottom: 24 },
    heroWrap: { alignItems: 'center', paddingVertical: 14 },
    heroValue: { fontSize: 40, fontWeight: '800', color: '#0F1B33', lineHeight: 44 },
    muted: { fontSize: 11, color: '#8A92A0' },
    groupTitle: { fontSize: 10.5, fontWeight: '700', color: '#5A6373', letterSpacing: 0.4, marginTop: 14, marginBottom: 8 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    cell: { width: '12.5%', aspectRatio: 1, borderRadius: 7 },
    cellActive: { backgroundColor: '#FF6B4A' },
    cellInactive: { backgroundColor: '#EEF1F7' },
    milestoneCard: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#EEF1F7', borderRadius: 14, padding: 13 },
    milestoneIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: '#FFF1EC', alignItems: 'center', justifyContent: 'center' },
    milestoneTitle: { fontSize: 12, fontWeight: '700', color: '#0F1B33' },
    milestoneCaption: { fontSize: 10, color: '#8A92A0' },
});
