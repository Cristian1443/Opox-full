/**
 * Envío de push notifications vía Expo Push Notification Service.
 * https://docs.expo.dev/push-notifications/sending-notifications/
 *
 * TODO: implementar cuando se aborde el bloque de notificaciones
 * (rachas, BOE updates, chat de clanes, recordatorios de estudio).
 */
export interface PushToken {
    userId: string;
    expoPushToken: string;
    platform: 'ios' | 'android';
}

export interface PushMessage {
    to: string; // Expo push token
    title: string;
    body: string;
    data?: Record<string, unknown>;
}

export class ExpoPushService {
    constructor(private readonly accessToken?: string) { }

    async send(_messages: PushMessage[]): Promise<void> {
        // TODO: POST a https://exp.host/--/api/v2/push/send
        // con Authorization: Bearer ${this.accessToken}
        throw new Error('ExpoPushService.send: pendiente de implementar');
    }
}
