import type { IPlanningRepository } from '../../domain';
import { todayIso, daysBetween } from './dateUtils';

export type PhaseStatus = 'done' | 'current' | 'upcoming';

export interface MacroPhase {
    key: string;
    title: string;
    status: PhaseStatus;
}

export interface MacroResult {
    examDate: string;
    daysLeft: number;
    monthsLeft: number;
    phases: MacroPhase[];
}

// Reparto en 5 fases (sin IA — ver AGENTS.md). El temario típico de OPOX tiene
// ~40 temas; el reparto asigna 10 temas por fase durante las 4 primeras y una
// 5ª fase de repaso integral sobre TODOS los temas (peso más alto porque
// concentra tests de repaso con el temario completo antes del examen).
// Los pesos suman 1; se usan como referencia temporal para el status de fase.
const PHASE_DEFS: Array<{ key: string; title: string; weight: number }> = [
    { key: 'base',           title: 'Fase 1 · Base del temario',       weight: 0.20 },
    { key: 'profundizacion', title: 'Fase 2 · Profundización',         weight: 0.20 },
    { key: 'simulacros',     title: 'Fase 3 · Simulacros intensivos',  weight: 0.20 },
    { key: 'repaso',         title: 'Fase 4 · Repaso final',           weight: 0.15 },
    { key: 'integral',       title: 'Fase 5 · Repaso integral',        weight: 0.25 },
];

export class GetMacroUseCase {
    constructor(private readonly planningRepo: IPlanningRepository) { }

    async execute(userId: string): Promise<MacroResult | null> {
        const plan = await this.planningRepo.getPlan(userId);
        if (!plan.examDate) return null;

        const today = todayIso();
        const start = plan.createdAt.toISOString().slice(0, 10);
        const totalDays = Math.max(daysBetween(start, plan.examDate), 1);
        const elapsedDays = Math.min(Math.max(daysBetween(start, today), 0), totalDays);

        let cursor = 0;
        const phases: MacroPhase[] = PHASE_DEFS.map((def) => {
            const phaseDays = Math.round(totalDays * def.weight);
            const from = cursor;
            const to = cursor + phaseDays;
            cursor = to;

            let status: PhaseStatus;
            if (elapsedDays >= to) status = 'done';
            else if (elapsedDays >= from) status = 'current';
            else status = 'upcoming';

            return { key: def.key, title: def.title, status };
        });

        const daysLeft = Math.max(daysBetween(today, plan.examDate), 0);
        return {
            examDate: plan.examDate,
            daysLeft,
            monthsLeft: Math.round(daysLeft / 30),
            phases,
        };
    }
}
