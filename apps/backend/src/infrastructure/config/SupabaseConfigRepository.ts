import type { SupabaseClient } from '@supabase/supabase-js';
import type { IConfigRepository } from '../../domain/repositories';
import type {
    UserPreferences,
    UpdatePreferencesInput,
    ProStats,
    AppTheme,
    TonePersonality,
    DetailLevel,
} from '../../domain/entities';
import { logger } from '@opox/utils';

const DEFAULT_PREFS = {
    personality: 'equilibrado' as TonePersonality,
    detail_level: 1 as DetailLevel,
    direct_hints: false,
    motivational: true,
    theme: 'auto' as AppTheme,
    font_scale: 1.0,
    reduce_motion: false,
};

export class SupabaseConfigRepository implements IConfigRepository {
    constructor(private readonly db: SupabaseClient) {}

    // ── Preferencias ──────────────────────────────────────────────────────────

    async getPreferences(userId: string): Promise<UserPreferences | null> {
        const { data, error } = await this.db
            .from('user_preferences')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
        if (error) { logger.error('[config-repo] getPreferences', { error }); return null; }
        return data ? mapPrefs(data) : null;
    }

    async upsertPreferences(userId: string, input: UpdatePreferencesInput): Promise<UserPreferences> {
        const patch: Record<string, unknown> = { user_id: userId, updated_at: new Date().toISOString() };
        if (input.personality !== undefined)  patch.personality   = input.personality;
        if (input.detailLevel !== undefined)  patch.detail_level  = input.detailLevel;
        if (input.directHints !== undefined)  patch.direct_hints  = input.directHints;
        if (input.motivational !== undefined) patch.motivational  = input.motivational;
        if (input.theme !== undefined)        patch.theme         = input.theme;
        if (input.fontScale !== undefined)    patch.font_scale    = input.fontScale;
        if (input.reduceMotion !== undefined) patch.reduce_motion = input.reduceMotion;

        const { data, error } = await this.db
            .from('user_preferences')
            .upsert(patch, { onConflict: 'user_id' })
            .select()
            .single();
        if (error || !data) {
            logger.error('[config-repo] upsertPreferences', { error });
            // Si la upsert falla (row bloqueada, etc.) retornamos un objeto con defaults
            return {
                userId,
                personality: (patch.personality ?? DEFAULT_PREFS.personality) as TonePersonality,
                detailLevel: (patch.detail_level ?? DEFAULT_PREFS.detail_level) as DetailLevel,
                directHints: (patch.direct_hints ?? DEFAULT_PREFS.direct_hints) as boolean,
                motivational: (patch.motivational ?? DEFAULT_PREFS.motivational) as boolean,
                theme: (patch.theme ?? DEFAULT_PREFS.theme) as AppTheme,
                fontScale: (patch.font_scale ?? DEFAULT_PREFS.font_scale) as number,
                reduceMotion: (patch.reduce_motion ?? DEFAULT_PREFS.reduce_motion) as boolean,
                updatedAt: new Date(),
            };
        }
        return mapPrefs(data);
    }

    // ── Feedback ──────────────────────────────────────────────────────────────

    async submitFeedback(params: {
        userId: string;
        type: 'suggestion' | 'bug' | 'other';
        message: string;
    }): Promise<void> {
        const { error } = await this.db.from('user_feedback').insert({
            user_id: params.userId,
            type: params.type,
            message: params.message,
        });
        if (error) logger.error('[config-repo] submitFeedback', { error });
    }

    // ── Exportar PDF ──────────────────────────────────────────────────────────

    async storePdfReport(userId: string, period: string, pdfBuffer: Buffer): Promise<string> {
        const BUCKET = 'pro-stats-exports';
        // Crear el bucket si no existe (idempotente)
        await this.db.storage.createBucket(BUCKET, { public: false }).catch(() => {});

        const filename = `${userId}/${period}_${Date.now()}.pdf`;
        const { error: uploadError } = await this.db.storage
            .from(BUCKET)
            .upload(filename, pdfBuffer, { contentType: 'application/pdf', upsert: true });
        if (uploadError) throw new Error(`storePdfReport upload: ${uploadError.message}`);

        const { data, error: urlError } = await this.db.storage
            .from(BUCKET)
            .createSignedUrl(filename, 3600); // 1 hora
        if (urlError || !data?.signedUrl) throw new Error(`storePdfReport url: ${urlError?.message}`);

        return data.signedUrl;
    }

