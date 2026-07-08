/**
 * Entidad de dominio UserGamification.
 * Snapshot de racha diaria + saldo de Opopoints de un usuario. Bloque 2
 * solo la lee para el widget "Racha"; la posee de facto porque hoy es
 * el único consumidor, pero el Bloque 5 (Motivación) la ampliará.
 */
export class UserGamification {
    private constructor(
        public readonly userId: string,
        public readonly currentStreak: number,
        public readonly longestStreak: number,
        public readonly opopointsBalance: number,
        public readonly lastActivityDate: string | null, // YYYY-MM-DD
        public readonly updatedAt: Date,
    ) { }

    static create(props: {
        userId: string;
        currentStreak?: number;
        longestStreak?: number;
        opopointsBalance?: number;
        lastActivityDate?: string | null;
        updatedAt?: Date;
    }): UserGamification {
        return new UserGamification(
            props.userId,
            props.currentStreak ?? 0,
            props.longestStreak ?? 0,
            props.opopointsBalance ?? 0,
            props.lastActivityDate ?? null,
            props.updatedAt ?? new Date(),
        );
    }

    /**
     * Calcula el nuevo estado tras registrar actividad hoy (`today`, YYYY-MM-DD).
     * Regla: mismo día → no cambia la racha; día siguiente → +1; cualquier
     * otro caso (hueco o primera vez) → racha reinicia a 1.
     */
    withActivity(today: string, points: number): UserGamification {
        let nextStreak: number;
        if (this.lastActivityDate === today) {
            nextStreak = this.currentStreak;
        } else if (this.lastActivityDate === previousDay(today)) {
            nextStreak = this.currentStreak + 1;
        } else {
            nextStreak = 1;
        }

        return new UserGamification(
            this.userId,
            nextStreak,
            Math.max(this.longestStreak, nextStreak),
            this.opopointsBalance + points,
            today,
            new Date(),
        );
    }
}

function previousDay(isoDate: string): string {
    const d = new Date(`${isoDate}T00:00:00.000Z`);
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
}
