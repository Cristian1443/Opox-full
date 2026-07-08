import type { SupabaseClient } from '@supabase/supabase-js';
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

function toDomainGamification(row: GamificationRow): UserGamification {
    return UserGamification.create({
        userId: row.user_id,
        currentStreak: row.current_streak,
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
    }): Promise<UserGamification> {
        const current = await this.getGamification(input.userId);
        const today = new Date().toISOString().slice(0, 10);
        const next = current.withActivity(today, input.points);

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
            .insert({ user_id: input.userId, amount: input.points, reason: input.reason });
        if (ledgerError) {
            // eslint-disable-next-line no-console
            console.error('[dashboard registerActivity] ledger insert failed:', ledgerError.message);
        }

        return toDomainGamification(data as GamificationRow);
    }
}
