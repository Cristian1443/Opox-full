-- Bloque 7 · Sesión de entrenamiento — reportes y valoraciones de preguntas
--
-- Antes de esta migración, ReportQuestionUseCase solo logueaba el reporte sin
-- persistirlo nunca (TODO pendiente en el código). El widget de estrellas
-- "Evalúa esta pregunta" no tenía ningún onPress — solo mostraba
-- question.difficulty (un valor fijo de la pregunta) como decoración, sin
-- que el usuario pudiera calificar nada de verdad.

CREATE TABLE IF NOT EXISTS question_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id text NOT NULL,
    reason text NOT NULL,
    details text,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_question_reports_question ON question_reports(question_id);

ALTER TABLE question_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY question_reports_insert_own ON question_reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY question_reports_select_own ON question_reports
    FOR SELECT USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS question_ratings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id text NOT NULL,
    rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, question_id)
);
CREATE INDEX IF NOT EXISTS idx_question_ratings_question ON question_ratings(question_id);

ALTER TABLE question_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY question_ratings_insert_own ON question_ratings
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY question_ratings_update_own ON question_ratings
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY question_ratings_select_own ON question_ratings
    FOR SELECT USING (auth.uid() = user_id);
