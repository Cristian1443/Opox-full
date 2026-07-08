import type { SupabaseClient } from '@supabase/supabase-js';
import {
    Profile,
    Clan,
    ClanMessage,
    ClanChallenge,
    ClanNotFoundError,
    AlreadyInClanError,
    NotClanMemberError,
    ChallengeNotFoundError,
    type IMotivationRepository,
    type RankingScope,
    type RankingResult,
    type RankingEntry,
    type ClanSummary,
    type ClanDetail,
    type ClanMemberView,
    type ClanRole,
    type ChallengeWithProgress,
} from '../../domain';

const UNIQUE_VIOLATION = '23505';

type ProfileRow = {
    id: string;
    display_name: string | null;
    oposicion: string | null;
    especialidad: string | null;
    avatar_url: string | null;
    passed_exam_at: string | null;
};

type ClanRow = {
    id: string;
    name: string;
    initials: string;
    description: string | null;
    created_by: string | null;
    created_at: string;
};

type MessageRow = {
    id: string;
    clan_id: string;
    user_id: string;
    body: string;
    created_at: string;
};

type ChallengeRow = {
    id: string;
    clan_id: string;
    created_by: string | null;
    title: string;
    subtitle: string | null;
    question_count: number;
    reward_points: number;
    expires_at: string | null;
    created_at: string;
};

type RankingRow = {
    user_id: string;
    points: number;
    display_name: string | null;
    avatar_url: string | null;
    oposicion: string | null;
};

function toDomainProfile(row: ProfileRow): Profile {
    return Profile.create({
        id: row.id,
        displayName: row.display_name,
        oposicion: row.oposicion,
        especialidad: row.especialidad,
        avatarUrl: row.avatar_url,
        passedExamAt: row.passed_exam_at ? new Date(row.passed_exam_at) : null,
    });
}

function toDomainClan(row: ClanRow): Clan {
    return Clan.create({
        id: row.id,
        name: row.name,
        initials: row.initials,
        description: row.description,
        createdBy: row.created_by,
        createdAt: new Date(row.created_at),
    });
}

function toDomainMessage(row: MessageRow): ClanMessage {
    return ClanMessage.create({
        id: row.id,
        clanId: row.clan_id,
        userId: row.user_id,
        body: row.body,
        createdAt: new Date(row.created_at),
    });
}

function toDomainChallenge(row: ChallengeRow): ClanChallenge {
    return ClanChallenge.create({
        id: row.id,
        clanId: row.clan_id,
        createdBy: row.created_by,
        title: row.title,
        subtitle: row.subtitle,
        questionCount: row.question_count,
        rewardPoints: row.reward_points,
        expiresAt: row.expires_at ? new Date(row.expires_at) : null,
        createdAt: new Date(row.created_at),
    });
}

/**
 * Implementación de IMotivationRepository usando Supabase.
 * Tablas/vistas: `profiles`, `clans`, `clan_members`, `clan_messages`,
 * `clan_challenges`, `clan_challenge_progress`, `ranking_global`,
 * `ranking_weekly`, `clan_points` (ver apps/backend/supabase/bloque5_motivacion.sql).
 *
 * PostgREST no detecta relaciones para embeber `clan_members` con
 * `profiles`/`user_gamification` (ambas solo comparten FK indirecta vía
 * auth.users), así que las combinaciones de miembros se resuelven con
 * queries separadas fusionadas en memoria — aceptable al tamaño de clan
 * de este MVP (decenas de miembros, no miles).
 */
export class SupabaseMotivationRepository implements IMotivationRepository {
    constructor(private readonly supabaseAdmin: SupabaseClient) { }

    // ─── Perfil público ────────────────────────────

    async getProfile(userId: string): Promise<Profile> {
        const { data, error } = await this.supabaseAdmin
            .from('profiles')
            .upsert({ id: userId }, { onConflict: 'id' })
            .select('*')
            .single();
        if (error || !data) throw new Error(`getProfile: ${error?.message}`);
        return toDomainProfile(data as ProfileRow);
    }

