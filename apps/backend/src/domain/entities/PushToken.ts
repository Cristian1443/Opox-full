export interface PushToken {
    id: string;
    userId: string;
    token: string;
    platform: 'ios' | 'android';
    deviceId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface UpsertPushTokenInput {
    userId: string;
    token: string;
    platform: 'ios' | 'android';
    deviceId: string;
}
