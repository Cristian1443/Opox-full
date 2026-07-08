import { Profile, Clan, ClanRole, ClanMessage, ClanChallenge } from '../entities';

export type RankingScope = 'weekly' | 'global' | 'oposicion';

export interface RankingEntry {
    userId: string;
    displayName: string | null;
    avatarUrl: string | null;
    points: number;
    position: number;
}

export interface RankingResult {
    entries: RankingEntry[];
    me: RankingEntry | null;
}

export interface ClanSummary {
    clan: Clan;
    memberCount: number;
}

export interface ClanMemberView {
    userId: string;
    displayName: string | null;
    role: ClanRole;
    points: number;
}

export interface ClanDetail {
    clan: Clan;
    memberCount: number;
    rankPosition: number | null;
    members: ClanMemberView[];
}

export interface ChallengeWithProgress {
    challenge: ClanChallenge;
    completedCount: number;
    memberCount: number;
    completedByMe: boolean;
}

/** Contrato del repositorio del Bloque 5 · Motivación y Gamificación. */
export interface IMotivationRepository {
    // ─── Perfil público ────────────────────────────
    getProfile(userId: string): Promise<Profile>;
    markExamPassed(userId: string): Promise<Profile>;

    /** Fechas (YYYY-MM-DD) con actividad de Opopoints en los últimos `days` días. */
    getRecentActivityDays(userId: string, days: number): Promise<string[]>;

    // ─── Rankings ──────────────────────────────────
    listRanking(input: { userId: string; scope: RankingScope; limit: number }): Promise<RankingResult>;

    // ─── Clanes ────────────────────────────────────
    getMyClan(userId: string): Promise<Clan | null>;
    listClans(input: { userId: string; limit: number }): Promise<ClanSummary[]>;
    createClan(input: {
        userId: string;
        name: string;
        initials: string;
        description?: string | null;
    }): Promise<Clan>;
    joinClan(input: { userId: string; clanId: string }): Promise<void>;
    getClanDetail(input: { userId: string; clanId: string }): Promise<ClanDetail>;

    // ─── Chat de clan (polling) ────────────────────
    listClanMessages(input: {
        clanId: string;
        userId: string;
        after?: string | null;
        limit: number;
    }): Promise<ClanMessage[]>;
    sendClanMessage(input: { clanId: string; userId: string; body: string }): Promise<ClanMessage>;

    // ─── Retos de clan ─────────────────────────────
    listClanChallenges(input: { clanId: string; userId: string }): Promise<ChallengeWithProgress[]>;
    createClanChallenge(input: {
        clanId: string;
        userId: string;
        title: string;
        subtitle?: string | null;
        questionCount: number;
        rewardPoints: number;
        expiresAt?: string | null;
    }): Promise<ChallengeWithProgress>;
    completeChallenge(input: { challengeId: string; userId: string }): Promise<void>;

    // ─── Muro de la Gloria (Fase 2 — solo lectura real) ───
    listGraduates(input: { clanId: string; userId: string }): Promise<Profile[]>;
}
