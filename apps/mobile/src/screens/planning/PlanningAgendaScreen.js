import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView, Modal, TextInput } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import ScreenHeader from '../../components/ScreenHeader';
import { planningApi } from '../../api';

function IconPlus({ color = '#FF6B4A', size = 20 }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={2} strokeLinecap="round" />
        </Svg>
    );
}

const KIND_STYLES = {
    exam_deadline: { bg: '#FFF1EC', color: '#FF6B4A' },
    exam: { bg: '#FDEBE9', color: '#E2483D' },
    custom: { bg: '#EAF3FB', color: '#2D6FB0' },
};

function formatDay(dateIso) {
    const d = new Date(`${dateIso}T00:00:00Z`);
    return {
        day: String(d.getUTCDate()),
        month: d.toLocaleDateString('es-ES', { month: 'short', timeZone: 'UTC' }).replace('.', '').toUpperCase(),
    };
}

function DateRow({ item }) {
    const style = KIND_STYLES[item.kind] || KIND_STYLES.custom;
    const { day, month } = formatDay(item.eventDate);
    return (
        <View style={styles.row}>
            <View style={[styles.dLeft, { backgroundColor: style.bg }]}>
                <Text style={[styles.dDay, { color: style.color }]}>{day}</Text>
                <Text style={[styles.dMonth, { color: style.color }]}>{month}</Text>
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                {item.subtitle && <Text style={styles.rowSubtitle}>{item.subtitle}</Text>}
            </View>
        </View>
    );
}

export default function PlanningAgendaScreen({ navigation }) {
    const [dates, setDates] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [form, setForm] = useState({ title: '', eventDate: '', subtitle: '' });

    const load = useCallback(() => {
        planningApi.listAgenda().then(({ data }) => { if (data) setDates(data); });
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleSave = async () => {
        if (!form.title.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(form.eventDate)) return;
        const { data } = await planningApi.createAgendaDate({
            title: form.title.trim(),
            eventDate: form.eventDate,
            subtitle: form.subtitle.trim() || undefined,
            kind: 'custom',
        });
        if (data) {
            setDates((prev) => [...prev, data].sort((a, b) => a.eventDate.localeCompare(b.eventDate)));
            setForm({ title: '', eventDate: '', subtitle: '' });
            setModalVisible(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F4F6FA" />
            <View style={styles.statusBar}><Text style={styles.statusBarTime}>9:41</Text></View>
            <ScreenHeader
                title="Agenda"
                onBack={() => navigation.goBack()}
                right={<TouchableOpacity onPress={() => setModalVisible(true)}><IconPlus /></TouchableOpacity>}
            />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                <Text style={styles.groupTitle}>FECHAS CLAVE</Text>
                {dates.map((d) => <DateRow key={d.id} item={d} />)}

                <TouchableOpacity style={styles.addRow} onPress={() => setModalVisible(true)} activeOpacity={0.7}>
                    <View style={styles.addIcon}><IconPlus color="#9AA2B1" size={20} /></View>
                    <View>
                        <Text style={styles.addTitle}>Añadir fecha propia</Text>
                        <Text style={styles.addSubtitle}>Examen, repaso, tutoría…</Text>
                    </View>
                </TouchableOpacity>
            </ScrollView>

            <Modal transparent visible={modalVisible} animationType="fade" onRequestClose={() => setModalVisible(false)}>
                <View style={styles.overlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Nueva fecha</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Título (ej. Simulacro con el Tutor)"
                            placeholderTextColor="#AEB5C2"
                            value={form.title}
                            onChangeText={(title) => setForm((f) => ({ ...f, title }))}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Fecha (YYYY-MM-DD)"
                            placeholderTextColor="#AEB5C2"
                            value={form.eventDate}
                            onChangeText={(eventDate) => setForm((f) => ({ ...f, eventDate }))}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Detalle (opcional)"
                            placeholderTextColor="#AEB5C2"
                            value={form.subtitle}
                            onChangeText={(subtitle) => setForm((f) => ({ ...f, subtitle }))}
                        />
                        <TouchableOpacity style={styles.btn} onPress={handleSave} activeOpacity={0.85}>
                            <Text style={styles.btnText}>Guardar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: 8 }}>
                            <Text style={styles.cancel}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F6FA' },
    statusBar: { height: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 16 },
    statusBarTime: { fontSize: 10, fontWeight: '700', color: '#1B2A4A', marginRight: 'auto' },
    scroll: { flex: 1 },
    body: { paddingHorizontal: 16, paddingBottom: 24 },
    groupTitle: { fontSize: 10.5, fontWeight: '700', color: '#5A6373', letterSpacing: 0.4, marginBottom: 8 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 12, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#EEF1F7', borderRadius: 12, marginBottom: 9 },
    dLeft: { width: 46, height: 46, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    dDay: { fontSize: 16, fontWeight: '800', lineHeight: 18 },
    dMonth: { fontSize: 8, fontWeight: '700' },
    rowTitle: { fontSize: 12.5, fontWeight: '700', color: '#1B2A4A' },
    rowSubtitle: { fontSize: 10.5, color: '#8A92A0', marginTop: 1 },
    addRow: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 12, borderWidth: 1.5, borderColor: '#E4E8F0', borderStyle: 'dashed', borderRadius: 12 },
    addIcon: { width: 46, height: 46, borderRadius: 11, backgroundColor: '#F0F2F7', alignItems: 'center', justifyContent: 'center' },
    addTitle: { fontSize: 12.5, fontWeight: '700', color: '#8A92A0' },
    addSubtitle: { fontSize: 10.5, color: '#AEB5C2' },
    overlay: { flex: 1, backgroundColor: 'rgba(15,27,51,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
    modalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, width: '100%' },
    modalTitle: { fontSize: 15, fontWeight: '800', color: '#0F1B33', marginBottom: 12 },
    input: { borderWidth: 1.5, borderColor: '#E4E8F0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: '#1B2A4A', marginBottom: 10 },
    btn: { backgroundColor: '#FF6B4A', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    btnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    cancel: { textAlign: 'center', color: '#8A92A0', fontSize: 12, fontWeight: '700' },
});
