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

// ─── DTOs del mini-test BOE (pantalla 10.4) ─────────────────────────────────

/** Pregunta de la sesión — sin respuesta correcta (se revela en answerMiniTestQuestion). */
export interface MotorBoeSessionPregunta {
    id: string;
    enunciado: string;
    opciones: string[];
    dificultad: string;
    tema_id: string;
    origen: string;
    ref_legislativa: string;
}

/** SesionOut del Motor para el mini-test BOE. */
export interface MotorBoeSessionOut {
    sesion_id: string;
    tipo: string;
    curso_id: string;
    contrarreloj_seg: number;
    preguntas: MotorBoeSessionPregunta[];
    deficit: { pedidas: number; publicadas: number; motivos_descarte: Record<string, unknown> };
}

/** Respuesta del Motor al responder una pregunta de la sesión. */
export interface MotorBoeAnswerOut {
    correcta: boolean;
    correcta_idx: number;
    explicacion: string;
    justificaciones: string[];
    evidencia: { cita: string; pagina: number; chunk_id: string } | null;
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

    // ── Mini-test de validación (pantalla 10.4) ───────────────────────────────

    /**
     * Obtiene (o reanuda) la sesión de mini-test para el alumno sobre un cambio BOE.
     * GET /v1/boe/changes/{changeId}/mini-test?course_id=...&user_id=...
     * Lanza error con status 409 si el cambio aún no fue regenerado.
     */
    getMiniTest(changeId: string, courseId: string, userId: string): Promise<MotorBoeSessionOut>;

    /**
     * Envía la respuesta del alumno a una pregunta de la sesión.
     * POST /v1/tests/{sesionId}/answer
     * Devuelve la corrección con explicación y evidencia verbatim del temario.
     */
    answerMiniTestQuestion(
        sesionId: string,
        userId: string,
        preguntaId: string,
        elegidaIdx: number,
        tiempoMs?: number,
    ): Promise<MotorBoeAnswerOut>;
}
