import type { IPushRepository } from '../../domain/repositories/IPushRepository';
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

// ── 13.2 Alertas de cambio BOE ────────────────────────────────────────────────
// Notifica a todos los usuarios registrados que el BOE ha cambiado.
// En Fase 2 se puede filtrar por boe_watched_regulations de cada usuario.

export class SendBoeAlertUseCase {
    constructor(
        private readonly pushRepo: IPushRepository,
        private readonly pushService: ExpoPushService,
    ) {}

    async execute(syncedCount: number): Promise<void> {
        if (syncedCount === 0) return;

        const tokens = await this.pushRepo.getAllTokens();
        if (tokens.length === 0) {
            logger.info('[notifications] boe-alert: sin tokens registrados');
            return;
        }

        const messages: PushMessage[] = tokens.map(t => ({
            to: t.token,
            title: '📋 Cambio legislativo detectado',
            body: `Se han detectado ${syncedCount} cambio${syncedCount > 1 ? 's' : ''} en tu temario. Revísalos antes del examen.`,
            data: { type: 'boe_alert', screen: 'BoeHome' },
            sound: 'default',
        }));

        await this.pushService.send(messages);
        logger.info('[notifications] boe-alert enviado', { recipients: tokens.length, syncedCount });
    }
}

// ── 13.3 Apunte listo ─────────────────────────────────────────────────────────
// Notifica al usuario propietario del apunte cuando el pipeline de análisis termina.

export class SendNoteReadyUseCase {
    constructor(
        private readonly pushRepo: IPushRepository,
        private readonly pushService: ExpoPushService,
    ) {}

    async execute(userId: string, noteId: string, questionsCount: number, noteTitle: string): Promise<void> {
        const tokens = await this.pushRepo.getTokensByUser(userId);
        if (tokens.length === 0) return;

        const messages: PushMessage[] = tokens.map(t => ({
            to: t.token,
            title: '✅ Apunte analizado',
            body: `"${noteTitle}" está listo — ${questionsCount} pregunta${questionsCount !== 1 ? 's' : ''} generada${questionsCount !== 1 ? 's' : ''}.`,
            data: { type: 'note_ready', screen: 'NoteDetail', params: { noteId } },
            sound: 'default',
        }));

        await this.pushService.send(messages);
        logger.info('[notifications] note-ready enviado', { userId, noteId, questionsCount });
    }
}

// ── 13.4 Recordatorio de racha diaria ─────────────────────────────────────────
// Lanzado por el cron a las 20:00h Colombia (01:00 UTC).
// Fase 1: notifica a todos los usuarios con token.
// Fase 2: filtrar solo usuarios sin actividad registrada ese día.

export class SendStreakWarningUseCase {
    constructor(
        private readonly pushRepo: IPushRepository,
        private readonly pushService: ExpoPushService,
    ) {}

    async execute(): Promise<{ sent: number }> {
        const tokens = await this.pushRepo.getAllTokens();
        if (tokens.length === 0) {
            logger.info('[notifications] streak-warning: sin tokens registrados');
            return { sent: 0 };
        }

        const messages: PushMessage[] = tokens.map(t => ({
            to: t.token,
            title: '🔥 ¡No pierdas tu racha!',
            body: 'Completa tu meta de estudio de hoy antes de medianoche.',
            data: { type: 'streak_warning', screen: 'MotivationHome' },
            sound: 'default',
        }));

        await this.pushService.send(messages);
        logger.info('[notifications] streak-warning enviado', { recipients: tokens.length });
        return { sent: tokens.length };
    }
}
