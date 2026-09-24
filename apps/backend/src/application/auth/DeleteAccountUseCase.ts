import type { IAuthRepository } from '../../domain';
import type { MotorAiClient } from '../../infrastructure/clients/MotorAiClient';

export class DeleteAccountUseCase {
    constructor(
        private readonly authRepo: IAuthRepository,
        private readonly motorAiClient?: MotorAiClient,
    ) { }

    async execute(userId: string): Promise<void> {
        // Purgar datos del Motor (RGPD) — fire-and-forget: un fallo del Motor
        // no debe impedir que el borrado de cuenta en Supabase continúe.
        if (this.motorAiClient) {
            this.motorAiClient.deleteUserData(userId).catch(() => undefined);
        }
        return this.authRepo.deleteAccount(userId);
    }
}
