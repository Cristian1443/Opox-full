// Personalidades del Motor: Cercano / Formal / Directo / Motivador.
// Se conservan los valores legacy ('equilibrado', 'exigente') para no romper
// datos existentes en BD; el mapper los normaliza al abrirlos desde Supabase.
export type TonePersonality = 'cercano' | 'formal' | 'directo' | 'motivador' | 'equilibrado' | 'exigente';
export type DetailLevel = 0 | 1 | 2; // 0=Breve · 1=Medio · 2=Profundo
export type HintStyle = 'socraticas' | 'directas';
export type ReinforcementLevel = 'alto' | 'normal' | 'ninguno';
export type AppTheme = 'auto' | 'light' | 'dark';

export interface UserPreferences {
    userId: string;
    // Tono IA (12.5) — alineado con Motor /tone
    personality: TonePersonality;
    detailLevel: DetailLevel;
    hintStyle: HintStyle;
    reinforcementLevel: ReinforcementLevel;
    // Accesibilidad (12.6)
    theme: AppTheme;
    fontScale: number; // 0.85 | 1.0 | 1.15
    reduceMotion: boolean;
    updatedAt: Date;
}

export interface UpdatePreferencesInput {
    personality?: TonePersonality;
    detailLevel?: DetailLevel;
    hintStyle?: HintStyle;
    reinforcementLevel?: ReinforcementLevel;
    theme?: AppTheme;
    fontScale?: number;
    reduceMotion?: boolean;
}

/** Perfil de tono en el formato que espera el Motor IA en cada llamada. */
export interface ToneProfile {
    personalidad: 'Cercano' | 'Formal' | 'Directo' | 'Motivador';
    nivel_detalle: 'Breve' | 'Medio' | 'Profundo';
    estilo_pistas: 'Socraticas' | 'Directas';
    refuerzo: 'Alto' | 'Normal' | 'Ninguno';
}
