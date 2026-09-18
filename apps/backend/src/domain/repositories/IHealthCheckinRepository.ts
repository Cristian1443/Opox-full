import type { DailyCheckin, EnergyLevel, CheckinFactor } from '../entities';

export interface SaveCheckinInput {
    userId: string;
    localDate: string;             // YYYY-MM-DD
    moodScore: number;             // 1-10
    sleepHours: number;            // 0-24
    energyLevel: EnergyLevel;
    factors: CheckinFactor[];
}

export interface SaveCheckinResult {
    checkin: DailyCheckin;
    /** true si es la primera vez del día, false si ya existía. */
    created: boolean;
}

export interface IHealthCheckinRepository {
    /** Upsert por (user_id, local_date). Devuelve la fila resultante + flag created. */
    save(input: SaveCheckinInput): Promise<SaveCheckinResult>;

    /** Check-in del usuario para esa fecha, o null si no existe. */
    getByDate(userId: string, localDate: string): Promise<DailyCheckin | null>;
}
