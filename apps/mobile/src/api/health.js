import { api } from './client';
import { API_ROUTES } from '@opox/constants';

export const healthApi = {
    getDevices: () =>
        api.get(API_ROUTES.HEALTH_DEVICES, { auth: true }),

    registerDevice: (deviceName, platform, icon = 'watch-outline') =>
        api.post(API_ROUTES.HEALTH_DEVICES, { deviceName, platform, icon }, { auth: true }),

    deleteDevice: (deviceId) =>
        api.delete(API_ROUTES.HEALTH_DEVICE.replace(':deviceId', deviceId), { auth: true }),
};
