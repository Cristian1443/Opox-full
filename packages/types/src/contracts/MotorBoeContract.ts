/**
 * Contrato del Motor BOE externo (Monitor de legislación).
 *
 * Implementado por MotorBoeClient en:
 *   apps/backend/src/infrastructure/boe/MotorBoeClient.ts
 */

export type MotorJobEstado = 'reserved' | 'queued' | 'running' | 'done' | 'error';

// ─── DTOs compartidos del Motor BOE ──────────────────────────────────────────

/** Norma registrada en el Motor para un curso. */
export interface MotorBoeNorma {
    id: string;
    curso_id: string;
    identificador_boe: string;
    titulo: string;
    url: string;
    texto_len: number;
    ultima_revision: string | null;
    activa: boolean;
}

/** Entrada del catálogo BOE (sin curso_id — puede no estar vinculada a ningún curso). */
export interface MotorBoeCatalogEntry {
    id: string;
    identificador_boe: string;
    titulo: string;
    url: string;
    activa: boolean;
    scope?: string;
    rank?: string;
}

export interface MotorBoeCatalogResult {
    sincronizado: boolean;
    total: number;
    ultima_sincronizacion: string | null;
    resultados: MotorBoeCatalogEntry[];
}

export interface MotorJobStatus {
    id: string;
    estado: MotorJobEstado;
    mensaje: string;
}

export interface MotorCambioFragmento {
    /** Redacción derogada */
    antes: string;
    /** Redacción vigente */
    despues: string;
    /** Título del precepto, p. ej. "Artículo 14. Derechos en formato electrónico" */
    contexto: string;
}

export interface MotorCambioPregunta {
    id: string;
    texto: string;
    estado: 'marcada' | 'regenerada' | 'descartada';
    similitud?: number;
}

export interface MotorCambio {
    id: string;
    norma_id: string;
    norma_titulo: string;
    identificador_boe: string;
    detectado: string;
    resumen: string;
    fragmentos: MotorCambioFragmento[];
    estado: string;
    preguntas_afectadas: MotorCambioPregunta[];
}

export interface MotorBoeContract {
    // ── Detección de cambios ──────────────────────────────────────────────────

    /** Lanza un job de comprobación de cambios. Devuelve job_id. */
    checkForChanges(cursoId?: string): Promise<string>;

    /** Consulta el estado de un job async. */
    pollJob(jobId: string): Promise<MotorJobStatus>;

    /** Lista los cambios detectados para un curso. */
    getChanges(cursoId: string): Promise<MotorCambio[]>;

    // ── Gestión de normas en seguimiento ─────────────────────────────────────

    /** Registra una norma en el Motor para el curso. 409 si ya sigue. */
    followRegulation(cursoId: string, boeIdentifier: string, titulo?: string): Promise<MotorBoeNorma>;

    /** Lista las normas en seguimiento activo para el curso. */
    listRegulations(cursoId: string): Promise<MotorBoeNorma[]>;

    /** Deja de seguir una norma del curso (usando el ID del Motor). */
    stopFollowingRegulation(motorRegulationId: string, cursoId: string): Promise<void>;

    // ── Catálogo BOE ──────────────────────────────────────────────────────────

    /** Busca normas en el catálogo del Motor por título o código. */
    searchCatalog(query: string, limit?: number): Promise<MotorBoeCatalogResult>;

    /**
     * Lanza la sincronización del catálogo BOE.
     * `desde`: fecha YYYYMMDD desde la que buscar (opcional).
     * Devuelve el job_id.
     */
    syncCatalog(desde?: string): Promise<string>;

    /**
     * Lanza la regeneración de preguntas afectadas por un cambio BOE.
     * Se llama tras sync cuando preguntas_afectadas.length > 0.
     * Devuelve el job_id (fire-and-forget — no requiere polling del caller).
     */
    regenerateQuestions(changeId: string, cursoId: string): Promise<string>;
}
