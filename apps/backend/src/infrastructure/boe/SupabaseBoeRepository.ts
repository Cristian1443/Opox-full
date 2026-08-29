import type { SupabaseClient } from '@supabase/supabase-js';
import type { IBoeRepository } from '../../domain';
import type {
    BoeWatchedRegulation,
    BoeChange,
    BoeChangeFragment,
    BoeChangeInput,
    BoeAlertRead,
    BoeMiniTestResult,
    TrainingTopic,
} from '../../domain/entities';
import { logger } from '@opox/utils';

export class SupabaseBoeRepository implements IBoeRepository {
    constructor(private readonly db: SupabaseClient) {}

    // ── Normas en seguimiento ─────────────────────────────────────────────────

    async listRegulations(userId: string): Promise<BoeWatchedRegulation[]> {
        const { data, error } = await this.db
            .from('boe_watched_regulations')
            .select('*')
            .eq('user_id', userId)
            .order('followed_at', { ascending: false });
        if (error) { logger.error('[boe-repo] listRegulations', { error }); return []; }
        return (data ?? []).map(mapRegulation);
    }

    async getRegulation(id: string, userId: string): Promise<BoeWatchedRegulation | null> {
        const { data, error } = await this.db
            .from('boe_watched_regulations')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .maybeSingle();
        if (error) { logger.error('[boe-repo] getRegulation', { error }); return null; }
        return data ? mapRegulation(data) : null;
    }

    async addRegulation(input: { userId: string; boeIdentifier: string; title: string; motorNormaId?: string }): Promise<BoeWatchedRegulation> {
        const { data, error } = await this.db
            .from('boe_watched_regulations')
            .upsert(
                {
                    user_id: input.userId,
                    boe_identifier: input.boeIdentifier,
                    title: input.title,
                    ...(input.motorNormaId ? { motor_norma_id: input.motorNormaId } : {}),
                },
                { onConflict: 'user_id,boe_identifier' },
            )
            .select('*')
            .single();
        if (error) throw new Error(`[boe-repo] addRegulation: ${error.message}`);
        return mapRegulation(data);
    }

