import { diffWords } from 'diff';
import type { BoeTextSegment } from '@opox/types';

/**
 * Calcula un diff word-by-word entre dos textos legales y devuelve los segmentos
 * tipados para cada bloque (antes / después).
 *
 * Lógica:
 *  - Partes solo en `antes`  → { type: 'deleted' } en antesSegments (se omiten en despues)
 *  - Partes solo en `despues` → { type: 'added' }  en despuesSegments (se omiten en antes)
 *  - Partes comunes          → { type: 'normal' }  en ambos bloques
 */
export function computeBoeDiff(
    antes: string,
    despues: string,
): { antesSegments: BoeTextSegment[]; despuesSegments: BoeTextSegment[] } {
    const changes = diffWords(antes, despues);

    const antesSegments: BoeTextSegment[] = [];
    const despuesSegments: BoeTextSegment[] = [];

    for (const part of changes) {
        if (part.removed) {
            antesSegments.push({ type: 'deleted', text: part.value });
        } else if (part.added) {
            despuesSegments.push({ type: 'added', text: part.value });
        } else {
            antesSegments.push({ type: 'normal', text: part.value });
            despuesSegments.push({ type: 'normal', text: part.value });
        }
    }

    return { antesSegments, despuesSegments };
}
