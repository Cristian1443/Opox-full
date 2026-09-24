import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@opox/utils';
import type { MotorAiClient } from '../clients/MotorAiClient';

// ─── Fase 4 · Auto-sync de curso Motor ↔ Supabase (gaps-15-09-26) ────────────
//
// El equipo IA re-sube los módulos del temario cada vez que hay contenido nuevo
// o revisado. Cada re-ingesta genera un `course_id` distinto en el Motor y el
// anterior queda huérfano — devuelve `404 curso_no_encontrado` en cada llamada,
// rompiendo la app en producción hasta que alguien actualice `training_courses`
// en Supabase manualmente.
//
// Este servicio elimina la fricción operativa:
//   1. Al arrancar el backend, refresca `training_courses` y `training_topics`.
//   2. Cada 30 min en background repite el chequeo (cron del scheduler).
//   3. Estrategia de match: por `label` (título del curso). El más reciente
//      por `creado` DESC con `estado: "listo"` gana el desempate. Este criterio
//      es escalable — cuando haya varias oposiciones (Policía Local, Justicia,
//      Guardia Civil), cada una se identifica por su label sin colisionar.
//
// El servicio nunca lanza excepciones al caller — cualquier fallo del Motor
// queda logueado con `warn` y se conserva el valor previo de la tabla. Zero
// riesgo de dejar la app rota por una caída del Motor.

// Tipos internos del catálogo del Motor (fuera de `MotorAiClient` para no
// contaminarlo con endpoints que solo usa el sync).
interface MotorCourseListItem {
    id: string;
    titulo: string;
    estado: string;
    creado: string;
    n_temas: number;
    n_documentos: number;
}

interface MotorTema {
    id: string;
    titulo: string;
    orden: number;
}

interface MotorBloque {
    temas: MotorTema[];
}

interface MotorCourseDetail {
    id: string;
    titulo: string;
    documentos: Array<{ bloques?: MotorBloque[] }>;
    // Algunos deployments del Motor devuelven bloques a nivel raíz en lugar
    // de anidados en documentos — soportamos ambos formatos.
    bloques?: MotorBloque[];
}

export class CourseSyncService {
    constructor(
        private readonly supabaseAdmin: SupabaseClient,
        private readonly motor: MotorAiClient,
    ) {}

    /**
     * Ejecuta un ciclo de sincronización. Fire-and-forget seguro: nunca lanza.
     * Devuelve true si detectó algún cambio, false si todo estaba al día o falló.
     */
    async refresh(): Promise<boolean> {
        try {
            // 1. Leer el mapping esperado desde Supabase.
            const { data: rows, error } = await this.supabaseAdmin
                .from('training_courses')
                .select('oposicion, motor_curso_id, label');
            if (error) {
                logger.warn('[course-sync] no se pudo leer training_courses', { error: error.message });
                return false;
            }
            const mappings = (rows ?? []) as Array<{ oposicion: string; motor_curso_id: string; label: string }>;
            if (mappings.length === 0) {
                logger.warn('[course-sync] training_courses está vacía; no hay nada que sincronizar');
                return false;
            }

            // 2. Catálogo actual del Motor.
            const catalog = await this.fetchCatalog();
            if (!catalog) return false;

            // 3. Por cada mapping, buscar el curso activo del Motor con ese label.
            let anyChange = false;
            for (const mapping of mappings) {
                const active = pickActiveCourse(catalog, mapping.label);
                if (!active) {
                    logger.warn('[course-sync] sin curso "listo" para label', { label: mapping.label });
                    continue;
                }

                if (active.id === mapping.motor_curso_id) continue; // ya sincronizado

                logger.info('[course-sync] cambio detectado', {
                    oposicion: mapping.oposicion,
                    label: mapping.label,
                    from: mapping.motor_curso_id,
                    to: active.id,
                });

                await this.updateCourseId(mapping.oposicion, active.id);
                await this.refreshTopics(mapping.oposicion, active.id);
                anyChange = true;
            }

            return anyChange;
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            logger.warn('[course-sync] error inesperado', { err: msg });
            return false;
        }
    }

    // ─── Helpers privados ────────────────────────────────────────────────────

    private async fetchCatalog(): Promise<MotorCourseListItem[] | null> {
        try {
            const client = this.motor.rawHttp();
            // ?estado=listo filtra directamente en el Motor para excluir cursos
            // en proceso de ingesta (evita match prematuro con un curso "running").
            const res = await client.get<MotorCourseListItem[]>('/v1/courses?estado=listo');
            if (!Array.isArray(res.data)) {
                logger.warn('[course-sync] catálogo inesperado', { type: typeof res.data });
                return null;
            }
            return res.data;
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            logger.warn('[course-sync] fallo GET /v1/courses', { err: msg });
            return null;
        }
    }

