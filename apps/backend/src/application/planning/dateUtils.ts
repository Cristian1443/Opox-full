/** Utilidades de fecha en UTC, formato YYYY-MM-DD, para el Bloque 4 · Planificación. */

export function todayIso(): string {
    return new Date().toISOString().slice(0, 10);
}

export function addDays(dateIso: string, days: number): string {
    const d = new Date(`${dateIso}T00:00:00.000Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
}

/** Lunes (ISO) de la semana que contiene dateIso. */
export function mondayOf(dateIso: string): string {
    const d = new Date(`${dateIso}T00:00:00.000Z`);
    const isoWeekday = d.getUTCDay() === 0 ? 7 : d.getUTCDay(); // 1=lunes .. 7=domingo
    return addDays(dateIso, 1 - isoWeekday);
}

export function daysBetween(fromIso: string, toIso: string): number {
    const from = new Date(`${fromIso}T00:00:00.000Z`).getTime();
    const to = new Date(`${toIso}T00:00:00.000Z`).getTime();
    return Math.round((to - from) / 86400000);
}
