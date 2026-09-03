import type { Request, Response, NextFunction } from 'express';
import type {
    UserPreferences as UserPrefsDTO,
    UpdatePreferencesInput,
    ProStats as ProStatsDTO,
    ProStatsExportResult,
    ApiSuccessResponse,
} from '@opox/types';
import type {
    GetPreferencesUseCase,
    UpdatePreferencesUseCase,
    GetProStatsUseCase,
    ExportProStatsUseCase,
    SubmitFeedbackUseCase,
} from '../../application';
import type { UserPreferences, ProStats } from '../../domain/entities';

function ok<T>(res: Response, status: number, data: T): void {
    res.status(status).json({ ok: true, data } satisfies ApiSuccessResponse<T>);
}

function serializePrefs(p: UserPreferences): UserPrefsDTO {
    return {
        userId:             p.userId,
        personality:        p.personality,
        detailLevel:        p.detailLevel,
        hintStyle:          p.hintStyle,
        reinforcementLevel: p.reinforcementLevel,
        theme:              p.theme,
        fontScale:          p.fontScale,
        reduceMotion:       p.reduceMotion,
        updatedAt:          p.updatedAt.toISOString(),
    };
}

function serializeProStats(s: ProStats): ProStatsDTO {
    return {
        totalQuestions:       s.totalQuestions,
        correctQuestions:     s.correctQuestions,
        accuracyPct:          s.accuracyPct,
        passedProbabilityPct: s.passedProbabilityPct,
        studyStreakDays:       s.studyStreakDays,
        topicsAttempted:      s.topicsAttempted,
        topicsStrong:         s.topicsStrong,
        topicsWeak:           s.topicsWeak,
        topicBreakdown:       s.topicBreakdown,
        avgSecsPerQuestion:   s.avgSecsPerQuestion,
        computedAt:           s.computedAt.toISOString(),
    };
}

export class ConfigController {
    constructor(
        private readonly deps: {
            getPreferences:    GetPreferencesUseCase;
            updatePreferences: UpdatePreferencesUseCase;
            getProStats:       GetProStatsUseCase;
            exportProStats:    ExportProStatsUseCase;
            submitFeedback:    SubmitFeedbackUseCase;
        },
    ) {}

    // GET /config/preferences
    getPreferences = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const prefs = await this.deps.getPreferences.execute(req.authUser!.id);
            ok(res, 200, serializePrefs(prefs));
        } catch (e) { next(e); }
    };

    // PATCH /config/preferences
    updatePreferences = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const input = req.body as UpdatePreferencesInput;
            const prefs = await this.deps.updatePreferences.execute(req.authUser!.id, input);
            ok(res, 200, serializePrefs(prefs));
        } catch (e) { next(e); }
    };

    // GET /config/pro-stats
    getProStats = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const stats = await this.deps.getProStats.execute(req.authUser!.id);
            ok(res, 200, serializeProStats(stats));
        } catch (e) { next(e); }
    };

    // POST /config/pro-stats/export
    exportProStats = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { period = 'month' } = req.body as { period?: 'week' | 'month' | 'all' };
            const result = await this.deps.exportProStats.execute(req.authUser!.id, period);
            const dto: ProStatsExportResult = result;
            ok(res, 200, dto);
        } catch (e) { next(e); }
    };

    // POST /config/feedback
    submitFeedback = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { type, message } = req.body as { type: 'suggestion' | 'bug' | 'other'; message: string };
            await this.deps.submitFeedback.execute({ userId: req.authUser!.id, type, message });
            ok(res, 201, { submitted: true });
        } catch (e) { next(e); }
    };
}
