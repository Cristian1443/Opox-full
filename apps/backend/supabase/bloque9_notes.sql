-- ============================================================
-- BLOQUE 9 · FACTORÍA DE APUNTES
-- Ejecutar después de los seeds de bloques anteriores.
-- Necesita Supabase Storage bucket "notes" para las imágenes/PDF originales
-- y "notes-thumbnails" para las miniaturas generadas por el backend.
-- ============================================================

-- ── Documento raíz ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notes (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title            text NOT NULL DEFAULT 'Apunte sin título',
    file_name        text NOT NULL,
    kind             text NOT NULL CHECK (kind IN ('pdf', 'photo')),
    pages            integer NOT NULL DEFAULT 0,
    status           text NOT NULL DEFAULT 'processing_ocr'
                     CHECK (status IN (
                        'processing_ocr',
                        'processing_topics',
                        'processing_questions',
                        'ready',
                        'error'
                     )),
    progress         integer NOT NULL DEFAULT 0
                     CHECK (progress BETWEEN 0 AND 100),
    error_code       text,
    error_message    text,
    storage_path     text,
    -- Contadores desnormalizados para no pagar joins en cada listado.
    questions_count  integer NOT NULL DEFAULT 0,
    created_at       timestamptz DEFAULT now() NOT NULL,
    updated_at       timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notes_user
    ON notes(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notes_user_status
    ON notes(user_id, status);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notes_owner_all" ON notes
    FOR ALL USING (auth.uid() = user_id);

-- ── Páginas del documento ─────────────────────────────────────────────────────
-- El backend crea una fila por página tras el OCR. `thumbnail_url` es la URL
-- pública firmada de Supabase Storage. `extracted_text` sirve para el buscador
-- futuro y para el visor página-a-página (NotesPageViewer, pantalla futura).
CREATE TABLE IF NOT EXISTS note_pages (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id          uuid NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    page_number      integer NOT NULL,
    thumbnail_url    text,
    extracted_text   text,
    ocr_confidence   numeric(3,2) NOT NULL DEFAULT 1.0
                     CHECK (ocr_confidence BETWEEN 0 AND 1),
    created_at       timestamptz DEFAULT now() NOT NULL,
    UNIQUE(note_id, page_number)
);

CREATE INDEX IF NOT EXISTS idx_note_pages_note
    ON note_pages(note_id, page_number ASC);

ALTER TABLE note_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "note_pages_owner_all" ON note_pages
    FOR ALL USING (auth.uid() = user_id);

-- ── Etiquetas del documento ───────────────────────────────────────────────────
-- La IA propone tags al analizar; el usuario los edita desde 9.4.
-- Guardamos un array denormalizado en `notes.tags` sería más simple, pero
-- una tabla dedicada permite futuras búsquedas por tag y compartir tags
-- entre apuntes sin duplicar strings.
CREATE TABLE IF NOT EXISTS note_tags (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id          uuid NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    label            text NOT NULL,
    -- Distingue tags autogenerados por IA de los añadidos manualmente.
    source           text NOT NULL DEFAULT 'ai'
                     CHECK (source IN ('ai', 'user')),
    created_at       timestamptz DEFAULT now() NOT NULL,
    UNIQUE(note_id, label)
);

CREATE INDEX IF NOT EXISTS idx_note_tags_note
    ON note_tags(note_id);

CREATE INDEX IF NOT EXISTS idx_note_tags_user_label
    ON note_tags(user_id, label);

ALTER TABLE note_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "note_tags_owner_all" ON note_tags
    FOR ALL USING (auth.uid() = user_id);

-- ── Preguntas generadas del documento ─────────────────────────────────────────
-- Bank privado del usuario, distinto de `training_questions` (bank oficial
-- compartido de simulacros). El runner de 9.5 filtra por note_id y opcionalmente
-- por tag para respetar el selector de temas.
CREATE TABLE IF NOT EXISTS note_questions (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id          uuid NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    text             text NOT NULL,
    options          jsonb NOT NULL,
    correct_index    smallint NOT NULL CHECK (correct_index BETWEEN 0 AND 3),
    explanation      text,
    tag              text,
    difficulty       text CHECK (difficulty IN ('easy', 'medium', 'hard')),
    created_at       timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_note_questions_note
    ON note_questions(note_id);

CREATE INDEX IF NOT EXISTS idx_note_questions_note_tag
    ON note_questions(note_id, tag);

ALTER TABLE note_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "note_questions_owner_all" ON note_questions
    FOR ALL USING (auth.uid() = user_id);

-- ── Trigger para mantener notes.updated_at ────────────────────────────────────
CREATE OR REPLACE FUNCTION touch_notes_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notes_touch ON notes;
CREATE TRIGGER trg_notes_touch
    BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION touch_notes_updated_at();

-- ── Seed de demo (solo para desarrollo local) ─────────────────────────────────
-- Descomenta y sustituye <TU_USER_ID> por el UUID de tu usuario de Supabase auth
-- para tener 3 apuntes visibles en 9.1 sin subir nada.
--
INSERT INTO notes (id, user_id, title, file_name, kind, pages, status, questions_count)
VALUES
('00000000-0000-0000-0000-000000000901', '5c4f377c-a6dc-4158-acd0-7310efda78c7', 'Esquema Constitución', 'Esquema Constitución.pdf', 'pdf', 8, 'ready', 24),
('00000000-0000-0000-0000-000000000902', '5c4f377c-a6dc-4158-acd0-7310efda78c7', 'Apuntes Ley 39/2015', 'IMG_20260612.jpg', 'photo', 3, 'ready', 18),
('00000000-0000-0000-0000-000000000903', '5c4f377c-a6dc-4158-acd0-7310efda78c7', 'Resumen Procedimiento', 'Resumen.pdf', 'pdf', 5, 'ready', 30);

INSERT INTO note_tags (note_id, user_id, label, source) VALUES
('00000000-0000-0000-0000-000000000901', '5c4f377c-a6dc-4158-acd0-7310efda78c7', 'Constitución', 'ai'),
('00000000-0000-0000-0000-000000000901', '5c4f377c-a6dc-4158-acd0-7310efda78c7', 'Derechos fundamentales', 'ai'),
('00000000-0000-0000-0000-000000000901', '5c4f377c-a6dc-4158-acd0-7310efda78c7', 'Título I', 'ai');
