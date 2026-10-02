import type { SupabaseClient } from '@supabase/supabase-js';
import type { IConfigRepository } from '../../domain/repositories';
import type {
    UserPreferences,
    UpdatePreferencesInput,
    ProStats,
    ProStatsWeekPoint,
    AppTheme,
    TonePersonality,
    DetailLevel,
    HintStyle,
    ReinforcementLevel,
} from '../../domain/entities';
import { logger } from '@opox/utils';
import { enrichTopicsWithLabels, HEX_ID_RE } from '../shared/topicLabels';

const DEFAULT_PREFS = {
    personality: 'cercano' as TonePersonality,
    detail_level: 1 as DetailLevel,
    hint_style: 'directas' as HintStyle,
    reinforcement_level: 'normal' as ReinforcementLevel,
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
        if (input.personality !== undefined)         patch.personality          = input.personality;
        if (input.detailLevel !== undefined)         patch.detail_level         = input.detailLevel;
        if (input.hintStyle !== undefined)           patch.hint_style           = input.hintStyle;
        if (input.reinforcementLevel !== undefined)  patch.reinforcement_level  = input.reinforcementLevel;
        if (input.theme !== undefined)               patch.theme                = input.theme;
        if (input.fontScale !== undefined)           patch.font_scale           = input.fontScale;
        if (input.reduceMotion !== undefined)        patch.reduce_motion        = input.reduceMotion;

        const { data, error } = await this.db
            .from('user_preferences')
            .upsert(patch, { onConflict: 'user_id' })
            .select()
            .single();
        if (error || !data) {
            logger.error('[config-repo] upsertPreferences', { error });
            return {
                userId,
                personality: (patch.personality ?? DEFAULT_PREFS.personality) as TonePersonality,
                detailLevel: (patch.detail_level ?? DEFAULT_PREFS.detail_level) as DetailLevel,
                hintStyle: (patch.hint_style ?? DEFAULT_PREFS.hint_style) as HintStyle,
                reinforcementLevel: (patch.reinforcement_level ?? DEFAULT_PREFS.reinforcement_level) as ReinforcementLevel,
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
            .select('topic_id, topic, is_correct, time_secs, answered_at')
            .eq('user_id', userId);

        if (error) logger.error('[config-repo] getProStats responses', { error });

        // Streak actual desde user_gamification (bloque 2)
        // La columna es `current_streak` (bloque2_dashboard.sql). Antes se pedía
        // `streak_days`, que no existe → la query fallaba y la racha salía siempre
        // 0 (y la probabilidad de aprobado quedaba infravalorada). Misma regla de
        // caducidad que SupabaseDashboardRepository: sin actividad hoy ni ayer → 0.
        const { data: gam } = await this.db
            .from('user_gamification')
            .select('current_streak, last_activity_date')
            .eq('user_id', userId)
            .maybeSingle();
        const gamRow = gam as { current_streak?: number; last_activity_date?: string | null } | null;
        const todayIso = new Date().toISOString().slice(0, 10);
        const yesterdayIso = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
        const lastActive = gamRow?.last_activity_date ?? null;
        const streakDays = lastActive === todayIso || lastActive === yesterdayIso
            ? (gamRow?.current_streak ?? 0)
            : 0;

        const safeRows = (rows ?? []) as Array<{ topic_id: string; topic: string; is_correct: boolean; time_secs: number | null; answered_at: string }>;

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

        // Enriquecer con "Tema N" — mismo helper que listErrorPatterns. Antes de
        // esto el mobile pintaba UUIDs hex crudos en la sección "Dominio por tema"
        // porque el aggregate leía `training_attempt_responses.topic` que trae el ID.
        const posMap = await enrichTopicsWithLabels(this.db, [...byTopic.keys()]);

        const topicBreakdown = Array.from(byTopic.entries())
            .map(([topicId, v]) => ({
                topicId,
                topic: posMap.get(topicId) ?? v.topic,
                total: v.total,
                correct: v.correct,
                accuracyPct: Math.round((v.correct / v.total) * 100),
            }))
            // Filtrar hex IDs sin resolver — coincide con el filtro de listErrorPatterns
            // para no mostrar "0acb39953a424c20" al usuario.
            .filter((t) => !HEX_ID_RE.test(t.topic) && t.topicId !== 'all');

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
            weeklyAccuracy: buildWeeklyAccuracy(safeRows, WEEKS_IN_TREND),
            accuracyDeltaMonth: buildAccuracyDeltaMonth(safeRows),
            computedAt: new Date(),
        };
    }
}

