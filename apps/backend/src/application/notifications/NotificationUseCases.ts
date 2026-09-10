import type { IPushRepository } from '../../domain/repositories/IPushRepository';
import type { IMotivationRepository } from '../../domain/repositories/IMotivationRepository';
import type { IDashboardRepository } from '../../domain/repositories/IDashboardRepository';
import type { UpsertPushTokenInput } from '../../domain/entities/PushToken';
import type { ExpoPushService, PushMessage } from '../../infrastructure/push/ExpoPushService';
import { PushTokenInvalidError } from '../../domain/errors/NotificationsError';
import { logger } from '@opox/utils';

// ── 13.1 Registrar token del dispositivo ─────────────────────────────────────

export class RegisterPushTokenUseCase {
    constructor(private readonly repo: IPushRepository) {}

    async execute(input: UpsertPushTokenInput): Promise<{ registered: boolean }> {
        if (!input.token || !input.token.startsWith('ExponentPushToken[')) {
            throw new PushTokenInvalidError();
        }
        await this.repo.upsertToken(input);
        return { registered: true };
    }
}

// Persiste la notificación en la bandeja (Bloque 2) además de enviar el push.
// No-fatal: el push ya salió por Expo, un fallo aquí solo se loguea — el
// Centro de Notificaciones tendrá un hueco puntual pero nada más se rompe.
async function persistNotification(
    dashboardRepo: IDashboardRepository,
    input: {
        userId: string;
        category: 'boe' | 'social' | 'general';
        icon: string;
        title: string;
        body: string;
        actionRoute?: string | null;
    },
): Promise<void> {
    try {
        await dashboardRepo.createNotification({
            userId: input.userId,
            category: input.category,
            icon: input.icon,
            title: input.title,
            body: input.body,
            actionRoute: input.actionRoute ?? null,
        });
    } catch (err) {
        logger.warn('[notifications] no se pudo persistir en la bandeja', {
            userId: input.userId,
            error: err instanceof Error ? err.message : String(err),
        });
    }
}

// ── 13.2 Alertas de cambio BOE ────────────────────────────────────────────────
// Notifica a todos los usuarios registrados que el BOE ha cambiado.
// En Fase 2 se puede filtrar por boe_watched_regulations de cada usuario.

export class SendBoeAlertUseCase {
    constructor(
        private readonly pushRepo: IPushRepository,
        private readonly pushService: ExpoPushService,
        private readonly dashboardRepo: IDashboardRepository,
    ) {}

    async execute(syncedCount: number): Promise<void> {
        if (syncedCount === 0) return;

        const tokens = await this.pushRepo.getAllTokens();
        if (tokens.length === 0) {
            logger.info('[notifications] boe-alert: sin tokens registrados');
            return;
        }

        const title = '📋 Cambio legislativo detectado';
        const body = `Se han detectado ${syncedCount} cambio${syncedCount > 1 ? 's' : ''} en tu temario. Revísalos antes del examen.`;

        const messages: PushMessage[] = tokens.map(t => ({
            to: t.token,
            title,
            body,
            data: { type: 'boe_alert', screen: 'BoeHome' },
            sound: 'default',
        }));

        await this.pushService.send(messages);

        const uniqueUserIds = [...new Set(tokens.map(t => t.userId))];
        await Promise.all(uniqueUserIds.map(userId =>
            persistNotification(this.dashboardRepo, {
                userId,
                category: 'boe',
                icon: '📋',
                title,
                body,
                actionRoute: 'BoeHome',
            }),
        ));

        logger.info('[notifications] boe-alert enviado', { recipients: tokens.length, syncedCount });
    }
}

// ── 13.3 Apunte listo ─────────────────────────────────────────────────────────
// Notifica al usuario propietario del apunte cuando el pipeline de análisis termina.

export class SendNoteReadyUseCase {
    constructor(
        private readonly pushRepo: IPushRepository,
        private readonly pushService: ExpoPushService,
        private readonly dashboardRepo: IDashboardRepository,
    ) {}

    async execute(userId: string, noteId: string, questionsCount: number, noteTitle: string): Promise<void> {
        const tokens = await this.pushRepo.getTokensByUser(userId);
        if (tokens.length === 0) return;

        const title = '✅ Apunte analizado';
        const body = `"${noteTitle}" está listo — ${questionsCount} pregunta${questionsCount !== 1 ? 's' : ''} generada${questionsCount !== 1 ? 's' : ''}.`;

        const messages: PushMessage[] = tokens.map(t => ({
            to: t.token,
            title,
            body,
            data: { type: 'note_ready', screen: 'NoteDetail', params: { noteId } },
            sound: 'default',
        }));

        await this.pushService.send(messages);
        await persistNotification(this.dashboardRepo, {
            userId,
            category: 'general',
            icon: '✅',
            title,
            body,
            actionRoute: 'NoteDetail',
        });

        logger.info('[notifications] note-ready enviado', { userId, noteId, questionsCount });
    }
}

