import type { ITrainingRepository } from '../../domain';
import type { TrainingBookmark } from '../../domain/entities/TrainingBookmark';

export class ListBookmarksUseCase {
    constructor(private readonly trainingRepo: ITrainingRepository) { }

    execute(userId: string): Promise<TrainingBookmark[]> {
        return this.trainingRepo.listBookmarks(userId);
    }
}

export class SaveBookmarkUseCase {
    constructor(private readonly trainingRepo: ITrainingRepository) { }

    execute(input: {
        userId: string;
        concept: string;
        question: string;
        answer: string;
        relatedTopicId?: string;
    }): Promise<TrainingBookmark> {
        return this.trainingRepo.saveBookmark(input);
    }
}

export class DeleteBookmarkUseCase {
    constructor(private readonly trainingRepo: ITrainingRepository) { }

    async execute(input: { userId: string; bookmarkId: string }): Promise<void> {
        // deleteBookmark lanza BookmarkNotFoundError si no existe o no pertenece al usuario
        await this.trainingRepo.deleteBookmark(input);
    }
}
