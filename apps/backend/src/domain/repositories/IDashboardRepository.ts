import { Notification, NotificationCategory, UserGamification } from '../entities';

/**
 * Contrato del repositorio del Bloque 2 · Dashboard.
 * Cubre notificaciones (incluye nudges, ver `Notification.isNudge`) y el
 * snapshot de racha/Opopoints. Los widgets que dependen de bloques aún no
 * construidos (salud, plan, BOE, tutor IA) NO tienen métodos aquí — el
 * use case de resumen los devuelve como stub sin tocar este repositorio.
 */
export interface IDashboardRepository {
    // ─── Notificaciones ───────────────────────────
    listNotifications(input: {
        userId: string;
        category?: NotificationCategory;
        limit: number;
        cursor?: string | null;
    }): Promise<{ items: Notification[]; nextCursor: string | null }>;

    getUnreadNotificationCount(userId: string): Promise<number>;

    /** Nudge pendiente más antiguo sin leer, o null si no hay ninguno. */
    getNextPendingNudge(userId: string): Promise<Notification | null>;

    markNotificationRead(input: { userId: string; notificationId: string }): Promise<Notification>;

    markAllNotificationsRead(userId: string): Promise<{ updated: number }>;

    /**
     * Inserta una notificación (o nudge). Pensado para que otros bloques
     * (salud, BOE, estadísticas) la llamen cuando existan sus motores; por
     * ahora también sirve para pruebas manuales vía el endpoint protegido.
     */
    createNotification(input: {
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
    }): Promise<Notification>;

    // ─── Gamificación (racha + Opopoints) ─────────
    getGamification(userId: string): Promise<UserGamification>;

    /** Registra actividad de hoy: actualiza racha y suma Opopoints. */
    registerActivity(input: { userId: string; reason: string; points: number }): Promise<UserGamification>;
}
