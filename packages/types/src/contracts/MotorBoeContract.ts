/**
 * Contrato del Motor BOE externo (Monitor de legislación).
 *
 * Implementado por MotorBoeClient en:
 *   apps/backend/src/infrastructure/boe/MotorBoeClient.ts
 *
 * Solo expone los métodos que usa SyncBoeChangesUseCase.
 * Los DTOs adicionales del cliente (MotorBoeNorma, etc.) viven en la
 * implementación concreta porque el dominio no los necesita.
 */

export type MotorJobEstado = 'reserved' | 'queued' | 'running' | 'done' | 'error';

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
    /**
     * Lanza un job de comprobación de cambios en el Motor.
     * Devuelve el job_id para hacer polling con pollJob().
     */
    checkForChanges(cursoId?: string): Promise<string>;

    /**
     * Consulta el estado actual de un job async.
     */
    pollJob(jobId: string): Promise<MotorJobStatus>;

    /**
     * Lista los cambios detectados para un curso.
     */
    getChanges(cursoId: string): Promise<MotorCambio[]>;
}