    async markExamPassed(userId: string): Promise<Profile> {
        const { data, error } = await this.supabaseAdmin
            .from('profiles')
            .update({ passed_exam_at: new Date().toISOString(), updated_at: new Date().toISOString() })
            .eq('id', userId)
            .select('*')
            .single();
        if (error || !data) throw new Error(`markExamPassed: ${error?.message}`);
        return toDomainProfile(data as ProfileRow);
    }

    async getRecentActivityDays(userId: string, days: number): Promise<string[]> {
        const since = new Date(Date.now() - days * 86400000).toISOString();
        const { data, error } = await this.supabaseAdmin
            .from('opopoints_ledger')
            .select('created_at')
            .eq('user_id', userId)
            .gte('created_at', since);
        if (error) throw new Error(`getRecentActivityDays: ${error.message}`);

        const dates = new Set<string>();
        for (const row of (data ?? []) as Array<{ created_at: string }>) {
            dates.add(row.created_at.slice(0, 10));
        }
        return Array.from(dates).sort();
    }

    // ─── Rankings ──────────────────────────────────

    async listRanking(input: { userId: string; scope: RankingScope; limit: number }): Promise<RankingResult> {
        const view = input.scope === 'weekly' ? 'ranking_weekly' : 'ranking_global';

        let filterOposicion: string | null = null;
        if (input.scope === 'oposicion') {
            const me = await this.getProfile(input.userId);
            filterOposicion = me.oposicion;
            if (!filterOposicion) {
                return { entries: [], me: null };
            }
        }

        let query = this.supabaseAdmin.from(view).select('*').order('points', { ascending: false }).limit(input.limit);
        if (filterOposicion) query = query.eq('oposicion', filterOposicion);

        const { data, error } = await query;
        if (error) throw new Error(`listRanking: ${error.message}`);

        const rows = (data ?? []) as RankingRow[];
        const entries: RankingEntry[] = rows.map((row, i) => ({
            userId: row.user_id,
            displayName: row.display_name,
            avatarUrl: row.avatar_url,
            points: Number(row.points),
            position: i + 1,
        }));

        const inTopN = entries.find((e) => e.userId === input.userId);
        if (inTopN) return { entries, me: inTopN };

        // No está en el top N visible: resolvemos su posición aparte para
        // "fijarla abajo" (wireframe 5.3), sin recargar todo el ranking.
        let meQuery = this.supabaseAdmin.from(view).select('*').eq('user_id', input.userId);
        if (filterOposicion) meQuery = meQuery.eq('oposicion', filterOposicion);
        const { data: meRow } = await meQuery.maybeSingle();
        if (!meRow) return { entries, me: null };

        const myPoints = Number((meRow as RankingRow).points);
        let aboveQuery = this.supabaseAdmin
            .from(view)
            .select('user_id', { count: 'exact', head: true })
            .gt('points', myPoints);
        if (filterOposicion) aboveQuery = aboveQuery.eq('oposicion', filterOposicion);
        const { count } = await aboveQuery;

        return {
            entries,
            me: {
                userId: input.userId,
                displayName: (meRow as RankingRow).display_name,
                avatarUrl: (meRow as RankingRow).avatar_url,
                points: myPoints,
                position: (count ?? 0) + 1,
            },
        };
    }

    // ─── Clanes ────────────────────────────────────

    async getMyClan(userId: string): Promise<Clan | null> {
        const { data: membership, error: memErr } = await this.supabaseAdmin
            .from('clan_members')
            .select('clan_id')
            .eq('user_id', userId)
            .maybeSingle();
        if (memErr) throw new Error(`getMyClan: ${memErr.message}`);
        if (!membership) return null;

        const { data, error } = await this.supabaseAdmin
            .from('clans')
            .select('*')
            .eq('id', membership.clan_id as string)
            .maybeSingle();
        if (error) throw new Error(`getMyClan: ${error.message}`);
        return data ? toDomainClan(data as ClanRow) : null;
    }

