import { Router, type RequestHandler } from 'express';
import { API_ROUTES } from '@opox/constants';
import type { MotivationController } from '../controllers';
import { validateBody, validateQuery } from '../middleware';
import {
    rankingQuerySchema,
    createClanSchema,
    sendClanMessageSchema,
    listClanMessagesQuerySchema,
    createClanChallengeSchema,
} from '../validators';

/** Todas las rutas del Bloque 5 requieren sesión. */
export function createMotivationRouter(
    controller: MotivationController,
    authMiddleware: RequestHandler,
): Router {
    const r = Router();

    r.get(API_ROUTES.MOTIVATION.SUMMARY, authMiddleware, controller.getSummary);
    r.get(API_ROUTES.MOTIVATION.STREAK, authMiddleware, controller.getStreakDetail);
    r.get(
        API_ROUTES.MOTIVATION.RANKING,
        authMiddleware,
        validateQuery(rankingQuerySchema),
        controller.getRanking,
    );
    r.post(API_ROUTES.MOTIVATION.PROFILE_PASSED, authMiddleware, controller.markExamPassed);

    r.get(API_ROUTES.MOTIVATION.CLAN_MINE, authMiddleware, controller.getMyClan);
    r.get(API_ROUTES.MOTIVATION.CLANS, authMiddleware, controller.listClans);
    r.post(
        API_ROUTES.MOTIVATION.CLANS,
        authMiddleware,
        validateBody(createClanSchema),
        controller.createClan,
    );
    r.post(API_ROUTES.MOTIVATION.CLAN_JOIN, authMiddleware, controller.joinClan);
    r.get(API_ROUTES.MOTIVATION.CLAN_DETAIL, authMiddleware, controller.getClanDetail);

    r.get(
        API_ROUTES.MOTIVATION.CLAN_MESSAGES,
        authMiddleware,
        validateQuery(listClanMessagesQuerySchema),
        controller.listClanMessages,
    );
    r.post(
        API_ROUTES.MOTIVATION.CLAN_MESSAGES,
        authMiddleware,
        validateBody(sendClanMessageSchema),
        controller.sendClanMessage,
    );

    r.get(API_ROUTES.MOTIVATION.CLAN_CHALLENGES, authMiddleware, controller.listClanChallenges);
    r.post(
        API_ROUTES.MOTIVATION.CLAN_CHALLENGES,
        authMiddleware,
        validateBody(createClanChallengeSchema),
        controller.createClanChallenge,
    );
    r.post(
        API_ROUTES.MOTIVATION.CLAN_CHALLENGE_COMPLETE,
        authMiddleware,
        controller.completeChallenge,
    );

    r.get(API_ROUTES.MOTIVATION.CLAN_GRADUATES, authMiddleware, controller.listGraduates);

    return r;
}
