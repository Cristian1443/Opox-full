/**
 * Tipos compartidos del Bloque 2 · Dashboard.
 * Consumidos tanto por el backend como por el mobile.
 */

export type NotificationCategory = 'boe' | 'social' | 'general';
export type NudgeKind = 'fatigue' | 'academic' | 'boe';

export interface NotificationDTO {
    id: string;
    category: NotificationCategory;
    /** Clave de icono que el mobile mapea a su SVG (ej. "boe", "fatigue", "streak", "social", "goal") */
    icon: string;
    title: string;
    body: string;
    /** true si debe mostrarse como bottom-sheet flotante (2.4) en vez de en la bandeja */
    isNudge: boolean;
    nudgeKind?: NudgeKind;
    /** Texto del botón principal — solo presente en nudges */
    primaryLabel?: string;
    /** Texto del botón secundario — solo presente en nudges */
    secondaryLabel?: string;
    /** Ruta/pantalla a la que navega el botón principal, si aplica */
    actionRoute?: string;
    /** ISO 8601; ausente si no se ha leído */
    readAt?: string;
    createdAt: string;
}

export interface GamificationDTO {
    currentStreak: number;
    longestStreak: number;
    opopointsBalance: number;
}

/** Widget cuyo bloque propietario aún no existe — el mobile pinta el placeholder del wireframe */
export interface UnavailableWidgetDTO {
    available: false;
}

export interface DashboardSummaryDTO {
    profile: {
        displayName: string | null;
        oposicion: string | null;
        especialidad: string | null;
    };
    gamification: GamificationDTO;
    notifications: {
        unreadCount: number;
    };
    nextNudge: NotificationDTO | null;
    /** Bloque 3 · Salud — pendiente */
    health: UnavailableWidgetDTO;
    /** Bloque 4 · Planificación — pendiente */
    plan: UnavailableWidgetDTO;
    /** Última ley / último error / simulacro en curso (Bloque 10 y motor de exámenes) — pendiente */
    quickAccess: UnavailableWidgetDTO;
}

// ─── Requests ────────────────────────────────────

export interface ListNotificationsQuery {
    category?: NotificationCategory;
    cursor?: string;
    limit?: number;
}

export interface CreateNotificationRequest {
    category: NotificationCategory;
    icon: string;
    title: string;
    body: string;
    isNudge?: boolean;
    nudgeKind?: NudgeKind;
    primaryLabel?: string;
    secondaryLabel?: string;
    actionRoute?: string;
}

export interface RegisterActivityRequest {
    /** Identificador corto de qué generó la actividad, ej. "test_completed" */
    reason: string;
    /** Opopoints a sumar (puede ser negativo para penalizaciones) */
    points: number;
}
