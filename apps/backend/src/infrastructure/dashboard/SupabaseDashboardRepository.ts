import type { SupabaseClient } from '@supabase/supabase-js';
import { STREAK_MILESTONES } from '@opox/types';
import {
    Notification,
    UserGamification,
    NotificationNotFoundError,
    type IDashboardRepository,
    type NotificationCategory,
} from '../../domain';

type NotificationRow = {
    id: string;
    user_id: string;
    category: NotificationCategory;
    icon: string;
    title: string;
    body: string;
    is_nudge: boolean;
    nudge_kind: 'fatigue' | 'academic' | 'boe' | null;
    primary_label: string | null;
    secondary_label: string | null;
    action_route: string | null;
    read_at: string | null;
    created_at: string;
};

type GamificationRow = {
    user_id: string;
    current_streak: number;
    longest_streak: number;
    opopoints_balance: number;
    last_activity_date: string | null;
    updated_at: string;
};

function toDomainNotification(row: NotificationRow): Notification {
    return Notification.create({
        id: row.id,
        userId: row.user_id,
        category: row.category,
        icon: row.icon,
        title: row.title,
        body: row.body,
        isNudge: row.is_nudge,
        nudgeKind: row.nudge_kind,
        primaryLabel: row.primary_label,
        secondaryLabel: row.secondary_label,
        actionRoute: row.action_route,
        readAt: row.read_at ? new Date(row.read_at) : null,
        createdAt: new Date(row.created_at),
    });
}

// La racha usa Europe/Madrid como zona horaria de referencia global (app
// dirigida a opositores en España). Así todos los usuarios ven el mismo
// corte de día, sin importar dónde estén ni el reloj de su dispositivo.
function todayMadrid(): string {
    return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid' }).format(new Date());
}

function previousDayIso(isoDate: string): string {
    const d = new Date(`${isoDate}T00:00:00.000Z`);
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
}

// Valida un YYYY-MM-DD estricto — evita que un cliente malicioso mande
// cualquier string y controle el corte de día. Regex pura para no arrastrar
// nada más.
const LOCAL_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function normalizeLocalDate(localDate: string | undefined | null): string {
    if (localDate && LOCAL_DATE_RE.test(localDate)) return localDate;
    return todayMadrid();
}

function toDomainGamification(row: GamificationRow, localDate?: string): UserGamification {
    const last = row.last_activity_date;
    // El "hoy" para computar decay debe respetar la TZ del cliente. Antes
    // usábamos siempre Madrid → para usuarios en Colombia (UTC-5) la ventana
    // 17:00-23:59 hora local se solapa con la madrugada del día siguiente en
    // Madrid, y toda la actividad de "ayer + hoy" quedaba registrada como
    // "mismo día Madrid" → la racha nunca subía porque `last === today`.
    const today = normalizeLocalDate(localDate);
    const yesterday = previousDayIso(today);
    const effectiveStreak = (last === today || last === yesterday) ? row.current_streak : 0;
    return UserGamification.create({
        userId: row.user_id,
        currentStreak: effectiveStreak,
        longestStreak: row.longest_streak,
        opopointsBalance: row.opopoints_balance,
        lastActivityDate: row.last_activity_date,
        updatedAt: new Date(row.updated_at),
    });
}

/** Cursor opaco = created_at en base64, para no filtrar el formato interno. */
function encodeCursor(createdAt: string): string {
    return Buffer.from(createdAt, 'utf8').toString('base64');
}
function decodeCursor(cursor: string): string {
    return Buffer.from(cursor, 'base64').toString('utf8');
}

/**
 * Implementación de IDashboardRepository usando Supabase.
 * Tablas: `notifications`, `user_gamification`, `opopoints_ledger`
 * (ver apps/backend/supabase/bloque2_dashboard.sql).
 */
export class SupabaseDashboardRepository implements IDashboardRepository {
    constructor(private readonly supabaseAdmin: SupabaseClient) { }

    // ─── Notificaciones ────────────────────────────

