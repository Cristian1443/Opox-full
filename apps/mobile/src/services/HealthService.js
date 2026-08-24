// Bloque 3 · Salud — Servicio de integración con APIs de salud del SO
// iOS:     HealthKit vía react-native-health
// Android: Health Connect vía react-native-health-connect
// No-op en Expo Go (los módulos nativos no están en el bundle de Expo Go).
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const IS_EXPO_GO = Constants.appOwnership === 'expo';

// Carga lazy igual que expo-notifications en App.js — evita crash en Expo Go
let HealthKit = null;   // iOS: @kingstinct/react-native-healthkit
let HealthConnect = null; // Android: react-native-health-connect

if (!IS_EXPO_GO) {
    if (Platform.OS === 'ios') {
        try {
            HealthKit = require('@kingstinct/react-native-healthkit').default;
        } catch (_) {
            console.warn('[HealthService] @kingstinct/react-native-healthkit no disponible');
        }
    } else if (Platform.OS === 'android') {
        try {
            HealthConnect = require('react-native-health-connect');
        } catch (_) {
            console.warn('[HealthService] react-native-health-connect no disponible');
        }
    }
}

// Identificadores HealthKit que necesitamos leer
const HK_READ_TYPES = [
    'HKQuantityTypeIdentifierHeartRate',
    'HKQuantityTypeIdentifierRestingHeartRate',
    'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
    'HKQuantityTypeIdentifierOxygenSaturation',
    'HKCategoryTypeIdentifierSleepAnalysis',
    'HKQuantityTypeIdentifierStepCount',
];

const ANDROID_PERMISSIONS = [
    { accessType: 'read', recordType: 'HeartRate' },
    { accessType: 'read', recordType: 'RestingHeartRate' },
    { accessType: 'read', recordType: 'OxygenSaturation' },
    { accessType: 'read', recordType: 'SleepSession' },
    { accessType: 'read', recordType: 'Steps' },
];

/** true si los módulos nativos de salud están disponibles en este entorno */
export function isHealthAvailable() {
    if (IS_EXPO_GO) return false;
    if (Platform.OS === 'ios') return !!HealthKit;
    if (Platform.OS === 'android') return !!HealthConnect;
    return false;
}

/**
 * Solicita permisos de lectura de salud al SO.
 * Retorna true si el usuario los concede, false si los deniega o hay error.
 */
export async function requestHealthPermissions() {
    if (!isHealthAvailable()) return false;

    if (Platform.OS === 'ios') {
        try {
            await HealthKit.requestAuthorization(HK_READ_TYPES, []);
            return true;
        } catch (err) {
            console.warn('[HealthService] HealthKit.requestAuthorization error:', err);
            return false;
        }
    }

    if (Platform.OS === 'android') {
        try {
            await HealthConnect.initialize();
            const granted = await HealthConnect.requestPermission(ANDROID_PERMISSIONS);
            return Array.isArray(granted) && granted.length > 0;
        } catch (err) {
            console.warn('[HealthService] requestPermission error:', err);
            return false;
        }
    }

    return false;
}

/**
 * Lee métricas de las últimas 24 h desde la plataforma de salud del SO.
 * Retorna null si no hay permisos o los módulos no están disponibles.
 *
 * @returns {{ heartRate, restingHeartRate, hrv, spo2, sleepHours, steps } | null}
 */
export async function getHealthMetrics() {
    if (!isHealthAvailable()) return null;

    const now = new Date();
    const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    try {
        if (Platform.OS === 'ios') {
            return await _readAppleMetrics(past24h.toISOString(), now.toISOString());
        }
        if (Platform.OS === 'android') {
            return await _readAndroidMetrics(past24h.toISOString(), now.toISOString());
        }
    } catch (err) {
        console.warn('[HealthService] getHealthMetrics error:', err);
    }
    return null;
}

// ─── Lectura iOS HealthKit vía @kingstinct/react-native-healthkit ────────────

async function _hkQuery(typeIdentifier, { from, to, limit = 1, ascending = false } = {}) {
    try {
        const results = await HealthKit.queryQuantitySamples(typeIdentifier, {
            from,
            to,
            limit,
            ascending,
        });
        return results ?? [];
    } catch {
        return [];
    }
}

async function _hkQueryCategory(typeIdentifier, { from, to } = {}) {
    try {
        return await HealthKit.queryCategorySamples(typeIdentifier, { from, to }) ?? [];
    } catch {
        return [];
    }
}

