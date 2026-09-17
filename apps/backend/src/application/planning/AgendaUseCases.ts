import type { IPlanningRepository, PlanDate, PlanDateKind } from '../../domain';

export class ListAgendaUseCase {
    constructor(private readonly planningRepo: IPlanningRepository) { }

    execute(userId: string): Promise<PlanDate[]> {
        return this.planningRepo.listDates(userId);
    }
}

export class CreateAgendaDateUseCase {
    constructor(private readonly planningRepo: IPlanningRepository) { }

    execute(input: {
        userId: string;
        eventDate: string;
        title: string;
        subtitle?: string | null;
        kind?: PlanDateKind;
    }): Promise<PlanDate> {
        return this.planningRepo.createDate(input);
    }
}

export class DeleteAgendaDateUseCase {
    constructor(private readonly planningRepo: IPlanningRepository) { }

    execute(input: { userId: string; dateId: string }): Promise<boolean> {
        return this.planningRepo.deleteDate(input);
    }
}
