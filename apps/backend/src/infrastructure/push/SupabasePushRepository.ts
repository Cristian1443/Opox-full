import type { SupabaseClient } from '@supabase/supabase-js';
import type { IPushRepository } from '../../domain/repositories/IPushRepository';
import type { PushToken, UpsertPushTokenInput } from '../../domain/entities/PushToken';
import { logger } from '@opox/utils';

export class SupabasePushRepository implements IPushRepository {
    constructor(private readonly db: SupabaseClient) {}

    async upsertToken(input: UpsertPushTokenInput): Promise<PushToken> {
        const { data, error } = await this.db
            .from('user_push_tokens')
            .upsert(
                {
                    user_id: input.userId,
                    token: input.token,
                    platform: input.platform,
                    device_id: input.deviceId,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'user_id,device_id' },
            )
            .select()
            .single();

        if (error || !data) {
            logger.error('[push-repo] upsertToken', { error });
            throw new Error('No se pudo registrar el token de notificación.');
        }
        return mapToken(data);
    }

    async getTokensByUser(userId: string): Promise<PushToken[]> {
        const { data, error } = await this.db
            .from('user_push_tokens')
            .select('*')
            .eq('user_id', userId);

        if (error) { logger.error('[push-repo] getTokensByUser', { error }); return []; }
        return (data ?? []).map(mapToken);
    }

    async getAllTokens(): Promise<PushToken[]> {
        const { data, error } = await this.db
            .from('user_push_tokens')
            .select('*');

        if (error) { logger.error('[push-repo] getAllTokens', { error }); return []; }
        return (data ?? []).map(mapToken);
    }

    async deleteToken(userId: string, deviceId: string): Promise<void> {
        const { error } = await this.db
            .from('user_push_tokens')
            .delete()
            .eq('user_id', userId)
            .eq('device_id', deviceId);

        if (error) logger.error('[push-repo] deleteToken', { error });
    }
}

function mapToken(row: Record<string, unknown>): PushToken {
    return {
        id:        row.id as string,
        userId:    row.user_id as string,
        token:     row.token as string,
        platform:  row.platform as 'ios' | 'android',
        deviceId:  row.device_id as string,
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string),
    };
}