async function _readAppleMetrics(startDate, endDate) {
    const opts = { from: new Date(startDate), to: new Date(endDate) };

    const [hrSamples, restHrSamples, hrvSamples, spo2Samples, sleepSamples, stepSamples] =
        await Promise.all([
            _hkQuery('HKQuantityTypeIdentifierHeartRate', { ...opts, limit: 1, ascending: false }),
            _hkQuery('HKQuantityTypeIdentifierRestingHeartRate', { ...opts, limit: 1, ascending: false }),
            _hkQuery('HKQuantityTypeIdentifierHeartRateVariabilitySDNN', { ...opts, limit: 1, ascending: false }),
            _hkQuery('HKQuantityTypeIdentifierOxygenSaturation', { ...opts, limit: 1, ascending: false }),
            _hkQueryCategory('HKCategoryTypeIdentifierSleepAnalysis', opts),
            _hkQuery('HKQuantityTypeIdentifierStepCount', { ...opts, limit: 100, ascending: false }),
        ]);

    const lastQuantity = (samples) =>
        samples.length > 0 ? samples[0].quantity?.doubleValue ?? null : null;

    const heartRate = lastQuantity(hrSamples) != null
        ? Math.round(lastQuantity(hrSamples))
        : null;

    const restingHeartRate = lastQuantity(restHrSamples) != null
        ? Math.round(lastQuantity(restHrSamples))
        : null;

    // HRV: HealthKit devuelve en ms (SDNN)
    const hrv = lastQuantity(hrvSamples) != null
        ? Math.round(lastQuantity(hrvSamples))
        : null;

    // SpO2: HealthKit devuelve en fracción 0–1
    const spo2Raw = lastQuantity(spo2Samples);
    const spo2 = spo2Raw != null
        ? Math.round(spo2Raw <= 1 ? spo2Raw * 100 : spo2Raw)
        : null;

    // Sueño: sumar fases de sueño real (categoryValue 0=InBed, 1=Asleep, 2=Awake; HKSleepAnalysis)
    // En la API de kingstinct las fases son 'ASLEEP_CORE', 'ASLEEP_DEEP', 'ASLEEP_REM', 'ASLEEP'
    let sleepHours = null;
    if (sleepSamples.length > 0) {
        const SLEEP_PHASES = new Set(['ASLEEP', 'ASLEEP_CORE', 'ASLEEP_DEEP', 'ASLEEP_REM']);
        const totalMs = sleepSamples.reduce((acc, s) => {
            if (!SLEEP_PHASES.has(s.value)) return acc;
            return acc + (new Date(s.endDate) - new Date(s.startDate));
        }, 0);
        if (totalMs > 0) sleepHours = Math.round((totalMs / 3_600_000) * 10) / 10;
    }

    // Pasos: sumar todos los registros del periodo
    const steps = stepSamples.length > 0
        ? stepSamples.reduce((acc, s) => acc + (s.quantity?.doubleValue ?? 0), 0)
        : null;

    return { heartRate, restingHeartRate, hrv, spo2, sleepHours, steps };
}

// ─── Lectura Android Health Connect ─────────────────────────────────────────

async function _readAndroidMetrics(startTime, endTime) {
    await HealthConnect.initialize();
    const filter = { timeRangeFilter: { operator: 'between', startTime, endTime } };

    const [hrRes, restHrRes, spo2Res, sleepRes, stepsRes] = await Promise.allSettled([
        HealthConnect.readRecords('HeartRate', filter),
        HealthConnect.readRecords('RestingHeartRate', filter),
        HealthConnect.readRecords('OxygenSaturation', filter),
        HealthConnect.readRecords('SleepSession', filter),
        HealthConnect.readRecords('Steps', filter),
    ]);

    const lastRecord = (settled) => {
        const records = settled?.value?.records ?? [];
        return records.length > 0 ? records[records.length - 1] : null;
    };

    const hrRecord = lastRecord(hrRes);
    const heartRate = hrRecord?.samples?.[0]?.beatsPerMinute != null
        ? Math.round(hrRecord.samples[0].beatsPerMinute)
        : null;

    const restHrRecord = lastRecord(restHrRes);
    const restingHeartRate = restHrRecord?.beatsPerMinute != null
        ? Math.round(restHrRecord.beatsPerMinute)
        : null;

    const spo2Record = lastRecord(spo2Res);
    const spo2 = spo2Record?.percentage?.value != null
        ? Math.round(spo2Record.percentage.value)
        : null;

    const sleepRecord = lastRecord(sleepRes);
    let sleepHours = null;
    if (sleepRecord) {
        const ms = new Date(sleepRecord.endTime) - new Date(sleepRecord.startTime);
        if (ms > 0) sleepHours = Math.round((ms / 3_600_000) * 10) / 10;
    }

    const stepsRecords = stepsRes?.value?.records ?? [];
    const steps = stepsRecords.reduce((acc, r) => acc + (r.count ?? 0), 0) || null;

    return { heartRate, restingHeartRate, hrv: null, spo2, sleepHours, steps };
}
