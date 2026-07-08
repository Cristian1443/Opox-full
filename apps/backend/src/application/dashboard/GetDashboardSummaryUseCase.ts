import type { IAuthRepository, IDashboardRepository, Notification } from '../../domain';

/**
 * Agregado de arranque del Dashboard (2.1 + 2.2). Combina lo que Bloque 2
 * posee de verdad (perfil, racha/Opopoints, notificaciones) con stubs
 * `{ available: false }` para los widgets que dependen de bloques que aún
 * no existen (Salud = Bloque 3, Plan = Bloque 4, última ley/BOE = Bloque 10,
 * Repaso IA = Bloque 8). El mobile usa `available` para decidir si pinta
 * el widget con datos reales o con el placeholder del wireframe.
 */
export interface DashboardSummary {
    profile: {
        displayName: string | null;
        oposicion: string | null;
        especialidad: string | null;
    };
    gamification: {
        currentStreak: number;
        longestStreak: number;
        opopointsBalance: number;
    };
    notifications: {
        unreadCount: number;
    };
    nextNudge: Notification | null;
    health: { available: false };
    plan: { available: false };
    quickAccess: { available: false };
}

export class GetDashboardSummaryUseCase {
    constructor(
        private readonly authRepo: IAuthRepository,
        private readonly dashboardRepo: IDashboardRepository,
    ) { }

    async execute(input: { userId: string; accessToken: string }): Promise<DashboardSummary> {
        const [session, gamification, unreadCount, nextNudge] = await Promise.all([
            this.authRepo.getSession(input.accessToken),
            this.dashboardRepo.getGamification(input.userId),
            this.dashboardRepo.getUnreadNotificationCount(input.userId),
            this.dashboardRepo.getNextPendingNudge(input.userId),
        ]);

        return {
            profile: {
                displayName: session.user.displayName,
                oposicion: session.user.oposicion,
                especialidad: session.user.especialidad,
            },
            gamification: {
                currentStreak: gamification.currentStreak,
                longestStreak: gamification.longestStreak,
                opopointsBalance: gamification.opopointsBalance,
            },
            notifications: { unreadCount },
            nextNudge,
            health: { available: false },
            plan: { available: false },
            quickAccess: { available: false },
        };
    }
}
