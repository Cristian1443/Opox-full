import type { PushToken, UpsertPushTokenInput } from '../entities/PushToken';

export interface IPushRepository {
    /** Inserta o actualiza el token del dispositivo (UNIQUE por user_id + device_id). */
    upsertToken(input: UpsertPushTokenInput): Promise<PushToken>;
    /** Devuelve todos los tokens registrados de un usuario (puede tener varios dispositivos). */
    getTokensByUser(userId: string): Promise<PushToken[]>;
    /** Devuelve todos los tokens de la plataforma (para broadcasts). */
    getAllTokens(): Promise<PushToken[]>;
    /** Elimina el token de un dispositivo específico. */
    deleteToken(userId: string, deviceId: string): Promise<void>;
}