// ── 13.4 Meta diaria cumplida ─────────────────────────────────────────────
// Notifica al usuario cuando completa todas sus tareas del día.

export class SendDailyGoalCompletedUseCase {
    constructor(
        private readonly pushRepo: IPushRepository,
        private readonly pushService: ExpoPushService,
        private readonly dashboardRepo: IDashboardRepository,
    ) {}

    async execute(userId: string): Promise<void> {
        const tokens = await this.pushRepo.getTokensByUser(userId);
        if (tokens.length === 0) return;

        const title = '🎯 ¡Meta diaria cumplida!';
        const body = 'Has completado todas tus tareas de hoy. ¡Sigue así!';

        const messages: PushMessage[] = tokens.map(t => ({
            to: t.token,
            title,
            body,
            data: { type: 'daily_reminder', screen: 'PlanningHome' },
            sound: 'default',
        }));

        await this.pushService.send(messages);
        await persistNotification(this.dashboardRepo, {
            userId,
            category: 'general',
            icon: '🎯',
            title,
            body,
            actionRoute: 'PlanningHome',
        });

        logger.info('[notifications] daily-goal-completed enviado', { userId });
    }
}

// ── 13.6 Reto de clan recibido ────────────────────────────────────────────────
// Notifica a todos los miembros del clan (excepto al creador) que hay un nuevo reto.

export class SendClanChallengeNotificationUseCase {
    constructor(
        private readonly motivationRepo: IMotivationRepository,
        private readonly pushRepo: IPushRepository,
        private readonly pushService: ExpoPushService,
        private readonly dashboardRepo: IDashboardRepository,
    ) {}

    async execute(input: {
        clanId: string;
        challengerId: string;
        challengeTitle: string;
        clanName: string;
    }): Promise<void> {
        const memberIds = await this.motivationRepo.getClanMemberIds(input.clanId);
        const recipientIds = memberIds.filter((id) => id !== input.challengerId);
        if (recipientIds.length === 0) return;

        const title = '⚔️ ¡Nuevo reto de clan!';
        const body = `${input.challengeTitle} — ¿Aceptas el desafío?`;

        const messages: PushMessage[] = [];
        for (const userId of recipientIds) {
            const tokens = await this.pushRepo.getTokensByUser(userId);
            for (const t of tokens) {
                messages.push({
                    to: t.token,
                    title,
                    body,
                    data: { type: 'clan_challenge', screen: 'Challenges', params: { clanId: input.clanId } },
                    sound: 'default',
                });
            }
        }

        if (messages.length === 0) return;
        await this.pushService.send(messages);

        await Promise.all(recipientIds.map(userId =>
            persistNotification(this.dashboardRepo, {
                userId,
                category: 'social',
                icon: '⚔️',
                title,
                body,
                actionRoute: 'Challenges',
            }),
        ));

        logger.info('[notifications] clan-challenge enviado', { clanId: input.clanId, recipients: messages.length });
    }
}

// ── 13.5 Recordatorio de racha diaria ─────────────────────────────────────────
// Lanzado por el cron a las 20:00h Colombia (01:00 UTC).
// Fase 1: notifica a todos los usuarios con token.
// Fase 2: filtrar solo usuarios sin actividad registrada ese día.

export class SendStreakWarningUseCase {
    constructor(
        private readonly pushRepo: IPushRepository,
        private readonly pushService: ExpoPushService,
        private readonly dashboardRepo: IDashboardRepository,
    ) {}

    async execute(): Promise<{ sent: number }> {
        const tokens = await this.pushRepo.getAllTokens();
        if (tokens.length === 0) {
            logger.info('[notifications] streak-warning: sin tokens registrados');
            return { sent: 0 };
        }

        const title = '🔥 ¡No pierdas tu racha!';
        const body = 'Completa tu meta de estudio de hoy antes de medianoche.';

        const messages: PushMessage[] = tokens.map(t => ({
            to: t.token,
            title,
            body,
            data: { type: 'streak_warning', screen: 'MotivationHome' },
            sound: 'default',
        }));

        await this.pushService.send(messages);

        const uniqueUserIds = [...new Set(tokens.map(t => t.userId))];
        await Promise.all(uniqueUserIds.map(userId =>
            persistNotification(this.dashboardRepo, {
                userId,
                category: 'general',
                icon: '🔥',
                title,
                body,
                actionRoute: 'MotivationHome',
            }),
        ));

        logger.info('[notifications] streak-warning enviado', { recipients: tokens.length });
        return { sent: tokens.length };
    }
}
