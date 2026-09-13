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

    /**
     * Intenta reclamar la ejecución diaria de un cron job — atómico vía
     * restricción UNIQUE en base de datos. Devuelve `true` solo la primera
     * vez que se llama para ese job en el día de hoy (UTC); `false` si ya
     * se reclamó antes. Protege contra doble envío si el proceso se
     * reinicia/redeploya justo en la ventana del cron (node-cron corre
     * en-proceso y no es seguro frente a restarts solapados).
     */
    tryClaimDailyRun(jobName: string): Promise<boolean>;
}
