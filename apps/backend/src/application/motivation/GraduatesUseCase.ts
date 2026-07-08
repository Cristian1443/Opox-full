import type { IMotivationRepository, Profile } from '../../domain';

/** Muro de la Gloria (5.4, Fase 2) — solo lectura real; sin flujo para autorreportarse aún. */
export class ListGraduatesUseCase {
    constructor(private readonly motivationRepo: IMotivationRepository) { }

    execute(input: { userId: string; clanId: string }): Promise<Profile[]> {
        return this.motivationRepo.listGraduates(input);
    }
}
