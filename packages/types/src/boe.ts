/**
 * DTOs del Monitor BOE (Bloque 10).
 *
 * Shared between apps/mobile and apps/backend.
 * Entities SQL: boe_watched_regulations, boe_changes, boe_change_fragments,
 *               boe_alert_reads, boe_alert_bookmarks, boe_mini_test_results
 */

// ─── Normas en seguimiento ────────────────────────────────────────────────────

export interface BoeRegulation {
    id: string;
    userId: string;
    /** Código oficial BOE-A-AAAA-NNNNN */
    boeIdentifier: string;
    /** Título oficial completo traído del BOE */
    title: string;
    followedAt: string;
    lastCheckedAt: string | null;
}

// ─── Cambios detectados ───────────────────────────────────────────────────────

export type BoeChangeType = 'modificacion' | 'derogacion' | 'nueva' | 'tipografica';

export interface BoeChange {
    id: string;
    boeIdentifier: string;
    /** Título completo de la norma */
    regulationTitle: string;
    /** Título corto para encabezado de tarjeta (máx. 60 chars) */
    shortTitle: string;
    /** Precepto afectado: "Art. 14", "Art. 21.2", etc. */
    articulo: string;
    changeType: BoeChangeType;
    detectedAt: string;
    isRead: boolean;
    isBookmarked: boolean;
    /** Número de preguntas del banco afectadas por este cambio */
    affectedQuestionsCount: number;
}

// ─── Fragmentos de texto (antes / después) ───────────────────────────────────

export interface BoeChangeFragment {
    type: 'antes' | 'despues';
    text: string;
}

// ─── Detalle completo ─────────────────────────────────────────────────────────

export interface BoeChangeDetail extends BoeChange {
    fragments: BoeChangeFragment[];
    miniTestCompleted: boolean;
    miniTestScore: number | null;
    miniTestTotal: number | null;
    /** Texto descriptivo del origen (ej. "BOE-A-2024-1234 · Ley 39/2015") */
    sourceDescription: string;
    /** Pista interpretativa generada por el backend */
    hint: string;
}

// ─── Feed (pantalla 10.1) ─────────────────────────────────────────────────────

export interface BoeFeedSection {
    /** Título de la sección temporal: "Esta semana", "Anterior", etc. */
    sectionTitle: string;
    data: BoeChange[];
}

export interface BoeFeedResponse {
    sections: BoeFeedSection[];
    totalUnread: number;
}

// ─── Comparativa (pantalla 10.3) ─────────────────────────────────────────────

/** Segmento de texto con tipo para el renderizado diferencial */
export interface BoeTextSegment {
    type: 'normal' | 'deleted' | 'added';
    text: string;
}

/** Bloque antes/después con sus segmentos ya calculados por el backend */
export interface BoeComparisonBlock {
    type: 'antes' | 'despues';
    segments: BoeTextSegment[];
}

export interface BoeComparisonResponse {
    articulo: string;
    regulationTitle: string;
    boeIdentifier: string;
    /** Bloques con diff word-by-word pre-calculado en el backend */
    blocks: BoeComparisonBlock[];
    /** Pista interpretativa para el recuadro morado inferior */
    hint: string;
}

// ─── Mini-test (pantalla 10.4) ───────────────────────────────────────────────

export interface BoeMiniTestQuestionDto {
    id: string;
    /** Etiqueta corta del cambio para el banner de contexto (máx. 40 chars) */
    context: string;
    /** Enunciado (máx. 280 chars) */
    question: string;
    /** Exactamente 3 opciones — la app añade el prefijo A/B/C */
    options: [string, string, string];
    correctIndex: 0 | 1 | 2;
    /** Justificación breve citando la redacción vigente (máx. 300 chars) */
    explanation: string;
}

export interface BoeMiniTestResponse {
    changeId: string;
    articulo: string;
    questions: BoeMiniTestQuestionDto[];
}

// ─── Request bodies ───────────────────────────────────────────────────────────

export interface CompleteMiniTestBody {
    score: number;
    total: number;
}

// ─── Response helpers ─────────────────────────────────────────────────────────

export interface ToggleBookmarkResponse {
    isBookmarked: boolean;
}

export interface MarkReadResponse {
    isRead: boolean;
}

// ─── Training topics (Bloque 6 Generador Infinito + Bloque 10 Mi Temario) ────

export interface TrainingTopic {
    /** UUID de la fila en la BD (usar como key de lista, no para lógica de negocio) */
    id: string;
    /** Identificador semántico del tema: 'constitucion', 'ley-39', etc. Usar para llamadas a la IA */
    topicId: string;
    /** Nombre legible del tema (ej. "Constitución Española 1978") */
    label: string;
    /** Oposición a la que pertenece (ej. "justicia-tramitacion") */
    oposicion: string;
    sortOrder: number;
}
