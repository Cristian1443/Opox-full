/**
 * Tipos compartidos del Bloque 5 · Motivación y Gamificación.
 */

export type RankingScope = 'weekly' | 'global' | 'oposicion';
export type ClanRole = 'leader' | 'member';

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
}
