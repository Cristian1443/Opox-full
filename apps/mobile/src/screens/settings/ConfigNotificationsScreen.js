import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, ScrollView, StatusBar, Switch, Platform,
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

  const handleTimeChange = useCallback(async (event, selectedDate) => {
    // iOS: el picker es modal — cerrar solo en 'set'
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (event?.type === 'dismissed' || !selectedDate) return;
    const hh = String(selectedDate.getHours()).padStart(2, '0');
    const mm = String(selectedDate.getMinutes()).padStart(2, '0');
    const time = `${hh}:${mm}`;
    const ok = await scheduleCheckinReminder(time);
    if (ok) setReminderTime(time);
    if (Platform.OS === 'ios') setShowTimePicker(false);
  }, []);

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
              thumbColor={colors.white}
              accessibilityLabel={`Recordatorio del Estado del día ${reminderTime ? 'activado' : 'desactivado'}`}
            />
          )}
        />
        {reminderTime && (
          <SettingsRow
            label="Hora del recordatorio"
            onPress={() => setShowTimePicker(true)}
            right={<Text style={styles.timeValue}>{reminderTime}</Text>}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={parseTimeToDate(reminderTime ?? DEFAULT_CHECKIN_REMINDER_TIME)}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            is24Hour
            onChange={handleTimeChange}
          />
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
  timeValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: colors.accentOrange,
  },
});
