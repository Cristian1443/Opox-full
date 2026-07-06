import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Storage para imágenes de Foto-Test antes de enviarlas a la API de IA.
 *
 * TODO: implementar cuando se aborde el bloque de Foto-Test.
 * Métodos previstos:
 *   - uploadPhotoTest(buffer, userId): sube y devuelve URL firmada de corta duración
 *   - deletePhotoTest(url): purga la imagen tras procesarse
 */
export class SupabaseStorage {
    constructor(private readonly supabase: SupabaseClient) { }

    // TODO: métodos concretos aquí
}
