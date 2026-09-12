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
    { accessType: 'read', recordType: 'HeartRateVariabilityRmssd' },
    { accessType: 'read', recordType: 'OxygenSaturation' },
    { accessType: 'read', recordType: 'SleepSession' },
    { accessType: 'read', recordType: 'Steps' },
];

export const HEALTH_PAIRING_SKIPPED_KEY = 'opox.health.pairingSkipped';

/** true si los módulos nativos de salud están disponibles en este entorno */
export function isHealthAvailable() {
    if (IS_EXPO_GO) return false;
    if (Platform.OS === 'ios') return !!HealthKit;
    if (Platform.OS === 'android') return !!HealthConnect;
    return false;
}

/**
 * En Android, comprueba si Health Connect está instalado en el dispositivo.
 * Devuelve uno de: 'available' | 'not_installed' | 'update_required' | 'not_supported' | 'not_android'.
 *
 * react-native-health-connect v3 SdkAvailabilityStatus:
 *   1 = SDK_UNAVAILABLE                          (Android < 26, no soportado)
 *   2 = SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED (HC no instalado o desactualizado)
 *   3 = SDK_AVAILABLE                            (disponible y listo)
 */
export async function getHealthConnectStatus() {
    if (Platform.OS !== 'android') return 'not_android';
    if (!HealthConnect) return 'not_installed';
    try {
        const status = await HealthConnect.getSdkStatus();
        if (status === 3) return 'available';
        if (status === 2) return 'update_required';
        if (status === 1) return 'not_supported';
        return 'not_supported';
    } catch (err) {
        console.warn('[HealthService] getSdkStatus error:', err);
        return 'not_installed';
    }
}

/**
 * Comprueba si la app ya tiene todos los permisos de Health Connect concedidos
 * sin abrir ningún diálogo. Útil para detectar "ya conectado" antes de entrar al flujo.
 *
 * Validación estricta por recordType — no por longitud — para evitar falsos
 * positivos cuando el usuario tiene N permisos de otro tipo ya concedidos.
 */
export async function hasAllHealthPermissions() {
    if (!isHealthAvailable() || Platform.OS !== 'android' || !HealthConnect) return false;
    try {
        const granted = (await HealthConnect.getGrantedPermissions()) ?? [];
        return ANDROID_PERMISSIONS.every((required) =>
            granted.some(
                (g) =>
                    g.recordType === required.recordType &&
                    g.accessType === required.accessType,
            ),
        );
    } catch {
        return false;
    }
}

/** Abre Google Play Store en la ficha de Health Connect para que el usuario lo instale/actualice. */
export function openHealthConnectPlayStore() {
    if (Platform.OS !== 'android') return;
    const url = 'market://details?id=com.google.android.apps.healthdata';
    const fallback = 'https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata';
    try {
        require('react-native').Linking.openURL(url).catch(() =>
            require('react-native').Linking.openURL(fallback),
        );
    } catch {
        require('react-native').Linking.openURL(fallback).catch(() => {});
    }
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
            // Comprobar disponibilidad ANTES de pedir permisos — evita crash
            // nativo si Health Connect no está instalado en el dispositivo.
            const status = await getHealthConnectStatus();
            if (status !== 'available') {
                console.warn('[HealthService] Health Connect no disponible:', status);
                return false;
            }
            // Si ya tiene todos los permisos, no abrir el diálogo de nuevo.
            // requestPermission llamado sobre permisos ya concedidos puede abrir
            // el diálogo de HC de nuevo (molestia) o devolver [] silenciosamente
            // si el usuario denegó con "no volver a preguntar" (confusión).
            const existing = await HealthConnect.getGrantedPermissions().catch(() => []);
            if (Array.isArray(existing) && existing.length >= ANDROID_PERMISSIONS.length) {
                return true;
            }
            // v3: no se llama initialize() — requestPermission() directamente.
            // initialize() en v3 lanza excepción nativa desde ciertos contextos
            // de Activity de Expo, que JS try/catch no intercepta → crash.
            const granted = await HealthConnect.requestPermission(ANDROID_PERMISSIONS);
            return Array.isArray(granted) && granted.length > 0;
        } catch (err) {
            // Error completo en log para detectar UninitializedPropertyAccessException
            // (indica que HealthConnectPermissionDelegate no fue inicializado en onCreate)
            // u otros crashes nativos que no llegan como promise rejection.
            console.error('[HealthService] requestPermission error:', err?.message ?? String(err));
            if (err?.stack) console.error('[HealthService] stack:', err.stack);
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
    // v3: initialize() fue eliminado — llamarlo causa crash nativo en Activity de Expo.
    const filter = { timeRangeFilter: { operator: 'between', startTime, endTime } };

    const [hrRes, restHrRes, hrvRes, spo2Res, sleepRes, stepsRes] = await Promise.allSettled([
        HealthConnect.readRecords('HeartRate', filter),
        HealthConnect.readRecords('RestingHeartRate', filter),
        HealthConnect.readRecords('HeartRateVariabilityRmssd', filter),
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

    // HRV en Android: recordType HeartRateVariabilityRmssd, campo heartRateVariabilityMillis.
    const hrvRecord = lastRecord(hrvRes);
    const hrv = hrvRecord?.heartRateVariabilityMillis != null
        ? Math.round(hrvRecord.heartRateVariabilityMillis)
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

    return { heartRate, restingHeartRate, hrv, spo2, sleepHours, steps };
}

// ─── Historial de métricas ────────────────────────────────────────────────────

/**
 * Devuelve puntos de historial para una métrica y rango temporal dados.
 * Más reciente al final. En Expo Go o sin módulos nativos devuelve datos mock.
 *
 * @param {'hrv'|'heartRate'|'restingHeartRate'|'spo2'|'sleep'|'steps'} metricType
 * @param {'Día'|'Semana'|'Mes'} range
 * @returns {Promise<number[]>}
 */
export async function getMetricHistory(metricType, range) {
    if (!isHealthAvailable()) return _mockHistoryPoints(range);

    // TODO(bloque3-history): implementar con HealthKit queryStatisticsCollectionQuery (iOS)
    // o getAggregateRecord (Android Health Connect) para datos reales por intervalo.
    return _mockHistoryPoints(range);
}

// Formas mock con tendencia realista — la pantalla normaliza contra chartMax,
// así que la escala absoluta no importa; solo importa la forma de la curva.
function _mockHistoryPoints(range) {
    if (range === 'Día') {
        return [38, 42, 40, 37, 45, 43, 41, 44, 46, 43, 42, 45];
    }
    if (range === 'Mes') {
        return [35, 38, 40, 36, 42, 39, 44, 41, 46, 43, 48, 45, 50, 47,
                49, 48, 53, 50, 55, 52, 54, 56, 53, 58, 55, 57, 59, 56, 60, 62];
    }
    // 'Semana' (default)
    return [40, 45, 38, 50, 42, 48, 43];
}
