// Bloque 3 · Salud — entidad de dominio del check-in diario.
// Un usuario tiene como mucho 1 check-in por día (unique constraint en DB).

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

export const ALL_CHECKIN_FACTORS: CheckinFactor[] = [
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
    localDate: string;      // YYYY-MM-DD
    moodScore: number;      // 1-10
    sleepHours: number;     // 0-24, step 0.5
    energyLevel: EnergyLevel;
    factors: CheckinFactor[];
    createdAt: Date;
    updatedAt: Date;
}
