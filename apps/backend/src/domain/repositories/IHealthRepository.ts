import type { UserDevice } from '../entities';

export interface IHealthRepository {
    getDevices(userId: string): Promise<UserDevice[]>;
    registerDevice(params: {
        userId: string;
        deviceName: string;
        platform: string;
        icon: string;
    }): Promise<UserDevice>;
    deleteDevice(id: string, userId: string): Promise<void>;
}
