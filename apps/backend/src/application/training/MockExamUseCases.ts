import type { ITrainingRepository } from '../../domain';
import type { MockExamWithStatus } from '../../domain/entities/MockExam';

export class ListMockExamsUseCase {
    constructor(private readonly trainingRepo: ITrainingRepository) { }

    execute(input: { userId: string; oposicion: string }): Promise<MockExamWithStatus[]> {
        return this.trainingRepo.listMockExams(input);
    }
}

export class GetMockExamUseCase {
    constructor(private readonly trainingRepo: ITrainingRepository) { }

    async execute(input: { userId: string; mockExamId: string }) {
        const [exam, questions] = await Promise.all([
            this.trainingRepo.getMockExam(input.mockExamId),
            this.trainingRepo.listMockQuestions(input.mockExamId),
        ]);
        return { exam, questions };
    }
}
