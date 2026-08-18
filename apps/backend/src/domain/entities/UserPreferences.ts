export type TonePersonality = 'cercano' | 'equilibrado' | 'exigente';
export type DetailLevel = 0 | 1 | 2;
export type AppTheme = 'auto' | 'light' | 'dark';

export interface UserPreferences {
    userId: string;
    personality: TonePersonality;
    detailLevel: DetailLevel;
    directHints: boolean;
    motivational: boolean;
    theme: AppTheme;
    fontScale: number;
    reduceMotion: boolean;
    updatedAt: Date;
}

export interface UpdatePreferencesInput {
    personality?: TonePersonality;
    detailLevel?: DetailLevel;
    directHints?: boolean;
    motivational?: boolean;
    theme?: AppTheme;
    fontScale?: number;
    reduceMotion?: boolean;
}
