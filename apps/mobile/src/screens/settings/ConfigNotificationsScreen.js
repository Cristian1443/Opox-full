import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, ScrollView, StatusBar, Switch, Platform, View, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import Text from '../../components/AppText';
import AppHeader from '../../components/AppHeader';
import SettingsRow from '../../components/SettingsRow';
import { colors, spacing } from '../../theme';
import {
  DEFAULT_CHECKIN_REMINDER_TIME,
  getCheckinReminderTime,
  scheduleCheckinReminder,
  disableCheckinReminder,
} from '../../lib/checkinReminder';

// ─── Ajustes · Notificaciones ───────────────────────────────────────────────
// El recordatorio del Estado del día vivía en Accesibilidad; QA (Figma) señaló
// que no es un tema de accesibilidad. Aquí caben futuros avisos configurables.

// Convierte 'HH:MM' a Date (fecha de hoy con esa hora) para inicializar el picker.
function parseTimeToDate(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  const d = new Date();
  d.setHours(Number.isFinite(h) ? h : 9, Number.isFinite(m) ? m : 0, 0, 0);
  return d;
}

export default function ConfigNotificationsScreen({ navigation }) {
  const [reminderTime, setReminderTime] = useState(null); // 'HH:MM' | null
  const [showTimePicker, setShowTimePicker] = useState(false);
  // iOS: el spinner dispara onChange en CADA giro de rueda. Guardamos un
  // borrador y solo programamos al pulsar "Guardar" (antes se cerraba y se
  // reprogramaba la notificación al primer tick del spinner).
  const [draftDate, setDraftDate] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getCheckinReminderTime().then((t) => {
      if (!cancelled) setReminderTime(t);
    });
    return () => { cancelled = true; };
  }, []);

  const toggleReminder = useCallback(async (enabled) => {
    if (enabled) {
      const ok = await scheduleCheckinReminder(DEFAULT_CHECKIN_REMINDER_TIME);
      setReminderTime(ok ? DEFAULT_CHECKIN_REMINDER_TIME : null);
    } else {
      await disableCheckinReminder();
      setReminderTime(null);
    }
  }, []);

  const applyTime = useCallback(async (date) => {
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const time = `${hh}:${mm}`;
    const ok = await scheduleCheckinReminder(time);
    if (ok) setReminderTime(time);
  }, []);

  const openTimePicker = useCallback(() => {
    setDraftDate(parseTimeToDate(reminderTime ?? DEFAULT_CHECKIN_REMINDER_TIME));
    setShowTimePicker(true);
  }, [reminderTime]);

  const handleTimeChange = useCallback(async (event, selectedDate) => {
    if (Platform.OS === 'ios') {
      // iOS: solo actualizar el borrador; se confirma con "Guardar".
      if (selectedDate) setDraftDate(selectedDate);
      return;
    }
    // Android: diálogo nativo — un único evento 'set' o 'dismissed'.
    setShowTimePicker(false);
    if (event?.type === 'dismissed' || !selectedDate) return;
    await applyTime(selectedDate);
  }, [applyTime]);

  const handleIosConfirm = useCallback(async () => {
    setShowTimePicker(false);
    if (draftDate) await applyTime(draftDate);
  }, [draftDate, applyTime]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <AppHeader title="Notificaciones" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>ESTADO DEL DÍA</Text>
        <SettingsRow
          label="Recordatorio diario"
          subtitle="Te avisamos para registrar cómo estás"
          right={(
            <Switch
              value={!!reminderTime}
              onValueChange={toggleReminder}
              trackColor={{ false: '#E2E2E6', true: colors.purple }}
              ios_backgroundColor="#E2E2E6"
              thumbColor={colors.white}
              accessibilityLabel={`Recordatorio del Estado del día ${reminderTime ? 'activado' : 'desactivado'}`}
            />
          )}
        />
        {reminderTime && (
          <SettingsRow
            label="Hora del recordatorio"
            onPress={openTimePicker}
            right={<Text style={styles.timeValue}>{reminderTime}</Text>}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={draftDate ?? parseTimeToDate(reminderTime ?? DEFAULT_CHECKIN_REMINDER_TIME)}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            is24Hour
            locale="es-ES"
            // iOS: la app fuerza tema claro; sin esto el spinner hereda el
            // modo oscuro del sistema y pinta texto blanco sobre fondo blanco.
            themeVariant="light"
            onChange={handleTimeChange}
          />
        )}
        {showTimePicker && Platform.OS === 'ios' && (
          <View style={styles.iosPickerActions}>
            <TouchableOpacity onPress={() => setShowTimePicker(false)} hitSlop={8}>
              <Text style={styles.iosPickerCancel}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleIosConfirm} hitSlop={8}>
              <Text style={styles.iosPickerConfirm}>Guardar</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  // Sin padding lateral: lo aporta cada SettingsRow.
  scroll: {
    paddingBottom: spacing.xl,
  },
  sectionLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: colors.textDark,
    paddingHorizontal: spacing.lg + 8,
    marginBottom: 4,
  },
  iosPickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 24,
    paddingHorizontal: spacing.lg + 8,
    paddingVertical: 8,
  },
  iosPickerCancel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    color: colors.textDark,
  },
  iosPickerConfirm: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    color: colors.purple,
  },
  timeValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: colors.accentOrange,
  },
});
