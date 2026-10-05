// Fecha local del dispositivo en formato YYYY-MM-DD.
// Formato manual (no toLocaleDateString('sv')): el resultado de Intl depende
// del motor/ICU (Hermes iOS vs Android) y un formato distinto a YYYY-MM-DD
// rompería la racha, la planificación y los filtros por día.

/**
 * @param {Date} [date] fecha a formatear (por defecto, ahora).
 * @returns {string} YYYY-MM-DD en la zona horaria del dispositivo.
 */
export function localDateISO(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}