    async listClans(input: { userId: string; limit: number }): Promise<ClanSummary[]> {
        const myClan = await this.getMyClan(input.userId);

        let query = this.supabaseAdmin
            .from('clans')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(input.limit);
        if (myClan) query = query.neq('id', myClan.id);

        const { data, error } = await query;
        if (error) throw new Error(`listClans: ${error.message}`);
        const clans = (data ?? []) as ClanRow[];
        if (clans.length === 0) return [];

        const { data: memberRows, error: memErr } = await this.supabaseAdmin
            .from('clan_members')
            .select('clan_id')
            .in('clan_id', clans.map((c) => c.id));
        if (memErr) throw new Error(`listClans: ${memErr.message}`);

        const counts = new Map<string, number>();
        for (const row of (memberRows ?? []) as Array<{ clan_id: string }>) {
            counts.set(row.clan_id, (counts.get(row.clan_id) ?? 0) + 1);
        }

        return clans.map((c) => ({ clan: toDomainClan(c), memberCount: counts.get(c.id) ?? 0 }));
    }

    async createClan(input: {
        userId: string;
        name: string;
        initials: string;
        description?: string | null;
    }): Promise<Clan> {
        const existing = await this.getMyClan(input.userId);
        if (existing) throw new AlreadyInClanError();

        const { data: clanRow, error: clanErr } = await this.supabaseAdmin
            .from('clans')
            .insert({
                name: input.name,
                initials: input.initials,
                description: input.description ?? null,
                created_by: input.userId,
            })
            .select('*')
            .single();
        if (clanErr || !clanRow) throw new Error(`createClan: ${clanErr?.message}`);

        const { error: memberErr } = await this.supabaseAdmin
            .from('clan_members')
            .insert({ clan_id: clanRow.id, user_id: input.userId, role: 'leader' });
        if (memberErr) {
            if (memberErr.code === UNIQUE_VIOLATION) throw new AlreadyInClanError();
            throw new Error(`createClan: ${memberErr.message}`);
        }

        return toDomainClan(clanRow as ClanRow);
    }

    async joinClan(input: { userId: string; clanId: string }): Promise<void> {
        const { data: clanRow, error: clanErr } = await this.supabaseAdmin
            .from('clans')
            .select('id')
            .eq('id', input.clanId)
            .maybeSingle();
        if (clanErr) throw new Error(`joinClan: ${clanErr.message}`);
        if (!clanRow) throw new ClanNotFoundError();

        const existing = await this.getMyClan(input.userId);
        if (existing) throw new AlreadyInClanError();

        const { error } = await this.supabaseAdmin
            .from('clan_members')
            .insert({ clan_id: input.clanId, user_id: input.userId, role: 'member' });
        if (error) {
            if (error.code === UNIQUE_VIOLATION) throw new AlreadyInClanError();
            throw new Error(`joinClan: ${error.message}`);
        }
    }

    private async resolveMemberViews(clanId: string): Promise<ClanMemberView[]> {
        const { data: memberRows, error: memErr } = await this.supabaseAdmin
            .from('clan_members')
            .select('user_id, role')
            .eq('clan_id', clanId);
        if (memErr) throw new Error(`resolveMemberViews: ${memErr.message}`);

        const members = (memberRows ?? []) as Array<{ user_id: string; role: ClanRole }>;
        if (members.length === 0) return [];
        const userIds = members.map((m) => m.user_id);

        const [{ data: profileRows, error: profErr }, { data: pointsRows, error: pointsErr }] = await Promise.all([
            this.supabaseAdmin.from('profiles').select('id, display_name').in('id', userIds),
            this.supabaseAdmin.from('user_gamification').select('user_id, opopoints_balance').in('user_id', userIds),
        ]);
        if (profErr) throw new Error(`resolveMemberViews: ${profErr.message}`);
        if (pointsErr) throw new Error(`resolveMemberViews: ${pointsErr.message}`);

        const nameById = new Map<string, string | null>();
        for (const p of (profileRows ?? []) as Array<{ id: string; display_name: string | null }>) {
            nameById.set(p.id, p.display_name);
        }
        const pointsById = new Map<string, number>();
        for (const g of (pointsRows ?? []) as Array<{ user_id: string; opopoints_balance: number }>) {
            pointsById.set(g.user_id, g.opopoints_balance);
        }

        return members
            .map((m) => ({
                userId: m.user_id,
                displayName: nameById.get(m.user_id) ?? null,
                role: m.role,
                points: pointsById.get(m.user_id) ?? 0,
            }))
            .sort((a, b) => b.points - a.points);
    }

