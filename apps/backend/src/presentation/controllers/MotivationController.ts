import type { Request, Response, NextFunction } from 'express';
import type {
    ApiSuccessResponse,
    ProfileDTO,
    MotivationSummaryDTO,
    StreakDetailDTO,
    RankingResultDTO,
    ClanSummaryDTO,
    ClanDetailDTO,
    ClanMessageDTO,
    ClanChallengeDTO,
    CompleteChallengeResultDTO,
} from '@opox/types';
import type {
    GetMotivationSummaryUseCase,
    GetStreakDetailUseCase,
    GetRankingUseCase,
    MarkExamPassedUseCase,
    GetMyClanUseCase,
    ListClansUseCase,
    CreateClanUseCase,
    JoinClanUseCase,
    GetClanDetailUseCase,
    ListClanMessagesUseCase,
    SendClanMessageUseCase,
    ListClanChallengesUseCase,
    CreateClanChallengeUseCase,
    CompleteChallengeUseCase,
    ListGraduatesUseCase,
} from '../../application';
import type {
    Profile,
    ClanSummary,
    ClanDetail,
    ClanMessage,
    ChallengeWithProgress,
    RankingResult,
} from '../../domain';
import type { CompleteChallengeResult } from '../../application/motivation/ChallengeUseCases';

/** Controller del Bloque 5 · Motivación. Mismo patrón que Auth/Dashboard/Planning. */
export class MotivationController {
    constructor(
        private readonly deps: {
            getSummary: GetMotivationSummaryUseCase;
            getStreakDetail: GetStreakDetailUseCase;
            getRanking: GetRankingUseCase;
            markExamPassed: MarkExamPassedUseCase;
            getMyClan: GetMyClanUseCase;
            listClans: ListClansUseCase;
            createClan: CreateClanUseCase;
            joinClan: JoinClanUseCase;
            getClanDetail: GetClanDetailUseCase;
            listClanMessages: ListClanMessagesUseCase;
            sendClanMessage: SendClanMessageUseCase;
            listClanChallenges: ListClanChallengesUseCase;
            createClanChallenge: CreateClanChallengeUseCase;
            completeChallenge: CompleteChallengeUseCase;
            listGraduates: ListGraduatesUseCase;
        },
    ) { }

    // ─── Helpers de serialización ─────────────────

    private serializeProfile(p: Profile): ProfileDTO {
        return {
            displayName: p.displayName,
            oposicion: p.oposicion,
            avatarUrl: p.avatarUrl,
            ...(p.passedExamAt && { passedExamAt: p.passedExamAt.toISOString() }),
        };
    }

    private serializeClanSummary(s: ClanSummary): ClanSummaryDTO {
        return {
            id: s.clan.id,
            name: s.clan.name,
            initials: s.clan.initials,
            ...(s.clan.description && { description: s.clan.description }),
            memberCount: s.memberCount,
        };
    }

    private serializeClanDetail(d: ClanDetail): ClanDetailDTO {
        return {
            id: d.clan.id,
            name: d.clan.name,
            initials: d.clan.initials,
            ...(d.clan.description && { description: d.clan.description }),
            memberCount: d.memberCount,
            rankPosition: d.rankPosition,
            members: d.members,
        };
    }

    private serializeMessage(m: ClanMessage): ClanMessageDTO {
        return { id: m.id, userId: m.userId, body: m.body, createdAt: m.createdAt.toISOString() };
    }

    private serializeChallenge(c: ChallengeWithProgress): ClanChallengeDTO {
        return {
            id: c.challenge.id,
            title: c.challenge.title,
            ...(c.challenge.subtitle && { subtitle: c.challenge.subtitle }),
            questionCount: c.challenge.questionCount,
            rewardPoints: c.challenge.rewardPoints,
            ...(c.challenge.expiresAt && { expiresAt: c.challenge.expiresAt.toISOString() }),
            completedCount: c.completedCount,
            memberCount: c.memberCount,
            completedByMe: c.completedByMe,
        };
    }

    private serializeCompleteResult(r: CompleteChallengeResult): CompleteChallengeResultDTO {
        return {
            gamification: {
                currentStreak: r.gamification.currentStreak,
                longestStreak: r.gamification.longestStreak,
                opopointsBalance: r.gamification.opopointsBalance,
            },
            alreadyCompleted: r.alreadyCompleted,
        };
    }

    private serializeRanking(r: RankingResult): RankingResultDTO {
        return { entries: r.entries, me: r.me };
    }

