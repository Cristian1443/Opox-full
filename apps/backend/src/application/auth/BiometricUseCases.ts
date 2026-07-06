import type { Session, IAuthRepository } from '../../domain';

/**
 * Los use cases biométricos van agrupados porque el flujo tiene 3 pasos
 * lógicos que solo tienen sentido juntos:
 *   1. createChallenge → el server emite un challenge único
 *   2. loginWithBiometric → el mobile firma con la clave privada del dispositivo
 *      y el server verifica con la clave pública guardada
 *   3. linkBiometric → primera vez que el usuario vincula un dispositivo
 */

export class CreateBiometricChallengeUseCase {
    constructor(private readonly authRepo: IAuthRepository) { }

    execute(deviceId: string): Promise<{
        challengeId: string;
        challenge: string;
        expiresIn: number;
    }> {
        return this.authRepo.createBiometricChallenge(deviceId);
    }
}

export class LinkBiometricUseCase {
    constructor(private readonly authRepo: IAuthRepository) { }

    execute(input: {
        userId: string;
        devicePublicKey: string;
        deviceId: string;
    }): Promise<void> {
        return this.authRepo.linkBiometric(input);
    }
}

export class BiometricLoginUseCase {
    constructor(private readonly authRepo: IAuthRepository) { }

    execute(input: {
        deviceId: string;
        challengeId: string;
        signedChallenge: string;
    }): Promise<Session> {
        return this.authRepo.loginWithBiometric(input);
    }
}