    async getClanDetail(input: { userId: string; clanId: string }): Promise<ClanDetail> {
        const { data: clanRow, error } = await this.supabaseAdmin
            .from('clans')
            .select('*')
            .eq('id', input.clanId)
            .maybeSingle();
        if (error) throw new Error(`getClanDetail: ${error.message}`);
        if (!clanRow) throw new ClanNotFoundError();

        const members = await this.resolveMemberViews(input.clanId);

        const { data: pointsRow } = await this.supabaseAdmin
            .from('clan_points')
            .select('points')
            .eq('clan_id', input.clanId)
            .maybeSingle();
        const myPoints = pointsRow ? Number((pointsRow as { points: number }).points) : 0;

        const { count } = await this.supabaseAdmin
            .from('clan_points')
            .select('clan_id', { count: 'exact', head: true })
            .gt('points', myPoints);

        return {
            clan: toDomainClan(clanRow as ClanRow),
            memberCount: members.length,
            rankPosition: (count ?? 0) + 1,
            members,
        };
    }

    // ─── Chat de clan ──────────────────────────────

    private async assertMember(clanId: string, userId: string): Promise<void> {
        const { data, error } = await this.supabaseAdmin
            .from('clan_members')
            .select('user_id')
            .eq('clan_id', clanId)
            .eq('user_id', userId)
            .maybeSingle();
        if (error) throw new Error(`assertMember: ${error.message}`);
        if (!data) throw new NotClanMemberError();
    }

    async listClanMessages(input: {
        clanId: string;
        userId: string;
        after?: string | null;
        limit: number;
    }): Promise<ClanMessage[]> {
        await this.assertMember(input.clanId, input.userId);

        let query = this.supabaseAdmin
            .from('clan_messages')
            .select('*')
            .eq('clan_id', input.clanId)
            .order('created_at', { ascending: true })
            .limit(input.limit);
        if (input.after) query = query.gt('created_at', input.after);

        const { data, error } = await query;
        if (error) throw new Error(`listClanMessages: ${error.message}`);
        return ((data ?? []) as MessageRow[]).map(toDomainMessage);
    }

    async sendClanMessage(input: { clanId: string; userId: string; body: string }): Promise<ClanMessage> {
        await this.assertMember(input.clanId, input.userId);

        const { data, error } = await this.supabaseAdmin
            .from('clan_messages')
            .insert({ clan_id: input.clanId, user_id: input.userId, body: input.body })
            .select('*')
            .single();
        if (error || !data) throw new Error(`sendClanMessage: ${error?.message}`);
        return toDomainMessage(data as MessageRow);
    }

    // ─── Retos de clan ─────────────────────────────

