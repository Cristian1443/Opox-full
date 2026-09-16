/**
 * Tipos compartidos del Bloque 5 · Motivación y Gamificación.
 */

export type RankingScope = 'weekly' | 'global' | 'oposicion' | 'topic';
export type ClanRole = 'leader' | 'member';

/**
 * Hitos de racha con premio de Opopoints. Fuente de verdad única que consumen:
 *  - `StreakDetailUseCase` (para calcular `nextMilestone`).
 *  - `SupabaseDashboardRepository.registerActivity` (para OTORGAR el premio
 *    cuando la racha CRUZA un hito — antes esto no ocurría: la app mostraba
 *    "+50 Opopoints" pero nunca los daba).
 *  - `MotivationHomeScreen.js` / `StreakDetailScreen.js` (fallback local si el
 *    endpoint no está disponible).
 *
 * Regla: solo se otorga el bonus cuando `oldStreak < milestone.days <= newStreak`
 * — pasar del día 6 al 7 da +50 una sola vez, aunque el usuario mantenga la racha.
 */
export const STREAK_MILESTONES: readonly { days: number; points: number }[] = [
    { days: 7,   points: 50   },
    { days: 14,  points: 100  },
    { days: 21,  points: 200  },
    { days: 30,  points: 300  },
    { days: 60,  points: 500  },
    { days: 100, points: 1000 },
];

export interface ProfileDTO {
    displayName: string | null;
    oposicion: string | null;
    avatarUrl: string | null;
    passedExamAt?: string;
}

export interface MotivationSummaryDTO {
    gamification: { currentStreak: number; longestStreak: number; opopointsBalance: number };
    myClan: { id: string; name: string; initials: string; memberCount: number } | null;
}

export interface StreakDetailDTO {
    currentStreak: number;
    longestStreak: number;
    recentActivityDates: string[];
    nextMilestone?: { days: number; points: number; remaining: number };
}

export interface RankingEntryDTO {
    userId: string;
    displayName: string | null;
    avatarUrl: string | null;
    points: number;
    position: number;
}

export interface RankingResultDTO {
    entries: RankingEntryDTO[];
    me: RankingEntryDTO | null;
}

export interface ClanSummaryDTO {
    id: string;
    name: string;
    initials: string;
    description?: string;
    memberCount: number;
    challengeCount: number;
}

export interface ClanMemberDTO {
    userId: string;
    displayName: string | null;
    role: ClanRole;
    points: number;
}

export interface ClanDetailDTO {
    id: string;
    name: string;
    initials: string;
    description?: string;
    memberCount: number;
    challengeCount: number;
    rankPosition: number | null;
    members: ClanMemberDTO[];
}

export interface ClanMessageDTO {
    id: string;
    userId: string;
    body: string;
    createdAt: string;
}

export interface ClanChallengeDTO {
    id: string;
    title: string;
    subtitle?: string;
    questionCount: number;
    rewardPoints: number;
    expiresAt?: string;
    completedCount: number;
    memberCount: number;
    completedByMe: boolean;
    topicId?: string;
}

export interface CompleteChallengeResultDTO {
    gamification: { currentStreak: number; longestStreak: number; opopointsBalance: number };
    alreadyCompleted: boolean;
}

// ─── Requests ────────────────────────────────────

export interface CreateClanRequest {
    name: string;
    initials: string;
    description?: string;
}

export interface SendClanMessageRequest {
    body: string;
}

export interface CreateClanChallengeRequest {
    title: string;
    subtitle?: string;
    questionCount: number;
    rewardPoints: number;
    expiresAt?: string;
    topicId?: string;
}
