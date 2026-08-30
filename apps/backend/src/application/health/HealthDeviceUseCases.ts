import type { IHealthRepository } from '../../domain';
import type { UserDevice } from '../../domain/entities';

export class GetDevicesUseCase {
    constructor(private readonly healthRepo: IHealthRepository) {}

    async execute(userId: string): Promise<UserDevice[]> {
        return this.healthRepo.getDevices(userId);
    }
}

export class RegisterDeviceUseCase {
    constructor(private readonly healthRepo: IHealthRepository) {}

    async execute(params: {
        userId: string;
        deviceName: string;
        platform: string;
        icon: string;
    }): Promise<UserDevice> {
        return this.healthRepo.registerDevice(params);
    }
}

export class DeleteDeviceUseCase {
    constructor(private readonly healthRepo: IHealthRepository) {}

    async execute(id: string, userId: string): Promise<void> {
        return this.healthRepo.deleteDevice(id, userId);
    }
}
