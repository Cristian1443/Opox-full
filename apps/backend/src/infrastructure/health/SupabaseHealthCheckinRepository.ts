import type { SupabaseClient } from '@supabase/supabase-js';
import type {
    IHealthCheckinRepository,
    SaveCheckinInput,
    SaveCheckinResult,
} from '../../domain/repositories';
import type { DailyCheckin, CheckinFactor, EnergyLevel } from '../../domain/entities';
import { ALL_CHECKIN_FACTORS } from '../../domain/entities';
import { logger } from '@opox/utils';

export class SupabaseHealthCheckinRepository implements IHealthCheckinRepository {
    constructor(private readonly db: SupabaseClient) {}

    async save(input: SaveCheckinInput): Promise<SaveCheckinResult> {
        // Detectar si ya existe para exponer el flag `created` — el upsert no
        // devuelve por sí solo si fue INSERT o UPDATE.
        const { data: existing } = await this.db
            .from('user_daily_checkins')
            .select('id')
            .eq('user_id', input.userId)
            .eq('local_date', input.localDate)
            .maybeSingle();

        const factors = sanitizeFactors(input.factors);

        const { data, error } = await this.db
            .from('user_daily_checkins')
            .upsert(
                {
                    user_id:      input.userId,
                    local_date:   input.localDate,
                    mood_score:   input.moodScore,
                    sleep_hours:  input.sleepHours,
                    energy_level: input.energyLevel,
                    factors,
                },
                { onConflict: 'user_id,local_date' },
            )
            .select()
            .single();

        if (error || !data) {
            logger.error('[health-checkin-repo] save', { error: error?.message });
            throw new Error(`saveCheckin: ${error?.message ?? 'no data'}`);
        }

        return {
            checkin: mapCheckin(data as Record<string, unknown>),
            created: !existing,
        };
    }

    async getByDate(userId: string, localDate: string): Promise<DailyCheckin | null> {
        const { data, error } = await this.db
            .from('user_daily_checkins')
            .select('*')
            .eq('user_id', userId)
            .eq('local_date', localDate)
            .maybeSingle();

        if (error) {
            logger.warn('[health-checkin-repo] getByDate', { error: error.message });
            return null;
        }
        return data ? mapCheckin(data as Record<string, unknown>) : null;
    }
}

function sanitizeFactors(input: string[]): CheckinFactor[] {
    const set = new Set(ALL_CHECKIN_FACTORS as string[]);
    return input.filter((f): f is CheckinFactor => set.has(f));
}

function mapCheckin(row: Record<string, unknown>): DailyCheckin {
    return {
        id:           row.id as string,
        userId:       row.user_id as string,
        localDate:    row.local_date as string,
        moodScore:    Number(row.mood_score),
        sleepHours:   Number(row.sleep_hours),
        energyLevel:  row.energy_level as EnergyLevel,
        factors:      sanitizeFactors((row.factors as string[]) ?? []),
        createdAt:    new Date(row.created_at as string),
        updatedAt:    new Date((row.updated_at as string) ?? (row.created_at as string)),
    };
}
