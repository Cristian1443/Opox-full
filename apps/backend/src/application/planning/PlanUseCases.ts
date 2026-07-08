import type { IPlanningRepository, StudyPlan, PlanIntensity } from '../../domain';

export class GetPlanUseCase {
    constructor(private readonly planningRepo: IPlanningRepository) { }

    execute(userId: string): Promise<StudyPlan> {
        return this.planningRepo.getPlan(userId);
    }
}

export class UpdatePlanUseCase {
    constructor(private readonly planningRepo: IPlanningRepository) { }

    execute(input: {
        userId: string;
        testsPerDay?: number;
        studyDays?: number[];
        intensity?: PlanIntensity;
        examDate?: string | null;
    }): Promise<StudyPlan> {
        return this.planningRepo.updatePlan(input);
    }
}