    private ok<T>(res: Response, status: number, data: T): void {
        const body: ApiSuccessResponse<T> = { ok: true, data };
        res.status(status).json(body);
    }

    // ─── Handlers ─────────────────────────────────

    getSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const summary = await this.deps.getSummary.execute(req.authUser!.id);
            this.ok<MotivationSummaryDTO>(res, 200, summary);
        } catch (err) { next(err); }
    };

    getStreakDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const detail = await this.deps.getStreakDetail.execute(req.authUser!.id);
            const dto: StreakDetailDTO = {
                currentStreak: detail.currentStreak,
                longestStreak: detail.longestStreak,
                recentActivityDates: detail.recentActivityDates,
                ...(detail.nextMilestone && { nextMilestone: detail.nextMilestone }),
            };
            this.ok(res, 200, dto);
        } catch (err) { next(err); }
    };

    getRanking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const query = req.validatedQuery as { scope: 'weekly' | 'global' | 'oposicion'; limit?: number };
            const ranking = await this.deps.getRanking.execute({ userId: req.authUser!.id, ...query });
            this.ok(res, 200, this.serializeRanking(ranking));
        } catch (err) { next(err); }
    };

    markExamPassed = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const profile = await this.deps.markExamPassed.execute(req.authUser!.id);
            this.ok(res, 200, this.serializeProfile(profile));
        } catch (err) { next(err); }
    };

    getMyClan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const clan = await this.deps.getMyClan.execute(req.authUser!.id);
            this.ok(res, 200, clan ? this.serializeClanSummary({ clan, memberCount: 0 }) : null);
        } catch (err) { next(err); }
    };

    listClans = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const clans = await this.deps.listClans.execute({ userId: req.authUser!.id });
            this.ok(res, 200, clans.map((c) => this.serializeClanSummary(c)));
        } catch (err) { next(err); }
    };

    createClan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const clan = await this.deps.createClan.execute({ userId: req.authUser!.id, ...req.body });
            this.ok(res, 201, this.serializeClanSummary({ clan, memberCount: 1 }));
        } catch (err) { next(err); }
    };

    joinClan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await this.deps.joinClan.execute({ userId: req.authUser!.id, clanId: req.params['id'] as string });
            this.ok(res, 200, { joined: true });
        } catch (err) { next(err); }
    };

    getClanDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const detail = await this.deps.getClanDetail.execute({
                userId: req.authUser!.id,
                clanId: req.params['id'] as string,
            });
            this.ok(res, 200, this.serializeClanDetail(detail));
        } catch (err) { next(err); }
    };

    listClanMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const query = req.validatedQuery as { after?: string; limit?: number };
            const messages = await this.deps.listClanMessages.execute({
                userId: req.authUser!.id,
                clanId: req.params['id'] as string,
                ...query,
            });
            this.ok(res, 200, messages.map((m) => this.serializeMessage(m)));
        } catch (err) { next(err); }
    };

    sendClanMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const message = await this.deps.sendClanMessage.execute({
                userId: req.authUser!.id,
                clanId: req.params['id'] as string,
                body: req.body.body,
            });
            this.ok(res, 201, this.serializeMessage(message));
        } catch (err) { next(err); }
    };

    listClanChallenges = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const challenges = await this.deps.listClanChallenges.execute({
                userId: req.authUser!.id,
                clanId: req.params['id'] as string,
            });
            this.ok(res, 200, challenges.map((c) => this.serializeChallenge(c)));
        } catch (err) { next(err); }
    };

    createClanChallenge = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const challenge = await this.deps.createClanChallenge.execute({
                userId: req.authUser!.id,
                clanId: req.params['id'] as string,
                ...req.body,
            });
            this.ok(res, 201, this.serializeChallenge({
                challenge,
                completedCount: 0,
                memberCount: 0,
                completedByMe: false,
            }));
        } catch (err) { next(err); }
    };

    completeChallenge = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.deps.completeChallenge.execute({
                userId: req.authUser!.id,
                clanId: req.params['id'] as string,
                challengeId: req.params['challengeId'] as string,
            });
            this.ok(res, 200, this.serializeCompleteResult(result));
        } catch (err) { next(err); }
    };

    listGraduates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const graduates = await this.deps.listGraduates.execute({
                userId: req.authUser!.id,
                clanId: req.params['id'] as string,
            });
            this.ok(res, 200, graduates.map((g) => this.serializeProfile(g)));
        } catch (err) { next(err); }
    };
}
