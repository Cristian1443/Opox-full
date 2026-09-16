import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Resuelve `topic_id → "Tema N"` para el curso activo del usuario.
 *
 * El Motor devuelve `topic` como hex ID (ej. "0acb39953a424c20") en lugar del
 * nombre humano. `training_topics` tiene el `sort_order` para reproducir el mismo
 * "Tema N" que emite `ListTopicsUseCase` en el resto de la app. Este helper se
 * comparte entre `SupabaseTrainingRepository.listErrorPatterns` y
 * `SupabaseConfigRepository.getProStats` — antes cada uno tenía su propia copia
 * (o directamente ninguna, como pro-stats, que devolvía UUIDs crudos al mobile).
 *
 * Devuelve un Map vacío si ninguno de los `topicIds` está en `training_topics`
 * — el caller decide qué hacer (típicamente filtrar por regex hex).
 */
export async function enrichTopicsWithLabels(
    supabaseAdmin: SupabaseClient,
    topicIds: string[],
): Promise<Map<string, string>> {
    const posMap = new Map<string, string>();
    if (topicIds.length === 0) return posMap;

    // Detectar la oposición del usuario buscando uno de los topicIds en la tabla.
    const { data: matched } = await supabaseAdmin
        .from('training_topics')
        .select('oposicion')
        .in('topic_id', topicIds)
        .limit(1);

    const oposicion = (matched as Array<{ oposicion: string }> | null)?.[0]?.oposicion;
    if (!oposicion) return posMap;

    // Cargar todos los temas de esa oposición ordenados para calcular Tema N.
    const { data: allTopics } = await supabaseAdmin
        .from('training_topics')
        .select('topic_id')
        .eq('oposicion', oposicion)
        .order('sort_order', { ascending: true });

    ((allTopics ?? []) as Array<{ topic_id: string }>).forEach((t, i) => {
        posMap.set(t.topic_id, `Tema ${i + 1}`);
    });

    return posMap;
}

/**
 * Regex para detectar IDs hex sin resolver tras el enriquecimiento — cuando el
 * usuario tiene datos de un curso antiguo cuyos IDs no están en `training_topics`.
 * Se usa como filtro para no mostrar hexadecimales crudos al usuario final.
 */
export const HEX_ID_RE = /^[0-9a-f]{12,}$/i;
