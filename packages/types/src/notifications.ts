// Bloque 13 · Notificaciones Push

export interface RegisterPushTokenInput {
    token: string;
    platform: 'ios' | 'android';
    deviceId: string;
}

export interface RegisterPushTokenResponse {
    registered: boolean;
}

/** Payload de data incluido en cada push, permite navegar a la pantalla correcta al tocar. */
export interface PushNotificationData {
    screen?: string;
    params?: Record<string, unknown>;
    type?: 'boe_alert' | 'note_ready' | 'streak_warning' | 'daily_reminder';
}
