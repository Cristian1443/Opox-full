// Bloque 3 · Salud — Recordatorio diario del check-in
// Notificación local repetida (daily trigger) a la hora configurada por el
// usuario. Default '09:00' — configurable en ConfigAccessibilityScreen.
//
// Estado persistido en AsyncStorage:
//  - opox.health.checkinReminderTime → 'HH:MM' | null (null = desactivado)
//  - opox.health.checkinReminderId   → identifier de expo-notifications
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

export const CHECKIN_REMINDER_TIME_KEY = 'opox.health.checkinReminderTime';
export const CHECKIN_REMINDER_ID_KEY   = 'opox.health.checkinReminderId';
export const DEFAULT_CHECKIN_REMINDER_TIME = '09:00';

const IS_EXPO_GO = Constants.appOwnership === 'expo';

async function loadNotifications() {
    if (IS_EXPO_GO) return null;
    try {
        const mod = await import('expo-notifications');
        return mod?.default ?? mod;
    } catch { return null; }
}

function parseTime(hhmm) {
    const [h, m] = String(hhmm ?? '').split(':').map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    if (h < 0 || h > 23 || m < 0 || m > 59) return null;
    return { hour: h, minute: m };
}

/** Cancela la notificación diaria previa (si existe) sin borrar la preferencia. */
export async function cancelCheckinReminder() {
    const Notifications = await loadNotifications();
    if (!Notifications) return;
    const id = await AsyncStorage.getItem(CHECKIN_REMINDER_ID_KEY).catch(() => null);
    if (id) {
        try { await Notifications.cancelScheduledNotificationAsync(id); } catch {}
        await AsyncStorage.removeItem(CHECKIN_REMINDER_ID_KEY).catch(() => {});
    }
}

/**
 * Programa el recordatorio diario a la hora dada (HH:MM). Cancela el anterior
 * si existe, para que llamar esta función sea idempotente. Devuelve true si
 * quedó programada o false si no fue posible (Expo Go / permisos denegados).
 */
export async function scheduleCheckinReminder(timeHhmm = DEFAULT_CHECKIN_REMINDER_TIME) {
    const Notifications = await loadNotifications();
    if (!Notifications) return false;

    const t = parseTime(timeHhmm);
    if (!t) return false;

    // Permisos
    try {
        const perm = await Notifications.getPermissionsAsync();
        if (perm.status !== 'granted') {
            const req = await Notifications.requestPermissionsAsync();
            if (req.status !== 'granted') return false;
        }
    } catch { return false; }

    // Cancelar el anterior antes de programar el nuevo — evita duplicados.
    await cancelCheckinReminder();

    try {
        const id = await Notifications.scheduleNotificationAsync({
            content: {
                title: '📝 Tu Estado del día',
                body: '20 segundos y sabrás cómo enfocar tu día de estudio.',
                data: { screen: 'DailyCheckIn', type: 'daily_reminder' },
            },
            trigger: {
                hour: t.hour,
                minute: t.minute,
                repeats: true,
                channelId: 'default',
            },
        });
        await AsyncStorage.setItem(CHECKIN_REMINDER_ID_KEY, id).catch(() => {});
        await AsyncStorage.setItem(CHECKIN_REMINDER_TIME_KEY, timeHhmm).catch(() => {});
        return true;
    } catch (err) {
        console.warn('[checkin-reminder] scheduleNotificationAsync falló', err?.message ?? err);
        return false;
    }
}

/** Desactiva el recordatorio y borra la preferencia. */
export async function disableCheckinReminder() {
    await cancelCheckinReminder();
    await AsyncStorage.removeItem(CHECKIN_REMINDER_TIME_KEY).catch(() => {});
}

/** Devuelve la hora configurada o null si está desactivado. */
export async function getCheckinReminderTime() {
    return AsyncStorage.getItem(CHECKIN_REMINDER_TIME_KEY).catch(() => null);
}

/**
 * Asegura que el recordatorio esté programado a la hora guardada — llamar al
 * arranque de la app. Si nunca se configuró, no hace nada (usuario decide en
 * ajustes). Si se configuró pero no está schedule, lo re-programa (recuperación
 * tras reinstalación / limpieza de datos).
 */
export async function ensureCheckinReminderScheduled() {
    const time = await getCheckinReminderTime();
    if (!time) return;
    const existingId = await AsyncStorage.getItem(CHECKIN_REMINDER_ID_KEY).catch(() => null);
    if (existingId) return; // ya schedule
    await scheduleCheckinReminder(time);
}
