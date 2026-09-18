import { api } from './client';
import { API_ROUTES } from '@opox/constants';

// Bloque 3 · Salud — API del check-in diario.
// - POST /health/checkin  → upsert idempotente por (user, localDate).
// - GET  /health/checkin  → devuelve el check-in del día pedido (o 404).

export const dailyCheckInApi = {
    /**
     * @param {{
     *   localDate: string,           // YYYY-MM-DD
     *   moodScore: number,           // 1-10
     *   sleepHours: number,          // 0-24 (step 0.5)
     *   energyLevel: 'low'|'medium'|'high',
     *   factors?: string[]           // ver CHECKIN_FACTORS
     * }} input
     */
    save: (input) =>
        api.post(API_ROUTES.HEALTH_CHECKIN, input, { auth: true }),

    /** @param {string} [localDate] YYYY-MM-DD; si no se pasa, el backend usa hoy. */
    getForDate: (localDate) => {
        const qs = localDate ? `?localDate=${encodeURIComponent(localDate)}` : '';
        return api.get(`${API_ROUTES.HEALTH_CHECKIN_GET}${qs}`, { auth: true });
    },
};

// Factores disponibles (misma lista que el backend en CHECKIN_FACTORS).
// Se exporta aquí para que las UI (DailyCheckInScreen, HomeHealthScreen) no
// tengan que importar de @opox/types en mobile (JS puro sin path aliases TS).
export const CHECKIN_FACTORS = [
    'estres',
    'cafeina',
    'ejercicio',
    'mala_noche',
    'digestion',
    'ansiedad_examen',
    'dolor_cabeza',
    'vista_cansada',
];

export const CHECKIN_FACTOR_LABELS = {
    estres:            'Estrés',
    cafeina:           'Cafeína',
    ejercicio:         'Ejercicio',
    mala_noche:        'Mala noche',
    digestion:         'Digestión',
    ansiedad_examen:   'Ansiedad examen',
    dolor_cabeza:      'Dolor cabeza',
    vista_cansada:     'Vista cansada',
};

// Emoji + label del mood score (1-10). Coherente con el boceto.
export function moodLabel(score) {
    if (score >= 9) return { emoji: '🚀', label: 'Óptimo' };
    if (score >= 7) return { emoji: '😊', label: 'Con energía' };
    if (score >= 5) return { emoji: '😐', label: 'Regular' };
    if (score >= 3) return { emoji: '😕', label: 'Cansado' };
    return { emoji: '😞', label: 'Agotado' };
}
