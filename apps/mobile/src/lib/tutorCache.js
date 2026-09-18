import AsyncStorage from '@react-native-async-storage/async-storage';

// Caché ligero para respuestas del Aula Virtual (Bloque 8). El Motor tarda
// 15-60 s en generar un resumen o mazo; guardando el último resultado el
// usuario ve el contenido al instante cuando reabre la misma sesión y la
// regeneración corre en background.
//
// TTL: 7 días. Suficiente para que el temario no cambie entre sesiones y no
// tan largo como para servir datos obsoletos indefinidamente.

const TTL_MS = 7 * 24 * 60 * 60 * 1000;

function _key(scope, ...parts) {
    return `opox.tutor.${scope}.${parts.filter((p) => p != null && p !== '').join('.')}`;
}

async function _read(key) {
    try {
        const raw = await AsyncStorage.getItem(key);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed?.ts || Date.now() - parsed.ts > TTL_MS) return null;
        return parsed.data ?? null;
    } catch {
        return null;
    }
}

async function _write(key, data) {
    try {
        await AsyncStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
    } catch {
        // Silencioso — la caché es best-effort, nunca bloqueante.
    }
}

// ─── Summary (resumen inteligente) ──────────────────────────────────────────
export function getCachedSummary(topicId, detailLevel) {
    return _read(_key('summary', topicId, detailLevel ?? 'default'));
}
export function setCachedSummary(topicId, detailLevel, data) {
    return _write(_key('summary', topicId, detailLevel ?? 'default'), data);
}

// ─── Deck (flashcards) ──────────────────────────────────────────────────────
export function getCachedDeck(topicId) {
    return _read(_key('deck', topicId));
}
export function setCachedDeck(topicId, data) {
    return _write(_key('deck', topicId), data);
}
