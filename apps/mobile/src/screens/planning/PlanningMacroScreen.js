import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import ScreenHeader from '../../components/ScreenHeader';
import { planningApi } from '../../api';

function IconCheck() {
    return (
        <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
            <Path d="M5 12l4 4 10-10" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

const PHASE_SUBTITLES = {
    base: 'Base del temario',
    profundizacion: 'Profundización',
    simulacros: 'Simulacros intensivos',
    repaso: 'Repaso final',
};

function PhaseRow({ phase, index }) {
    if (phase.status === 'done') {
        return (
            <View style={styles.task}>
                <View style={styles.chkOn}><IconCheck /></View>
                <View>
                    <Text style={styles.taskTitle}>{phase.title}</Text>
                    <Text style={styles.taskSubtitle}>Completada</Text>
                </View>
            </View>
        );
    }
    if (phase.status === 'current') {
        return (
            <View style={[styles.task, styles.taskCurrent]}>
                <View style={styles.dotOuter}><View style={styles.dotInner} /></View>
                <View>
                    <Text style={styles.taskTitle}>{phase.title}</Text>
                    <Text style={styles.taskSubtitle}>En curso</Text>
                </View>
            </View>
        );
    }
    return (
        <View style={styles.task}>
            <View style={styles.chk} />
            <View>
                <Text style={styles.taskTitle}>{phase.title}</Text>
                <Text style={styles.taskSubtitle}>Fase {index + 1}</Text>
            </View>
        </View>
    );
}

export default function PlanningMacroScreen({ navigation }) {
    const [macro, setMacro] = useState(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        planningApi.getMacro().then(({ data }) => { setMacro(data); setLoaded(true); });
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F4F6FA" />
            <View style={styles.statusBar}><Text style={styles.statusBarTime}>9:41</Text></View>
            <ScreenHeader title="Camino a la plaza" onBack={() => navigation.goBack()} />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                {!loaded ? null : macro ? (
                    <>
                        <View style={styles.card}>
                            <Text style={styles.cardCaption}>Faltan</Text>
                            <Text style={styles.cardTitle}>{macro.monthsLeft} meses</Text>
                            <Text style={styles.cardExam}>
                                Examen estimado: {new Date(`${macro.examDate}T00:00:00Z`).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                            </Text>
                        </View>
                        <Text style={styles.groupTitle}>RUTA POR FASES</Text>
                        {macro.phases.map((p, i) => <PhaseRow key={p.key} phase={p} index={i} />)}
                    </>
                ) : (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyTitle}>Aún no tienes fecha de examen</Text>
                        <Text style={styles.emptyText}>Añádela en el ajuste del plan para ver tu cuenta atrás y la ruta por fases.</Text>
                        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('PlanningEdit')} activeOpacity={0.85}>
                            <Text style={styles.btnText}>Ajustar mi plan</Text>
                        </TouchableOpacity>
                    </View>
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
    card: { backgroundColor: '#1B2A4A', borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 14 },
    cardCaption: { color: '#9AA7C2', fontSize: 11 },
    cardTitle: { color: '#fff', fontSize: 32, fontWeight: '800', lineHeight: 36 },
    cardExam: { color: '#FF6B4A', fontSize: 11, fontWeight: '700' },
    groupTitle: { fontSize: 10.5, fontWeight: '700', color: '#5A6373', letterSpacing: 0.4, marginBottom: 8 },
    task: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 11, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#EEF1F7', borderRadius: 12, marginBottom: 8 },
    taskCurrent: { borderColor: '#FF6B4A', backgroundColor: '#FFF6F3' },
    taskTitle: { fontSize: 12, fontWeight: '700', color: '#1B2A4A' },
    taskSubtitle: { fontSize: 10, color: '#8A92A0' },
    chk: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: '#D4DAE6' },
    chkOn: { width: 20, height: 20, borderRadius: 6, backgroundColor: '#2BB673', alignItems: 'center', justifyContent: 'center' },
    dotOuter: { width: 20, height: 20, borderRadius: 6, backgroundColor: '#FF6B4A', alignItems: 'center', justifyContent: 'center' },
    dotInner: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },
    emptyCard: { backgroundColor: '#fff', borderRadius: 14, padding: 20, alignItems: 'center', marginTop: 20 },
    emptyTitle: { fontSize: 14, fontWeight: '700', color: '#0F1B33', marginBottom: 6, textAlign: 'center' },
    emptyText: { fontSize: 11.5, color: '#5A6373', textAlign: 'center', marginBottom: 16, lineHeight: 17 },
    btn: { backgroundColor: '#FF6B4A', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20 },
    btnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