    async removeRegulation(id: string, userId: string): Promise<void> {
        const { error } = await this.db
            .from('boe_watched_regulations')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);
        if (error) throw new Error(`[boe-repo] removeRegulation: ${error.message}`);
    }

    // ── Feed de cambios ───────────────────────────────────────────────────────

    async getFeedChanges(userId: string): Promise<Array<BoeChange & { isRead: boolean; isBookmarked: boolean }>> {
        // Obtener identificadores de normas seguidas por el usuario
        const { data: regs, error: regsErr } = await this.db
            .from('boe_watched_regulations')
            .select('boe_identifier')
            .eq('user_id', userId);
        if (regsErr || !regs?.length) return [];

        const identifiers = regs.map((r: any) => r.boe_identifier);

        // Obtener cambios para esas normas
        const { data: changes, error: changesErr } = await this.db
            .from('boe_changes')
            .select('*')
            .in('boe_identifier', identifiers)
            .order('detected_at', { ascending: false });
        if (changesErr || !changes?.length) return [];

        const changeIds = changes.map((c: any) => c.id);

        // Reads y bookmarks del usuario para estos cambios
        const [{ data: reads }, { data: bookmarks }] = await Promise.all([
            this.db.from('boe_alert_reads').select('change_id').eq('user_id', userId).in('change_id', changeIds),
            this.db.from('boe_alert_bookmarks').select('change_id').eq('user_id', userId).in('change_id', changeIds),
        ]);

        const readSet = new Set((reads ?? []).map((r: any) => r.change_id));
        const bookmarkSet = new Set((bookmarks ?? []).map((b: any) => b.change_id));

        return changes.map((c: any) => ({
            ...mapChange(c),
            isRead: readSet.has(c.id),
            isBookmarked: bookmarkSet.has(c.id),
        }));
    }

    // ── Detalle del cambio ────────────────────────────────────────────────────

    async getChange(changeId: string): Promise<BoeChange | null> {
        const { data, error } = await this.db
            .from('boe_changes')
            .select('*')
            .eq('id', changeId)
            .maybeSingle();
        if (error) { logger.error('[boe-repo] getChange', { error }); return null; }
        return data ? mapChange(data) : null;
    }

    async getChangeFragments(changeId: string): Promise<BoeChangeFragment[]> {
        const { data, error } = await this.db
            .from('boe_change_fragments')
            .select('*')
            .eq('change_id', changeId);
        if (error) { logger.error('[boe-repo] getChangeFragments', { error }); return []; }
        return (data ?? []).map(mapFragment);
    }

    // ── Lecturas ──────────────────────────────────────────────────────────────

    async markRead(userId: string, changeId: string): Promise<BoeAlertRead> {
        const { data, error } = await this.db
            .from('boe_alert_reads')
            .upsert({ user_id: userId, change_id: changeId }, { onConflict: 'user_id,change_id' })
            .select('*')
            .single();
        if (error) throw new Error(`[boe-repo] markRead: ${error.message}`);
        return mapRead(data);
    }

    async isRead(userId: string, changeId: string): Promise<boolean> {
        const { data } = await this.db
            .from('boe_alert_reads')
            .select('id')
            .eq('user_id', userId)
            .eq('change_id', changeId)
            .maybeSingle();
        return !!data;
    }

    // ── Marcadores ────────────────────────────────────────────────────────────

    async toggleBookmark(userId: string, changeId: string): Promise<boolean> {
        const existing = await this.isBookmarked(userId, changeId);
        if (existing) {
            await this.db
                .from('boe_alert_bookmarks')
                .delete()
                .eq('user_id', userId)
                .eq('change_id', changeId);
            return false;
        } else {
            await this.db
                .from('boe_alert_bookmarks')
                .insert({ user_id: userId, change_id: changeId });
            return true;
        }
    }

    async isBookmarked(userId: string, changeId: string): Promise<boolean> {
        const { data } = await this.db
            .from('boe_alert_bookmarks')
            .select('id')
            .eq('user_id', userId)
            .eq('change_id', changeId)
            .maybeSingle();
        return !!data;
    }

    // ── Mini-test ─────────────────────────────────────────────────────────────

    async saveMiniTestResult(input: { userId: string; changeId: string; score: number; total: number }): Promise<BoeMiniTestResult> {
        const { data, error } = await this.db
            .from('boe_mini_test_results')
            .upsert(
                { user_id: input.userId, change_id: input.changeId, score: input.score, total: input.total },
                { onConflict: 'user_id,change_id' },
            )
            .select('*')
            .single();
        if (error) throw new Error(`[boe-repo] saveMiniTestResult: ${error.message}`);
        return mapMiniTestResult(data);
    }

    async getMiniTestResult(userId: string, changeId: string): Promise<BoeMiniTestResult | null> {
        const { data } = await this.db
            .from('boe_mini_test_results')
            .select('*')
            .eq('user_id', userId)
            .eq('change_id', changeId)
            .maybeSingle();
        return data ? mapMiniTestResult(data) : null;
    }

    // ── Sincronización con Motor BOE ──────────────────────────────────────────

    async upsertChange(input: BoeChangeInput): Promise<void> {
        // Buscar si ya existe un cambio para este identificador en la misma fecha
        const dayStart = new Date(input.detectedAt);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart.getTime() + 86_400_000);

        const { data: existing } = await this.db
            .from('boe_changes')
            .select('id')
            .eq('boe_identifier', input.boeIdentifier)
            .gte('detected_at', dayStart.toISOString())
            .lt('detected_at', dayEnd.toISOString())
            .maybeSingle();

        let changeId: string;

        if (existing) {
            changeId = (existing as any).id;
            await this.db
                .from('boe_changes')
                .update({
                    affected_questions: input.affectedQuestions,
                    ...(input.resumen != null ? { resumen: input.resumen } : {}),
                })
                .eq('id', changeId);
        } else {
            const { data, error } = await this.db
                .from('boe_changes')
                .insert({
                    boe_identifier: input.boeIdentifier,
                    regulation_title: input.regulationTitle,
                    short_title: input.shortTitle,
                    articulo: input.articulo,
                    change_type: input.changeType,
                    affected_questions: input.affectedQuestions,
                    detected_at: input.detectedAt.toISOString(),
                    ...(input.resumen != null ? { resumen: input.resumen } : {}),
                })
                .select('id')
                .single();
            if (error) throw new Error(`[boe-repo] upsertChange: ${error.message}`);
            changeId = (data as any).id;
        }

        if (input.fragmentos.length > 0) {
            await this.db.from('boe_change_fragments').delete().eq('change_id', changeId);
            await this.db.from('boe_change_fragments').insert(
                input.fragmentos.map(f => ({
                    change_id: changeId,
                    frag_type: f.fragType,
                    text: f.text,
                })),
            );
        }
    }

    // ── Temas del temario ─────────────────────────────────────────────────────

    async listTopics(oposicion: string): Promise<TrainingTopic[]> {
        const { data, error } = await this.db
            .from('training_topics')
            .select('*')
            .eq('oposicion', oposicion)
            .order('sort_order', { ascending: true });
        if (error) { logger.error('[boe-repo] listTopics', { error }); return []; }
        return (data ?? []).map(mapTopic);
    }
}

// ─── Mappers (snake_case DB → camelCase domain) ───────────────────────────────

function mapRegulation(row: any): BoeWatchedRegulation {
    return {
        id: row.id,
        userId: row.user_id,
        boeIdentifier: row.boe_identifier,
        title: row.title,
        followedAt: new Date(row.followed_at),
        lastCheckedAt: row.last_checked_at ? new Date(row.last_checked_at) : null,
        motorNormaId: row.motor_norma_id ?? null,
    };
}

function mapChange(row: any): BoeChange {
    return {
        id: row.id,
        boeIdentifier: row.boe_identifier,
        regulationTitle: row.regulation_title,
        shortTitle: row.short_title,
        articulo: row.articulo,
        changeType: row.change_type,
        affectedQuestions: row.affected_questions ?? 0,
        detectedAt: new Date(row.detected_at),
        createdAt: new Date(row.created_at),
        resumen: row.resumen ?? null,
    };
}

function mapFragment(row: any): BoeChangeFragment {
    return {
        id: row.id,
        changeId: row.change_id,
        fragType: row.frag_type,
        text: row.text,
        createdAt: new Date(row.created_at),
    };
}

function mapRead(row: any): BoeAlertRead {
    return {
        id: row.id,
        userId: row.user_id,
        changeId: row.change_id,
        readAt: new Date(row.read_at),
    };
}

function mapMiniTestResult(row: any): BoeMiniTestResult {
    return {
        id: row.id,
        userId: row.user_id,
        changeId: row.change_id,
        score: row.score,
        total: row.total,
        completedAt: new Date(row.completed_at),
    };
}

function mapTopic(row: any): TrainingTopic {
    return {
        id: row.id,
        oposicion: row.oposicion,
        topicId: row.topic_id,
        label: row.label,
        sortOrder: row.sort_order,
    };
}
