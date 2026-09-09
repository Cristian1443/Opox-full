import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { planningApi } from '../../api';
import { colors, spacing } from '../../theme';

const FIGMA = {
    orangeAlt: '#F37D27',
    badgeBorder: 'rgba(65,41,80,0.3)',
    separator: 'rgba(65,41,80,0.5)',
    textNote: '#343A3D',
    faded: 'rgba(65,41,80,0.2)',
};

const BADGE_PALETTE = [
    { solid: colors.ctaGreen, bg: 'rgba(36,189,144,0.15)' },
    { solid: FIGMA.orangeAlt, bg: 'rgba(243,125,39,0.15)' },
    { solid: colors.purple, bg: 'rgba(114,65,184,0.15)' },
];

function toIso(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// ─── Fila de fecha en la lista ────────────────────────────────────────────────
function formatDay(dateIso) {
    const d = new Date(`${dateIso}T00:00:00Z`);
    return {
        day: String(d.getUTCDate()),
        month: d.toLocaleDateString('es-ES', { month: 'short', timeZone: 'UTC' }).replace('.', '').toUpperCase(),
    };
}

function DateRow({ item, index, showTopBorder }) {
    const { day, month } = formatDay(item.eventDate);
    const badge = BADGE_PALETTE[index % BADGE_PALETTE.length];
    return (
        <View style={[styles.row, showTopBorder && styles.rowTopBorder]}>
            <View style={[styles.dateBadge, { backgroundColor: badge.bg }]}>
                <Text style={[styles.dateBadgeDay, { color: badge.solid }]}>{day}</Text>
                <Text style={[styles.dateBadgeMonth, { color: badge.solid }]}>{month}</Text>
            </View>
            <View style={styles.rowTextWrap}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                {item.subtitle && <Text style={styles.rowSubtitle}>{item.subtitle}</Text>}
            </View>
        </View>
    );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────
export default function PlanningAgendaScreen({ navigation }) {
    const [dates, setDates] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [form, setForm] = useState({ title: '', subtitle: '' });
    const [saving, setSaving] = useState(false);

    const [pickerVisible, setPickerVisible] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);   // Date object confirmado
    const [tempDate, setTempDate] = useState(new Date());     // iOS: pendiente de confirmar

    const load = useCallback(() => {
        planningApi.listAgenda().then(({ data }) => { if (data) setDates(data); });
    }, []);

    useEffect(() => { load(); }, [load]);

    const openModal = () => {
        setSelectedDate(null);
        setTempDate(new Date());
        setForm({ title: '', subtitle: '' });
        setModalVisible(true);
    };

    const openPicker = () => {
        setTempDate(selectedDate ?? new Date());
        setPickerVisible(true);
    };

    const handlePickerChange = (event, date) => {
        if (Platform.OS === 'android') {
            setPickerVisible(false);
            if (event.type !== 'dismissed' && date) setSelectedDate(date);
        } else {
            if (date) setTempDate(date);
        }
    };

    const confirmIosPicker = () => {
        setSelectedDate(tempDate);
        setPickerVisible(false);
    };

    const handleSave = async () => {
        if (!form.title.trim()) return;
        if (!selectedDate) {
            Alert.alert('Falta la fecha', 'Selecciona una fecha antes de guardar.');
            return;
        }
        setSaving(true);
        const { data, error } = await planningApi.createAgendaDate({
            title: form.title.trim(),
            eventDate: toIso(selectedDate),
            subtitle: form.subtitle.trim() || undefined,
            kind: 'custom',
        });
        setSaving(false);
        if (data) {
            setDates(prev => [...prev, data].sort((a, b) => a.eventDate.localeCompare(b.eventDate)));
            setModalVisible(false);
        } else {
            Alert.alert('No se pudo guardar', error?.message ?? 'Comprueba tu conexión e inténtalo de nuevo.');
        }
    };

    const displayDate = selectedDate
        ? selectedDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'Seleccionar fecha';

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="chevron-back" size={24} color={colors.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Agenda</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionLabel}>FECHAS CLAVE</Text>
                {dates.map((d, index) => (
                    <DateRow key={d.id} item={d} index={index} showTopBorder={index === 0} />
                ))}
                <TouchableOpacity style={[styles.row, dates.length === 0 && styles.rowTopBorder]} onPress={openModal} activeOpacity={0.7}>
                    <Text style={styles.addIcon}>+</Text>
                    <View style={styles.rowTextWrap}>
                        <Text style={styles.addTitle}>Añadir fecha propia</Text>
                        <Text style={styles.addSubtitle}>Examen, repaso, tutoría…</Text>
                    </View>
                </TouchableOpacity>
                <View style={styles.listBottomBorder} />
            </ScrollView>

            {/* ── Modal: nueva fecha ─────────────────────────────────────── */}
            <Modal transparent visible={modalVisible} animationType="fade" onRequestClose={() => setModalVisible(false)}>
                <View style={styles.overlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Nueva fecha</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Título (ej. Simulacro con el Tutor)"
                            placeholderTextColor="#AEB5C2"
                            value={form.title}
                            onChangeText={(title) => setForm(f => ({ ...f, title }))}
                        />

                        {/* Campo de fecha — abre el picker nativo al tocar */}
                        <TouchableOpacity
                            style={[styles.input, styles.dateTouchable]}
                            onPress={openPicker}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="calendar-outline" size={16} color={selectedDate ? colors.textDark : '#AEB5C2'} style={{ marginRight: 8 }} />
                            <Text style={[styles.dateText, !selectedDate && styles.datePlaceholderText]}>
                                {displayDate}
                            </Text>
                            <Ionicons name="chevron-down" size={14} color="#AEB5C2" style={{ marginLeft: 'auto' }} />
                        </TouchableOpacity>

                        <TextInput
                            style={styles.input}
                            placeholder="Detalle (opcional)"
                            placeholderTextColor="#AEB5C2"
                            value={form.subtitle}
                            onChangeText={(subtitle) => setForm(f => ({ ...f, subtitle }))}
                        />

                        <TouchableOpacity
                            style={[styles.btn, saving && { opacity: 0.6 }]}
                            onPress={handleSave}
                            activeOpacity={0.85}
                            disabled={saving}
                        >
                            {saving
                                ? <ActivityIndicator color={colors.white} size="small" />
                                : <Text style={styles.btnText}>Guardar</Text>}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: 8 }}>
                            <Text style={styles.cancel}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* ── DateTimePicker nativo ──────────────────────────────────── */}
            {/* Android: se muestra como diálogo nativo directamente */}
            {pickerVisible && Platform.OS === 'android' && (
                <DateTimePicker
                    value={tempDate}
                    mode="date"
                    display="default"
                    onChange={handlePickerChange}
                />
            )}

            {/* iOS: envuelto en modal de confirmación */}
            {Platform.OS === 'ios' && (
                <Modal transparent visible={pickerVisible} animationType="slide" onRequestClose={() => setPickerVisible(false)}>
                    <View style={styles.pickerOverlay}>
                        <View style={styles.pickerCard}>
                            <Text style={styles.pickerTitle}>Seleccionar fecha</Text>
                            <DateTimePicker
                                value={tempDate}
                                mode="date"
                                display="spinner"
                                onChange={handlePickerChange}
                                locale="es-ES"
                            />
                            <TouchableOpacity style={[styles.btn, { marginTop: 12 }]} onPress={confirmIosPicker} activeOpacity={0.85}>
                                <Text style={styles.btnText}>Confirmar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setPickerVisible(false)} style={{ marginTop: 8 }}>
                                <Text style={styles.cancel}>Cancelar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.white },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: 4 },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F0F0F2', alignItems: 'center', justifyContent: 'center' },
    headerSpacer: { width: 44 },
    headerTitle: { flex: 1, fontFamily: 'Poppins-SemiBold', fontSize: 21, color: colors.textDark, textAlign: 'center' },
    scroll: { flex: 1 },
    body: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: 24 },
    sectionLabel: { fontFamily: 'Poppins-SemiBold', fontSize: 18, color: colors.textDark, marginBottom: 8 },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 26 },
    rowTopBorder: { borderTopWidth: 0.44, borderTopColor: FIGMA.separator },
    listBottomBorder: { borderTopWidth: 0.44, borderTopColor: FIGMA.separator },
    dateBadge: { width: 52, height: 58, borderRadius: 10, borderWidth: 0.32, borderColor: FIGMA.badgeBorder, alignItems: 'center', justifyContent: 'center', marginRight: 18 },
    dateBadgeDay: { fontFamily: 'Poppins-Bold', fontSize: 25 },
    dateBadgeMonth: { fontFamily: 'Poppins-Regular', fontSize: 13 },
    rowTextWrap: { flex: 1 },
    rowTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 18, color: colors.textDark },
    rowSubtitle: { marginTop: 3, fontFamily: 'Poppins-Regular', fontSize: 12, color: FIGMA.textNote },
    addIcon: { width: 52, textAlign: 'center', fontFamily: 'Poppins-Light', fontSize: 32, color: FIGMA.faded, marginRight: 18 },
    addTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 18, color: FIGMA.faded },
    addSubtitle: { marginTop: 3, fontFamily: 'Poppins-Regular', fontSize: 12, color: FIGMA.faded },
    // Modal nueva fecha
    overlay: { flex: 1, backgroundColor: 'rgba(15,27,51,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
    modalCard: { backgroundColor: colors.white, borderRadius: 16, padding: 18, width: '100%' },
    modalTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 15, color: colors.textDark, marginBottom: 12 },
    input: { borderWidth: 1.5, borderColor: '#E4E8F0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: colors.textDark, marginBottom: 10 },
    dateTouchable: { flexDirection: 'row', alignItems: 'center' },
    dateText: { fontFamily: 'Poppins-Regular', fontSize: 13, color: colors.textDark },
    datePlaceholderText: { color: '#AEB5C2' },
    btn: { backgroundColor: colors.ctaGreen, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    btnText: { fontFamily: 'Poppins-SemiBold', fontSize: 13, color: colors.white },
    cancel: { textAlign: 'center', fontFamily: 'Poppins-SemiBold', color: FIGMA.textNote, fontSize: 12 },
    // Modal picker iOS
    pickerOverlay: { flex: 1, backgroundColor: 'rgba(15,27,51,0.45)', justifyContent: 'flex-end' },
    pickerCard: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 36 },
    pickerTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 16, color: colors.textDark, textAlign: 'center', marginBottom: 8 },
});
