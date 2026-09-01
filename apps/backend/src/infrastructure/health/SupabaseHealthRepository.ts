import type { SupabaseClient } from '@supabase/supabase-js';
import type { IHealthRepository } from '../../domain/repositories';
import type { UserDevice } from '../../domain/entities';
import { logger } from '@opox/utils';

export class SupabaseHealthRepository implements IHealthRepository {
    constructor(private readonly db: SupabaseClient) {}

    async getDevices(userId: string): Promise<UserDevice[]> {
        const { data, error } = await this.db
            .from('user_connected_devices')
            .select('*')
            .eq('user_id', userId)
            .order('connected_at', { ascending: false });

        if (error) {
            logger.error('[health-repo] getDevices', { error });
            return [];
        }
        return (data ?? []).map(mapDevice);
    }

    async registerDevice(params: {
        userId: string;
        deviceName: string;
        platform: string;
        icon: string;
    }): Promise<UserDevice> {
        const { data, error } = await this.db
            .from('user_connected_devices')
            .upsert(
                {
                    user_id: params.userId,
                    device_name: params.deviceName,
                    platform: params.platform,
                    icon: params.icon,
                    connected_at: new Date().toISOString(),
                },
                { onConflict: 'user_id,platform' },
            )
            .select()
            .single();

        if (error || !data) {
            logger.error('[health-repo] registerDevice', { error });
            throw new Error(`registerDevice: ${error?.message}`);
        }
        return mapDevice(data as Record<string, unknown>);
    }

    async deleteDevice(id: string, userId: string): Promise<void> {
        const { error } = await this.db
            .from('user_connected_devices')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) logger.error('[health-repo] deleteDevice', { error });
    }
}

function mapDevice(row: Record<string, unknown>): UserDevice {
    return {
        id:           row.id as string,
        userId:       row.user_id as string,
        deviceName:   row.device_name as string,
        platform:     row.platform as string,
        icon:         (row.icon as string) ?? 'watch-outline',
        connectedAt:  new Date(row.connected_at as string),
    };
}
