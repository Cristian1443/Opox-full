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

/**
 * Enriquece un mensaje de chat que contenga referencias tipo "Tema 5" con el
 * título real del temario. Motivación: el label "Tema N" solo existe en el
 * cliente OPOX (por el remapeo de `ListTopicsUseCase` para uniformar la UI),
 * NO en el corpus del Motor RAG. Cuando el usuario escribe "explícame el
 * Tema 5", el Motor busca literalmente esa cadena en los documentos del
 * curso y falla — devuelve "no puedo asegurar cuál es el Tema 5".
 *
 * Sustituye cada mención por `Tema N («<título real>»)` — mantiene la
 * referencia numérica original y añade el título con el que el corpus
 * conoce ese tema. Sin efecto si el mensaje no menciona ningún Tema N, si
 * la oposición no tiene temas en `training_topics` o si el número está
 * fuera del rango del temario.
 */
export async function resolveTopicReferencesInMessage(
    supabaseAdmin: SupabaseClient,
    oposicion: string | null | undefined,
    message: string,
): Promise<string> {
    if (!oposicion || !message) return message;

    // Regex tolerante: "Tema 5", "tema 5", "Tema  5", "Tema 05".
    // Máximo 2 dígitos → evita capturar años ("Ley 39/2015") o números largos
    // que casi nunca son referencias a un tema del temario.
    const re = /\btema\s+(\d{1,2})\b/gi;
    const matches = Array.from(message.matchAll(re));
    if (matches.length === 0) return message;

    const { data } = await supabaseAdmin
        .from('training_topics')
        .select('label, sort_order')
        .eq('oposicion', oposicion)
        .order('sort_order', { ascending: true });

    const topics = (data ?? []) as Array<{ label: string; sort_order: number }>;
    if (topics.length === 0) return message;

    let enriched = message;
    const seen = new Set<number>();
    for (const m of matches) {
        const n = parseInt(m[1] ?? '0', 10);
        if (n < 1 || n > topics.length || seen.has(n)) continue;
        seen.add(n);
        const label = topics[n - 1]?.label;
        if (!label) continue;
        // Reemplazo global de esa variante numérica exacta — no toca los demás
        // Tema K que existan en el mismo mensaje, cada uno se procesa aparte.
        const replaceRe = new RegExp(`\\btema\\s+${n}\\b`, 'gi');
        enriched = enriched.replace(replaceRe, `Tema ${n} («${label}»)`);
    }
    return enriched;
}
