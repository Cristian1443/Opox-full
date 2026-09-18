// Bloque 3 · Salud — Check-in diario (fuente de señales cuando el usuario
// no tiene wearable sincronizado con Health Connect / HealthKit).

export type EnergyLevel = 'low' | 'medium' | 'high';

export type CheckinFactor =
    | 'estres'
    | 'cafeina'
    | 'ejercicio'
    | 'mala_noche'
    | 'digestion'
    | 'ansiedad_examen'
    | 'dolor_cabeza'
    | 'vista_cansada';

export const CHECKIN_FACTORS: CheckinFactor[] = [
    'estres',
    'cafeina',
    'ejercicio',
    'mala_noche',
    'digestion',
    'ansiedad_examen',
    'dolor_cabeza',
    'vista_cansada',
];

export interface DailyCheckin {
    id: string;
    userId: string;
    localDate: string;        // YYYY-MM-DD
    moodScore: number;        // 1-10
    sleepHours: number;       // 4.0-10.0 step 0.5
    energyLevel: EnergyLevel;
    factors: CheckinFactor[];
    createdAt: string;        // ISO
}

export interface SaveDailyCheckinInput {
    localDate: string;
    moodScore: number;
    sleepHours: number;
    energyLevel: EnergyLevel;
    factors?: CheckinFactor[];
}

export interface SaveDailyCheckinResponse {
    checkin: DailyCheckin;
    /** true si es la primera vez del día, false si es actualización. */
    created: boolean;
}
