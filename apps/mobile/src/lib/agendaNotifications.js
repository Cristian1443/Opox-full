import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Namespace en AsyncStorage: opox.agenda.notif.<agendaId> → array de identifiers.
// Se guarda para poder cancelar las notificaciones cuando el usuario elimine
// la fecha (backend DELETE /planning/agenda/:id).
const KEY_PREFIX = 'opox.agenda.notif.';

// Programación fija: hora local del recordatorio.
const REMIND_HOUR = 9;
const REMIND_MINUTE = 0;

// Días antes del evento cuando se envían las 3 notificaciones (0 = día del evento).
const REMINDER_OFFSETS_DAYS = [3, 2, 0];

const IS_EXPO_GO = Constants.appOwnership === 'expo';

/** Carga lazy: `expo-notifications` no está disponible en Expo Go SDK 53+ para push
 * remoto. Para notificaciones LOCALES sí funciona en Expo Go, pero mantenemos el
 * mismo patrón por consistencia con App.js — si el módulo no carga, degradamos
 * silenciosamente sin bloquear la creación de la fecha. */
async function loadNotifications() {
    try {
        const mod = await import('expo-notifications');
        return mod?.default ?? mod;
    } catch { return null; }
}

function buildTriggerDate(eventDateIso, daysBefore) {
    // eventDateIso viene en formato YYYY-MM-DD. Construimos una fecha local a las 9:00.
    const [y, m, d] = eventDateIso.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    target.setDate(target.getDate() - daysBefore);
    target.setHours(REMIND_HOUR, REMIND_MINUTE, 0, 0);
    return target;
}

function notificationBody(title, daysBefore) {
    if (daysBefore === 0) return `Hoy: ${title}`;
    if (daysBefore === 1) return `Mañana: ${title}`;
    return `En ${daysBefore} días: ${title}`;
}

/**
 * Programa las 3 notificaciones (T-3d, T-2d, T-0) para una fecha de agenda.
 * Guarda los identifiers en AsyncStorage para poder cancelarlos después.
 * Si un recordatorio ya está en el pasado (fecha < ahora), se omite silenciosamente.
 */
export async function scheduleAgendaReminders(agendaId, title, eventDateIso) {
    const Notifications = await loadNotifications();
    if (!Notifications) return [];

    // Solicitar permisos si aún no están concedidos.
    try {
        const perm = await Notifications.getPermissionsAsync();
        if (perm.status !== 'granted') {
            const req = await Notifications.requestPermissionsAsync();
            if (req.status !== 'granted') return [];
        }
    } catch { return []; }

    const now = new Date();
    const identifiers = [];

    for (const days of REMINDER_OFFSETS_DAYS) {
        const trigger = buildTriggerDate(eventDateIso, days);
        if (trigger.getTime() <= now.getTime()) continue;
        try {
            const id = await Notifications.scheduleNotificationAsync({
                content: {
                    title: 'Recordatorio de agenda OPOX',
                    body: notificationBody(title, days),
                    data: { agendaId, kind: 'agenda_reminder' },
                },
                trigger: { date: trigger, channelId: 'default' },
            });
            identifiers.push(id);
        } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('[agenda-notif] scheduleNotificationAsync failed', err);
        }
    }

    if (identifiers.length > 0) {
        try {
            await AsyncStorage.setItem(`${KEY_PREFIX}${agendaId}`, JSON.stringify(identifiers));
        } catch { /* silencioso: si no persistimos ID, no podremos cancelar */ }
    }
    return identifiers;
}

/** Cancela las notificaciones programadas para una fecha de agenda. */
export async function cancelAgendaReminders(agendaId) {
    const Notifications = await loadNotifications();
    if (!Notifications) return;

    let identifiers = [];
    try {
        const raw = await AsyncStorage.getItem(`${KEY_PREFIX}${agendaId}`);
        if (raw) identifiers = JSON.parse(raw);
    } catch { return; }

    for (const id of identifiers) {
        try { await Notifications.cancelScheduledNotificationAsync(id); }
        catch { /* si ya se disparó o no existe, ignoramos */ }
    }
    try { await AsyncStorage.removeItem(`${KEY_PREFIX}${agendaId}`); }
    catch { /* silencioso */ }
}