    async listClanChallenges(input: { clanId: string; userId: string }): Promise<ChallengeWithProgress[]> {
        await this.assertMember(input.clanId, input.userId);

        const [{ data: challengeRows, error }, memberCount] = await Promise.all([
            this.supabaseAdmin
                .from('clan_challenges')
                .select('*')
                .eq('clan_id', input.clanId)
                .order('created_at', { ascending: false }),
            this.supabaseAdmin
                .from('clan_members')
                .select('user_id', { count: 'exact', head: true })
                .eq('clan_id', input.clanId)
                .then((r) => r.count ?? 0),
        ]);
        if (error) throw new Error(`listClanChallenges: ${error.message}`);

        const challenges = (challengeRows ?? []) as ChallengeRow[];
        if (challenges.length === 0) return [];

        const { data: progressRows, error: progErr } = await this.supabaseAdmin
            .from('clan_challenge_progress')
            .select('challenge_id, user_id')
            .in('challenge_id', challenges.map((c) => c.id));
        if (progErr) throw new Error(`listClanChallenges: ${progErr.message}`);

        const progress = (progressRows ?? []) as Array<{ challenge_id: string; user_id: string }>;

        return challenges.map((c) => {
            const forThis = progress.filter((p) => p.challenge_id === c.id);
            return {
                challenge: toDomainChallenge(c),
                completedCount: forThis.length,
                memberCount,
                completedByMe: forThis.some((p) => p.user_id === input.userId),
            };
        });
    }

    async createClanChallenge(input: {
        clanId: string;
        userId: string;
        title: string;
        subtitle?: string | null;
        questionCount: number;
        rewardPoints: number;
        expiresAt?: string | null;
    }): Promise<ChallengeWithProgress> {
        await this.assertMember(input.clanId, input.userId);

        const { data, error } = await this.supabaseAdmin
            .from('clan_challenges')
            .insert({
                clan_id: input.clanId,
                created_by: input.userId,
                title: input.title,
                subtitle: input.subtitle ?? null,
                question_count: input.questionCount,
                reward_points: input.rewardPoints,
                expires_at: input.expiresAt ?? null,
            })
            .select('*')
            .single();
        if (error || !data) throw new Error(`createClanChallenge: ${error?.message}`);

        const { count } = await this.supabaseAdmin
            .from('clan_members')
            .select('user_id', { count: 'exact', head: true })
            .eq('clan_id', input.clanId);

        return {
            challenge: toDomainChallenge(data as ChallengeRow),
            completedCount: 0,
            memberCount: count ?? 0,
            completedByMe: false,
        };
    }

    async completeChallenge(input: { challengeId: string; userId: string }): Promise<void> {
        const { data: challengeRow, error: chErr } = await this.supabaseAdmin
            .from('clan_challenges')
            .select('clan_id')
            .eq('id', input.challengeId)
            .maybeSingle();
        if (chErr) throw new Error(`completeChallenge: ${chErr.message}`);
        if (!challengeRow) throw new ChallengeNotFoundError();

        await this.assertMember(challengeRow.clan_id as string, input.userId);

        const { error } = await this.supabaseAdmin
            .from('clan_challenge_progress')
            .upsert(
                { challenge_id: input.challengeId, user_id: input.userId },
                { onConflict: 'challenge_id,user_id', ignoreDuplicates: true },
            );
        if (error) throw new Error(`completeChallenge: ${error.message}`);
    }

    // ─── Muro de la Gloria ─────────────────────────

    async listGraduates(input: { clanId: string; userId: string }): Promise<Profile[]> {
        await this.assertMember(input.clanId, input.userId);

        const { data: memberRows, error: memErr } = await this.supabaseAdmin
            .from('clan_members')
            .select('user_id')
            .eq('clan_id', input.clanId);
        if (memErr) throw new Error(`listGraduates: ${memErr.message}`);

        const userIds = ((memberRows ?? []) as Array<{ user_id: string }>).map((m) => m.user_id);
        if (userIds.length === 0) return [];

        const { data, error } = await this.supabaseAdmin
            .from('profiles')
            .select('*')
            .in('id', userIds)
            .not('passed_exam_at', 'is', null)
            .order('passed_exam_at', { ascending: false });
        if (error) throw new Error(`listGraduates: ${error.message}`);
        return ((data ?? []) as ProfileRow[]).map(toDomainProfile);
    }
}