    private async fetchCourseDetail(cursoId: string): Promise<MotorCourseDetail | null> {
        try {
            const client = this.motor.rawHttp();
            const res = await client.get<MotorCourseDetail>(`/v1/courses/${cursoId}`);
            return res.data;
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            logger.warn('[course-sync] fallo GET /v1/courses/:id', { cursoId, err: msg });
            return null;
        }
    }

    private async updateCourseId(oposicion: string, motorCursoId: string): Promise<void> {
        const { error } = await this.supabaseAdmin
            .from('training_courses')
            .update({ motor_curso_id: motorCursoId })
            .eq('oposicion', oposicion);
        if (error) {
            logger.warn('[course-sync] no se pudo actualizar training_courses', {
                oposicion,
                err: error.message,
            });
        }
    }

    /**
     * Reemplaza los `training_topics` de una oposicion con los del curso nuevo.
     * Estrategia: DELETE + INSERT (transaccional Supabase no está expuesto en el
     * client-js; el gap entre delete e insert es de <100ms y solo afecta a los
     * pickers de tema si el usuario entra en ese instante — el use case cae al
     * fallback `justicia-tramitacion` sin romper). Aceptable para infra
     * de catálogo. Si en el futuro se necesita atomicidad, pasar a rpc/postgres.
     */
    private async refreshTopics(oposicion: string, motorCursoId: string): Promise<void> {
        const detail = await this.fetchCourseDetail(motorCursoId);
        if (!detail) return;

        // El curso puede exponer los bloques anidados dentro de `documentos[*].bloques`
        // o directamente en `bloques` a nivel raíz — normalizamos ambos.
        const bloques: MotorBloque[] = [];
        for (const doc of detail.documentos ?? []) {
            if (Array.isArray(doc.bloques)) bloques.push(...doc.bloques);
        }
        if (Array.isArray(detail.bloques)) bloques.push(...detail.bloques);

        const temas: Array<{ id: string; titulo: string; orden: number }> = [];
        for (const bloque of bloques) {
            for (const t of bloque.temas ?? []) temas.push(t);
        }

        if (temas.length === 0) {
            logger.warn('[course-sync] curso sin temas — se omite refresh de training_topics', {
                oposicion,
                motorCursoId,
            });
            return;
        }

        // El `orden` viene por bloque (0..9). Aplicamos un orden global por el
        // orden en que aparecen en `documentos[]` — coincide con el que ya usa
        // ListTopicsUseCase para renderizar "Tema N".
        const rows = temas.map((t, i) => ({
            oposicion,
            topic_id: t.id,
            label: t.titulo,
            sort_order: i + 1,
        }));

        const { error: delErr } = await this.supabaseAdmin
            .from('training_topics')
            .delete()
            .eq('oposicion', oposicion);
        if (delErr) {
            logger.warn('[course-sync] no se pudieron borrar los topics viejos', {
                oposicion,
                err: delErr.message,
            });
            return;
        }
        const { error: insErr } = await this.supabaseAdmin
            .from('training_topics')
            .insert(rows);
        if (insErr) {
            logger.warn('[course-sync] no se pudieron insertar los topics nuevos', {
                oposicion,
                err: insErr.message,
            });
            return;
        }

        logger.info('[course-sync] topics refrescados', {
            oposicion,
            count: rows.length,
        });
    }
}

/**
 * Selecciona el curso activo del catálogo del Motor para un label dado.
 * Criterios (aplicados en orden):
 *   1. Match exacto de `titulo` (case-insensitive, trim).
 *   2. Solo cursos con `estado: "listo"` (los `error` y `pending` se descartan).
 *   3. Desempate: `creado` DESC (el más reciente gana).
 *   4. Segundo desempate: `n_temas` DESC (el más completo gana ante empate temporal).
 *
 * Exportado para permitir tests unitarios; el servicio también lo consume.
 */
export function pickActiveCourse(
    catalog: MotorCourseListItem[],
    label: string,
): MotorCourseListItem | null {
    const target = label.trim().toLowerCase();
    const candidates = catalog
        .filter((c) => c.estado === 'listo')
        .filter((c) => (c.titulo ?? '').trim().toLowerCase() === target);
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => {
        const dateCmp = (b.creado ?? '').localeCompare(a.creado ?? '');
        if (dateCmp !== 0) return dateCmp;
        return (b.n_temas ?? 0) - (a.n_temas ?? 0);
    });
    return candidates[0] ?? null;
}
