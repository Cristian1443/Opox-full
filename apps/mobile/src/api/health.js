import { api } from './client';
import { API_ROUTES } from '@opox/constants';

export const healthApi = {
    getDevices: () =>
        api.get(API_ROUTES.HEALTH_DEVICES, { auth: true }),

    registerDevice: (deviceName, platform, icon = 'watch-outline') =>
        api.post(API_ROUTES.HEALTH_DEVICES, { deviceName, platform, icon }, { auth: true }),

    deleteDevice: (deviceId) =>
        api.delete(API_ROUTES.HEALTH_DEVICE.replace(':deviceId', deviceId), { auth: true }),

    // Análisis de fatiga via Motor IA (Bloque 3). Acepta métricas de HealthKit/Health Connect.
    analyzeFatigue: ({ hrv, restingHeartRate, sleepHours } = {}) =>
        api.post(API_ROUTES.HEALTH_FATIGUE, {
            hrv: hrv ?? null,
            fc_reposo: restingHeartRate ?? null,
            sueno_horas: sleepHours ?? null,
        }, { auth: true }),
};
