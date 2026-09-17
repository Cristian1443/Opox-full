// Escalera de hitos de racha OPOX. Debe coincidir con `STREAK_MILESTONES` en
// `packages/types/src/motivation.ts` (fuente de verdad del backend). Se duplica
// aquí para no forzar al mobile a importar @opox/types (que no está en su
// dependency graph). Si cambia una lista, actualizar la otra.
export const STREAK_MILESTONES = [
    { days: 7,   points: 50   },
    { days: 14,  points: 100  },
    { days: 21,  points: 200  },
    { days: 30,  points: 300  },
    { days: 60,  points: 500  },
    { days: 100, points: 1000 },
];

/**
 * Próximo hito por delante del `currentStreak`. Devuelve null si el usuario ya
 * cruzó el máximo (100 días).
 */
export function getNextMilestone(currentStreak) {
    const next = STREAK_MILESTONES.find((m) => m.days > currentStreak);
    if (!next) return null;
    return { days: next.days, points: next.points, remaining: next.days - currentStreak };
}
