import PDFDocument from 'pdfkit';
import type { IConfigRepository } from '../../domain/repositories';
import type { UserPreferences, UpdatePreferencesInput, ProStats, ToneProfile } from '../../domain/entities';
import { FeedbackInvalidError } from '../../domain/errors';

const DEFAULT_PREFERENCES: Omit<UpdatePreferencesInput, never> = {
    personality: 'cercano',
    detailLevel: 1,
    hintStyle: 'directas',
    reinforcementLevel: 'normal',
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

/** Convierte las preferencias OPOX al formato que el Motor IA espera en cada request. */
export function buildToneProfile(prefs: UserPreferences): ToneProfile {
    const PERSONALITY_MAP: Record<string, ToneProfile['personalidad']> = {
        cercano:     'Cercano',
        equilibrado: 'Cercano',
        formal:      'Formal',
        exigente:    'Formal',
        directo:     'Directo',
        motivador:   'Motivador',
    };
    const DETAIL_MAP: ToneProfile['nivel_detalle'][] = ['Breve', 'Medio', 'Profundo'];
    const REFUERZO_MAP: Record<string, ToneProfile['refuerzo']> = {
        alto:   'Alto',
        normal: 'Normal',
        ninguno: 'Ninguno',
    };
    return {
        personalidad:   PERSONALITY_MAP[prefs.personality] ?? 'Cercano',
        nivel_detalle:  DETAIL_MAP[prefs.detailLevel] ?? 'Medio',
        estilo_pistas:  prefs.hintStyle === 'socraticas' ? 'Socraticas' : 'Directas',
        refuerzo:       REFUERZO_MAP[prefs.reinforcementLevel] ?? 'Normal',
    };
}

// ── 12.7 Estadísticas Pro ────────────────────────────────────────────────────

export class GetProStatsUseCase {
    constructor(private readonly repo: IConfigRepository) {}
    async execute(userId: string): Promise<ProStats> {
        return this.repo.getProStats(userId);
    }
}

// ── 12.8 Exportar informe PDF ─────────────────────────────────────────────────

function buildPdfBuffer(stats: ProStats, period: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const chunks: Buffer[] = [];
        doc.on('data', (c: Buffer) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const PURPLE = '#412950';
        const ORANGE = '#F26A1B';
        const GRAY = '#555555';
        const LIGHT = '#F3F0F5';

        // Cabecera
        doc.rect(0, 0, doc.page.width, 80).fill(PURPLE);
        doc.fillColor('#FFFFFF').fontSize(22).font('Helvetica-Bold')
            .text('OPOX · Informe de rendimiento', 50, 25);
        doc.fontSize(10).font('Helvetica')
            .text(`Generado: ${new Date().toLocaleDateString('es-ES')}  ·  Periodo: ${period}`, 50, 54);

        doc.fillColor(PURPLE).moveDown(2);

        // Resumen general
        doc.fontSize(14).font('Helvetica-Bold').fillColor(PURPLE).text('Resumen general', { underline: false });
        doc.moveDown(0.4);
        const summary = [
            ['Preguntas respondidas', stats.totalQuestions.toString()],
            ['Preguntas correctas',   `${stats.correctQuestions} (${stats.accuracyPct}%)`],
            ['Probabilidad de aprobado', `${stats.passedProbabilityPct}%`],
            ['Días de racha actual', stats.studyStreakDays.toString()],
            ['Temas trabajados', stats.topicsAttempted.toString()],
            ['Temas fuertes (≥80%)', stats.topicsStrong.toString()],
            ['Temas débiles (<50%)', stats.topicsWeak.toString()],
        ];
        if (stats.avgSecsPerQuestion != null) {
            summary.push(['Velocidad media', `${stats.avgSecsPerQuestion} s/pregunta`]);
        }
        for (const [label, value] of summary) {
            doc.fontSize(11).font('Helvetica').fillColor(GRAY).text(`${label}:`, { continued: true });
            doc.font('Helvetica-Bold').fillColor(PURPLE).text(` ${value}`);
        }

        // Desglose por temas
        if (stats.topicBreakdown.length > 0) {
            doc.moveDown(1.2);
            doc.fontSize(14).font('Helvetica-Bold').fillColor(PURPLE).text('Desglose por temas');
            doc.moveDown(0.4);

            // Cabecera de tabla
            const colX = [50, 260, 340, 420];
            doc.rect(50, doc.y, doc.page.width - 100, 20).fill(LIGHT);
            doc.fillColor(PURPLE).font('Helvetica-Bold').fontSize(10);
            const headerY = doc.y + 5;
            doc.text('Tema', colX[0], headerY);
            doc.text('Total', colX[1], headerY);
            doc.text('Correctas', colX[2], headerY);
            doc.text('Acierto', colX[3], headerY);
            doc.moveDown(1.4);

            for (const t of stats.topicBreakdown) {
                const rowY = doc.y;
                const accent = t.accuracyPct >= 80 ? '#24BD86' : t.accuracyPct < 50 ? '#EF4444' : ORANGE;
                doc.font('Helvetica').fillColor(GRAY).fontSize(10);
                doc.text(t.topic.length > 32 ? t.topic.slice(0, 31) + '…' : t.topic, colX[0], rowY, { width: 200 });
                doc.text(t.total.toString(), colX[1], rowY);
                doc.text(t.correct.toString(), colX[2], rowY);
                doc.fillColor(accent).font('Helvetica-Bold').text(`${t.accuracyPct}%`, colX[3], rowY);
                doc.moveDown(0.9);
            }
        }

        // Pie de página
        doc.fontSize(8).font('Helvetica').fillColor('#888888')
            .text('OPOX · app de preparación de oposiciones · opox.es', 50, doc.page.height - 40, { align: 'center' });

        doc.end();
    });
}

export class ExportProStatsUseCase {
    constructor(private readonly repo: IConfigRepository) {}
    async execute(
        userId: string,
        period: 'week' | 'month' | 'all',
    ): Promise<{ period: string; downloadUrl: string; message: string }> {
        const stats = await this.repo.getProStats(userId);
        const periodLabel = period === 'week' ? 'Semana' : period === 'month' ? 'Mes' : 'Histórico';
        const pdfBuffer = await buildPdfBuffer(stats, periodLabel);
        const downloadUrl = await this.repo.storePdfReport(userId, period, pdfBuffer);
        return { period, downloadUrl, message: 'Informe generado.' };
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