    async listNotifications(input: {
        userId: string;
        category?: NotificationCategory;
        limit: number;
        cursor?: string | null;
    }): Promise<{ items: Notification[]; nextCursor: string | null }> {
        let query = this.supabaseAdmin
            .from('notifications')
            .select('*')
            .eq('user_id', input.userId)
            .order('created_at', { ascending: false })
            .limit(input.limit + 1);

        if (input.category) query = query.eq('category', input.category);
        if (input.cursor) query = query.lt('created_at', decodeCursor(input.cursor));

        const { data, error } = await query;
        if (error) throw new Error(`listNotifications: ${error.message}`);

        const rows = (data ?? []) as NotificationRow[];
        const hasMore = rows.length > input.limit;
        const pageRows = hasMore ? rows.slice(0, input.limit) : rows;

        return {
            items: pageRows.map(toDomainNotification),
            nextCursor: hasMore ? encodeCursor(pageRows[pageRows.length - 1]!.created_at) : null,
        };
    }

    async getUnreadNotificationCount(userId: string): Promise<number> {
        const { count, error } = await this.supabaseAdmin
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .is('read_at', null);
        if (error) throw new Error(`getUnreadNotificationCount: ${error.message}`);
        return count ?? 0;
    }

    async getNextPendingNudge(userId: string): Promise<Notification | null> {
        const { data, error } = await this.supabaseAdmin
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .eq('is_nudge', true)
            .is('read_at', null)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();
        if (error) throw new Error(`getNextPendingNudge: ${error.message}`);
        return data ? toDomainNotification(data as NotificationRow) : null;
    }

    async markNotificationRead(input: { userId: string; notificationId: string }): Promise<Notification> {
        const { data, error } = await this.supabaseAdmin
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('id', input.notificationId)
            .eq('user_id', input.userId)
            .select('*')
            .maybeSingle();
        if (error) throw new Error(`markNotificationRead: ${error.message}`);
        if (!data) throw new NotificationNotFoundError();
        return toDomainNotification(data as NotificationRow);
    }

    async markAllNotificationsRead(userId: string): Promise<{ updated: number }> {
        const { data, error } = await this.supabaseAdmin
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('user_id', userId)
            .is('read_at', null)
            .select('id');
        if (error) throw new Error(`markAllNotificationsRead: ${error.message}`);
        return { updated: data?.length ?? 0 };
    }

    async createNotification(input: {
        userId: string;
        category: NotificationCategory;
        icon: string;
        title: string;
        body: string;
        isNudge?: boolean;
        nudgeKind?: 'fatigue' | 'academic' | 'boe' | null;
        primaryLabel?: string | null;
        secondaryLabel?: string | null;
        actionRoute?: string | null;
    }): Promise<Notification> {
        const { data, error } = await this.supabaseAdmin
            .from('notifications')
            .insert({
                user_id: input.userId,
                category: input.category,
                icon: input.icon,
                title: input.title,
                body: input.body,
                is_nudge: input.isNudge ?? false,
                nudge_kind: input.nudgeKind ?? null,
                primary_label: input.primaryLabel ?? null,
                secondary_label: input.secondaryLabel ?? null,
                action_route: input.actionRoute ?? null,
            })
            .select('*')
            .single();
        if (error || !data) throw new Error(`createNotification: ${error?.message}`);
        return toDomainNotification(data as NotificationRow);
    }

    // ─── Gamificación ──────────────────────────────

    async getGamification(userId: string): Promise<UserGamification> {
        // Upsert idempotente: si ya existe, el conflicto solo reescribe
        // user_id sobre sí mismo (no toca racha/puntos); si no existe,
        // lo crea con los defaults en cero de la tabla.
        const { data, error } = await this.supabaseAdmin
            .from('user_gamification')
            .upsert({ user_id: userId }, { onConflict: 'user_id' })
            .select('*')
            .single();
        if (error || !data) throw new Error(`getGamification: ${error?.message}`);
        return toDomainGamification(data as GamificationRow);
    }

