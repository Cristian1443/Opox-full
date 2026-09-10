import type { IAuthRepository, IDashboardRepository, ITrainingRepository, Notification } from '../../domain';

/**
 * Agregado de arranque del Dashboard (2.1 + 2.2). Combina lo que Bloque 2
 * posee de verdad (perfil, racha/Opopoints, notificaciones) con stubs
 * `{ available: false }` para los widgets que dependen de bloques que aún
 * no existen (Salud = Bloque 3, Plan = Bloque 4). `quickAccess` ("continúa
 * donde lo dejaste") sí tiene datos reales — cada campo es null si el
 * usuario todavía no tiene esa actividad registrada.
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
    quickAccess: {
        available: true;
        lastLaw: { law: string; article: string | null; articleTitle: string | null; topicId: string | null } | null;
        lastError: { topicId: string; topic: string; failRate: number } | null;
        mockInProgress: { mockExamId: string; examTitle: string; percent: number } | null;
    };
}

export class GetDashboardSummaryUseCase {
    constructor(
        private readonly authRepo: IAuthRepository,
        private readonly dashboardRepo: IDashboardRepository,
        private readonly trainingRepo: ITrainingRepository,
    ) { }

    async execute(input: { userId: string; accessToken: string }): Promise<DashboardSummary> {
        const [session, gamification, unreadCount, nextNudge, lastLawView, errorPatterns, mockProgress] = await Promise.all([
            this.authRepo.getSession(input.accessToken),
            this.dashboardRepo.getGamification(input.userId),
            this.dashboardRepo.getUnreadNotificationCount(input.userId),
            this.dashboardRepo.getNextPendingNudge(input.userId),
            this.trainingRepo.getLastLawView(input.userId),
            this.trainingRepo.listErrorPatterns(input.userId),
            this.trainingRepo.getMockProgress(input.userId),
        ]);

        const topError = errorPatterns[0] ?? null;

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
            quickAccess: {
                available: true,
                lastLaw: lastLawView
                    ? { law: lastLawView.law, article: lastLawView.article, articleTitle: lastLawView.articleTitle, topicId: lastLawView.topicId }
                    : null,
                lastError: topError
                    ? { topicId: topError.topicId, topic: topError.topic, failRate: topError.failRate }
                    : null,
                mockInProgress: mockProgress
                    ? {
                        mockExamId: mockProgress.mockExamId,
                        examTitle: mockProgress.examTitle,
                        percent: mockProgress.questionCount > 0
                            ? Math.round((mockProgress.currentIndex / mockProgress.questionCount) * 100)
                            : 0,
                    }
                    : null,
            },
        };
    }
}