// ── Evolución del acierto (Estadísticas Pro) ──────────────────────────────────

const WEEKS_IN_TREND = 8;
const DAY_MS = 86_400_000;
// Por debajo de este número de respuestas en una ventana de 30 días la
// comparación mensual no es representativa → se devuelve null.
const MIN_ANSWERS_FOR_DELTA = 5;

type AnsweredRow = { is_correct: boolean; answered_at: string };

function startOfWeekUtc(d: Date): Date {
    const day = d.getUTCDay();             // 0 = domingo
    const diffToMonday = (day + 6) % 7;
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - diffToMonday));
}

function buildWeeklyAccuracy(rows: AnsweredRow[], weeks: number): ProStatsWeekPoint[] {
    const currentWeek = startOfWeekUtc(new Date());
    const buckets = Array.from({ length: weeks }, (_, i) => ({
        start: new Date(currentWeek.getTime() - (weeks - 1 - i) * 7 * DAY_MS),
        total: 0,
        correct: 0,
    }));
    const firstStart = buckets[0]!.start.getTime();
    for (const r of rows) {
        const t = new Date(r.answered_at).getTime();
        if (Number.isNaN(t) || t < firstStart) continue;
        const idx = Math.floor((t - firstStart) / (7 * DAY_MS));
        const bucket = buckets[idx];
        if (!bucket) continue;
        bucket.total++;
        if (r.is_correct) bucket.correct++;
    }
    return buckets.map((b) => ({
        weekStart: b.start.toISOString().slice(0, 10),
        total: b.total,
        accuracyPct: b.total > 0 ? Math.round((b.correct / b.total) * 100) : null,
    }));
}

function buildAccuracyDeltaMonth(rows: AnsweredRow[]): number | null {
    const now = Date.now();
    const recent = { total: 0, correct: 0 };
    const previous = { total: 0, correct: 0 };
    for (const r of rows) {
        const age = now - new Date(r.answered_at).getTime();
        const target = age <= 30 * DAY_MS ? recent : age <= 60 * DAY_MS ? previous : null;
        if (!target) continue;
        target.total++;
        if (r.is_correct) target.correct++;
    }
    if (recent.total < MIN_ANSWERS_FOR_DELTA || previous.total < MIN_ANSWERS_FOR_DELTA) return null;
    return Math.round((recent.correct / recent.total) * 100 - (previous.correct / previous.total) * 100);
}

// ── Mappers ───────────────────────────────────────────────────────────────────

function mapPrefs(row: Record<string, unknown>): UserPreferences {
    // Normalización de personalidad legacy: 'equilibrado'→'cercano', 'exigente'→'formal'
    const rawPersonality = (row.personality ?? DEFAULT_PREFS.personality) as string;
    const personality = (rawPersonality === 'equilibrado' ? 'cercano'
        : rawPersonality === 'exigente' ? 'formal'
        : rawPersonality) as TonePersonality;

    // Retrocompatibilidad: si hint_style no existe en BD, leer direct_hints (boolean)
    const hintStyle: HintStyle = row.hint_style
        ? (row.hint_style as HintStyle)
        : (row.direct_hints ? 'directas' : 'socraticas');

    // Retrocompatibilidad: si reinforcement_level no existe, leer motivational (boolean)
    const reinforcementLevel: ReinforcementLevel = row.reinforcement_level
        ? (row.reinforcement_level as ReinforcementLevel)
        : (row.motivational ? 'alto' : 'normal');

    return {
        userId:             row.user_id as string,
        personality,
        detailLevel:        (row.detail_level ?? DEFAULT_PREFS.detail_level) as DetailLevel,
        hintStyle,
        reinforcementLevel,
        theme:              (row.theme       ?? DEFAULT_PREFS.theme)        as AppTheme,
        fontScale:          (row.font_scale  ?? DEFAULT_PREFS.font_scale)   as number,
        reduceMotion:       (row.reduce_motion ?? DEFAULT_PREFS.reduce_motion) as boolean,
        updatedAt:          new Date(row.updated_at as string),
    };
}
