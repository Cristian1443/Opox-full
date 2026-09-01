import type { UserPreferences, UpdatePreferencesInput, ProStats } from '../entities';

export interface IConfigRepository {
    getPreferences(userId: string): Promise<UserPreferences | null>;
    upsertPreferences(userId: string, input: UpdatePreferencesInput): Promise<UserPreferences>;
    submitFeedback(params: {
        userId: string;
        type: 'suggestion' | 'bug' | 'other';
        message: string;
    }): Promise<void>;
    getProStats(userId: string): Promise<ProStats>;
    storePdfReport(userId: string, period: string, pdfBuffer: Buffer): Promise<string>;
}
