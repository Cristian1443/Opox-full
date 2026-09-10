-- Dashboard (Bloque 2) · "Continúa donde lo dejaste"
--
-- Las 3 tarjetas de esta sección (Última ley consultada, Último error,
-- ¿Seguimos con el simulacro?) mostraban texto fijo hardcodeado en el
-- frontend ("Ley 39/2015 · art. 21", "Derecho Administrativo · repasar",
-- "Examen 2022 · 28% completado") sin ningún dato real detrás. "Último
-- error" ya tenía datos reales disponibles vía training_error_patterns
-- (no requiere tabla nueva); estas dos tablas cubren las otras dos.

CREATE TABLE IF NOT EXISTS mock_exam_progress (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    mock_exam_id uuid NOT NULL REFERENCES training_mock_exams(id) ON DELETE CASCADE,
    exam_title text NOT NULL,
    current_index integer NOT NULL DEFAULT 0,
    question_count integer NOT NULL,
    answers_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE mock_exam_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY mock_exam_progress_own ON mock_exam_progress
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS user_law_views (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    law text NOT NULL,
    article text,
    article_title text,
    boe_url text,
    topic_id text,
    viewed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_law_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_law_views_own ON user_law_views
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