    async registerActivity(input: {
        userId: string;
        reason: string;
        points: number;
        localDate?: string;
    }): Promise<UserGamification> {
        // La racha respeta la TZ del cliente vía `input.localDate`. Fallback a
        // Madrid solo cuando el mobile no lo envía (código legado). Antes
        // ignorábamos `input.localDate` y usábamos siempre Madrid — bug para
        // opositores en TZs distantes (Colombia UTC-5, Canarias UTC+0): la
        // actividad de "ayer noche" (Colombia) caía en el mismo día Madrid
        // que "hoy mañana", y la racha nunca incrementaba.
        // Además leemos la fila cruda — no `getGamification`, que devolvería
        // `effectiveStreak` caducado y romperia el +1 al escribir.
        const { data: rawRow, error: readError } = await this.supabaseAdmin
            .from('user_gamification')
            .upsert({ user_id: input.userId }, { onConflict: 'user_id' })
            .select('*')
            .single();
        if (readError || !rawRow) throw new Error(`registerActivity read: ${readError?.message}`);
        const current = UserGamification.create({
            userId: rawRow.user_id,
            currentStreak: rawRow.current_streak,
            longestStreak: rawRow.longest_streak,
            opopointsBalance: rawRow.opopoints_balance,
            lastActivityDate: rawRow.last_activity_date,
            updatedAt: new Date(rawRow.updated_at),
        });
        const today = normalizeLocalDate(input.localDate);
        // Primero simulamos la actividad SIN puntos para conocer `newStreak` y
        // detectar el cruce de hito. Si la racha cruza un umbral (7/14/21/…),
        // añadimos el bonus al `points` que ya venía. Antes de este cambio la
        // app anunciaba "+50 Opopoints por racha de 7 días" en `MotivationHomeScreen`
        // pero el backend nunca los otorgaba.
        const preview = current.withActivity(today, 0);
        const crossedMilestone = STREAK_MILESTONES.find(
            (m) => current.currentStreak < m.days && m.days <= preview.currentStreak,
        );
        const milestoneBonus = crossedMilestone?.points ?? 0;
        const totalPoints = input.points + milestoneBonus;
        const effectiveReason = crossedMilestone
            ? `${input.reason}+streak_milestone_${crossedMilestone.days}`
            : input.reason;
        const next = current.withActivity(today, totalPoints);

        const { data, error } = await this.supabaseAdmin
            .from('user_gamification')
            .update({
                current_streak: next.currentStreak,
                longest_streak: next.longestStreak,
                opopoints_balance: next.opopointsBalance,
                last_activity_date: next.lastActivityDate,
                updated_at: next.updatedAt.toISOString(),
            })
            .eq('user_id', input.userId)
            .select('*')
            .single();
        if (error || !data) throw new Error(`registerActivity: ${error?.message}`);

        // Ledger de auditoría — insert-only. Si falla no revertimos el saldo
        // (ya persistido arriba), solo se pierde el registro histórico.
        const { error: ledgerError } = await this.supabaseAdmin
            .from('opopoints_ledger')
            .insert({ user_id: input.userId, amount: totalPoints, reason: effectiveReason });
        if (ledgerError) {
            // eslint-disable-next-line no-console
            console.error('[dashboard registerActivity] ledger insert failed:', ledgerError.message);
        }

        // Puente earn → store ledger: getBalance() de la tienda lee user_opopoints_ledger
        // (solo recibe filas spend). Sin esta fila earn el saldo siempre sería 0.
        if (totalPoints > 0) {
            const { error: earnError } = await this.supabaseAdmin
                .from('user_opopoints_ledger')
                .insert({ user_id: input.userId, type: 'earn', amount: totalPoints, reason: effectiveReason, ref_id: null });
            if (earnError) {
                // eslint-disable-next-line no-console
                console.error('[dashboard registerActivity] earn ledger insert failed:', earnError.message);
            }
        }

        return toDomainGamification(data as GamificationRow, today);
    }
}
