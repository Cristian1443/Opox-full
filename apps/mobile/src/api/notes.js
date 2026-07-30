import { api } from './client';
import { API_ROUTES } from '@opox/constants';

// Cliente HTTP del Bloque 9 · Factoría de Apuntes.
// Todas las respuestas siguen el patrón { data, error } del api client.

const N = API_ROUTES.NOTES;

export const notesApi = {
    // ── Listado (9.1) ─────────────────────────────────────────────────────────
    list: () => api.get(N.LIST, { auth: true }),

    // ── Detalle (9.4) ─────────────────────────────────────────────────────────
    get: (id) => api.get(N.DETAIL.replace(':id', id), { auth: true }),

    // ── Subida (9.2 → 9.3) ────────────────────────────────────────────────────
    // `files`: [{ base64, mimeType, sizeBytes }]
    upload: ({ oposicion, kind, fileName, files }) =>
        api.post(N.UPLOAD, { oposicion, kind, fileName, files }, { auth: true }),

    // ── Status del análisis (9.3 polling) ─────────────────────────────────────
    getStatus: (id) => api.get(N.STATUS.replace(':id', id), { auth: true }),

    // ── Edición de etiquetas (9.4 modal) ──────────────────────────────────────
    updateTags: (id, tags) =>
        api.put(N.TAGS.replace(':id', id), { tags }, { auth: true }),

    // ── Borrado (9.4 confirm) ─────────────────────────────────────────────────
    remove: (id) => api.delete(N.DETAIL.replace(':id', id), { auth: true }),

    // ── Generar test (9.5 → runner) ───────────────────────────────────────────
    generateTest: (id, { questionCount, topics, timed = false }) =>
        api.post(
            N.GENERATE_TEST.replace(':id', id),
            { questionCount, topics, timed },
            { auth: true },
        ),
};
