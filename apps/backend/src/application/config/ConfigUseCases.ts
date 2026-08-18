import type { IConfigRepository } from '../../domain/repositories';
import type { UserPreferences, UpdatePreferencesInput, ProStats } from '../../domain/entities';
import { FeedbackInvalidError } from '../../domain/errors';

const DEFAULT_PREFERENCES: Omit<UpdatePreferencesInput, never> = {
    personality: 'equilibrado',
    detailLevel: 1,
    directHints: false,
    motivational: true,
    theme: 'auto',
    fontScale: 1.0,
    reduceMotion: false,
};

// ── 12.5 Tono + 12.6 Accesibilidad ──────────────────────────────────────────

export class GetPreferencesUseCase {
    constructor(private readonly repo: IConfigRepository) {}
    async execute(userId: string): Promise<UserPreferences> {
        const existing = await this.repo.getPreferences(userId);
        if (existing) return existing;
        // Primera vez: crear con defaults y devolver
        return this.repo.upsertPreferences(userId, DEFAULT_PREFERENCES);
    }
}

export class UpdatePreferencesUseCase {
    constructor(private readonly repo: IConfigRepository) {}
    async execute(userId: string, input: UpdatePreferencesInput): Promise<UserPreferences> {
        return this.repo.upsertPreferences(userId, input);
    }
}

// ── 12.7 Estadísticas Pro ────────────────────────────────────────────────────

export class GetProStatsUseCase {
    constructor(private readonly repo: IConfigRepository) {}
    async execute(userId: string): Promise<ProStats> {
        return this.repo.getProStats(userId);
    }
}

// ── 12.8 Exportar informe (stub PDF) ─────────────────────────────────────────

export class ExportProStatsUseCase {
    constructor(private readonly repo: IConfigRepository) {}
    async execute(
        userId: string,
        period: 'week' | 'month' | 'all',
    ): Promise<{ period: string; downloadUrl: string | null; message: string }> {
        // Se obtienen stats reales para tenerlos disponibles cuando se implemente el PDF
        await this.repo.getProStats(userId);
        // TODO(bloque-12): generar PDF con pdfkit/puppeteer y subir a Supabase Storage
        return {
            period,
            downloadUrl: null,
            message: 'El informe se está generando. Recibirás una notificación cuando esté listo.',
        };
    }
}

// ── 12.10 Feedback ───────────────────────────────────────────────────────────

const MAX_MSG_LEN = 500;

export class SubmitFeedbackUseCase {
    constructor(private readonly repo: IConfigRepository) {}
    async execute(params: {
        userId: string;
        type: 'suggestion' | 'bug' | 'other';
        message: string;
    }): Promise<void> {
        const msg = params.message.trim();
        if (!msg || msg.length > MAX_MSG_LEN) {
            throw new FeedbackInvalidError('El mensaje debe tener entre 1 y 500 caracteres.');
        }
        if (!['suggestion', 'bug', 'other'].includes(params.type)) {
            throw new FeedbackInvalidError('Tipo de feedback no válido.');
        }
        await this.repo.submitFeedback({ ...params, message: msg });
    }
}