    // ── Pro Stats ─────────────────────────────────────────────────────────────

    async getProStats(userId: string): Promise<ProStats> {
        // Agregación sobre training_attempt_responses (una fila por pregunta respondida)
        const { data: rows, error } = await this.db
            .from('training_attempt_responses')
            .select('topic_id, topic, is_correct, time_secs')
            .eq('user_id', userId);

        if (error) logger.error('[config-repo] getProStats responses', { error });

        // Streak actual desde user_gamification (bloque 2)
        const { data: gam } = await this.db
            .from('user_gamification')
            .select('streak_days')
            .eq('user_id', userId)
            .maybeSingle();
        const streakDays = (gam as { streak_days?: number } | null)?.streak_days ?? 0;

        const safeRows = (rows ?? []) as Array<{ topic_id: string; topic: string; is_correct: boolean; time_secs: number | null }>;

        // Totales globales
        const totalQuestions = safeRows.length;
        const correctQuestions = safeRows.filter(r => r.is_correct).length;
        const accuracyPct = totalQuestions > 0
            ? Math.round((correctQuestions / totalQuestions) * 100)
            : 0;

        // Heurística de probabilidad de aprobar (accuracy + racha)
        const passedProbabilityPct = Math.min(
            100,
            Math.round(accuracyPct * 0.85 + Math.min(streakDays, 30) * 0.5),
        );

        // Agrupación por tema
        const byTopic = new Map<string, { topic: string; total: number; correct: number }>();
        for (const r of safeRows) {
            const existing = byTopic.get(r.topic_id) ?? { topic: r.topic, total: 0, correct: 0 };
            existing.total++;
            if (r.is_correct) existing.correct++;
            byTopic.set(r.topic_id, existing);
        }

        const topicBreakdown = Array.from(byTopic.entries()).map(([topicId, v]) => ({
            topicId,
            topic: v.topic,
            total: v.total,
            correct: v.correct,
            accuracyPct: Math.round((v.correct / v.total) * 100),
        }));

        const topicsAttempted = topicBreakdown.length;
        const topicsStrong = topicBreakdown.filter(t => t.accuracyPct >= 80).length;
        const topicsWeak   = topicBreakdown.filter(t => t.accuracyPct < 50).length;

        const rowsWithTime = safeRows.filter(r => r.time_secs != null);
        const avgSecsPerQuestion = rowsWithTime.length > 0
            ? Math.round(rowsWithTime.reduce((sum, r) => sum + (r.time_secs as number), 0) / rowsWithTime.length)
            : null;

        return {
            totalQuestions,
            correctQuestions,
            accuracyPct,
            passedProbabilityPct,
            studyStreakDays: streakDays,
            topicsAttempted,
            topicsStrong,
            topicsWeak,
            topicBreakdown,
            avgSecsPerQuestion,
            computedAt: new Date(),
        };
    }
}

// ── Mappers ───────────────────────────────────────────────────────────────────

function mapPrefs(row: Record<string, unknown>): UserPreferences {
    return {
        userId:       row.user_id as string,
        personality:  (row.personality  ?? DEFAULT_PREFS.personality)  as TonePersonality,
        detailLevel:  (row.detail_level ?? DEFAULT_PREFS.detail_level)  as DetailLevel,
        directHints:  (row.direct_hints ?? DEFAULT_PREFS.direct_hints)  as boolean,
        motivational: (row.motivational ?? DEFAULT_PREFS.motivational)  as boolean,
        theme:        (row.theme        ?? DEFAULT_PREFS.theme)         as AppTheme,
        fontScale:    (row.font_scale   ?? DEFAULT_PREFS.font_scale)    as number,
        reduceMotion: (row.reduce_motion ?? DEFAULT_PREFS.reduce_motion) as boolean,
        updatedAt:    new Date(row.updated_at as string),
    };
}
