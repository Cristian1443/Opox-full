-- ============================================================
-- BLOQUE 10 · MONITOR BOE
-- Ejecutar después de bloque6_topics.sql.
-- Es idempotente (safe to re-run).
--
-- Tablas:
--   boe_watched_regulations  — normas que el usuario ha puesto en seguimiento
--   boe_changes              — cambios detectados por el Motor BOE externo
--   boe_change_fragments     — texto antes/después de cada cambio
--   boe_alert_reads          — registro de lecturas (flag isRead)
--   boe_alert_bookmarks      — marcadores de cambios del usuario
--   boe_mini_test_results    — resultados del mini-test de validación (10.4)
-- ============================================================


-- ── Normas en seguimiento ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS boe_watched_regulations (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Código oficial: BOE-A-AAAA-NNNNN
    boe_identifier    text NOT NULL,
    -- Título oficial completo traído del Motor BOE
    title             text NOT NULL,
    followed_at       timestamptz NOT NULL DEFAULT now(),
    last_checked_at   timestamptz,
    UNIQUE(user_id, boe_identifier)
);

CREATE INDEX IF NOT EXISTS idx_boe_watched_user
    ON boe_watched_regulations(user_id, followed_at DESC);

ALTER TABLE boe_watched_regulations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "boe_watched_owner_all" ON boe_watched_regulations;
CREATE POLICY "boe_watched_owner_all" ON boe_watched_regulations
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ── Cambios detectados ────────────────────────────────────────────────────────
-- El backend los inserta cuando el Motor BOE reporta una diferencia.
-- Estos registros son globales (no por usuario): todos los usuarios que siguen
-- la misma norma ven el mismo cambio, pero su estado read/bookmark es personal.
CREATE TABLE IF NOT EXISTS boe_changes (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Norma afectada
    boe_identifier        text NOT NULL,
    regulation_title      text NOT NULL,
    short_title           text NOT NULL,
    -- Precepto afectado (ej. "Art. 14", "Art. 21.2")
    articulo              text NOT NULL,
    -- Tipo de cambio detectado
    change_type           text NOT NULL
                          CHECK (change_type IN ('modificacion', 'derogacion', 'nueva', 'tipografica')),
    -- Número de preguntas del banco afectadas (calculado al detectar el cambio)
    affected_questions    integer NOT NULL DEFAULT 0,
    detected_at           timestamptz NOT NULL DEFAULT now(),
    created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_boe_changes_identifier
    ON boe_changes(boe_identifier, detected_at DESC);

CREATE INDEX IF NOT EXISTS idx_boe_changes_detected
    ON boe_changes(detected_at DESC);

-- Sin RLS: todos los usuarios autenticados pueden leer cambios de normas que siguen.
ALTER TABLE boe_changes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "boe_changes_read_authenticated" ON boe_changes;
CREATE POLICY "boe_changes_read_authenticated" ON boe_changes
    FOR SELECT USING (auth.role() = 'authenticated');


-- ── Fragmentos de texto antes/después ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS boe_change_fragments (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    change_id   uuid NOT NULL REFERENCES boe_changes(id) ON DELETE CASCADE,
    -- 'antes' = redacción derogada / 'despues' = redacción vigente
    frag_type   text NOT NULL CHECK (frag_type IN ('antes', 'despues')),
    text        text NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE(change_id, frag_type)
);

CREATE INDEX IF NOT EXISTS idx_boe_fragments_change
    ON boe_change_fragments(change_id);

ALTER TABLE boe_change_fragments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "boe_fragments_read_authenticated" ON boe_change_fragments;
CREATE POLICY "boe_fragments_read_authenticated" ON boe_change_fragments
    FOR SELECT USING (auth.role() = 'authenticated');


-- ── Lecturas de alertas ───────────────────────────────────────────────────────
-- Una fila por (user, change) cuando el usuario abre el detalle del cambio.
CREATE TABLE IF NOT EXISTS boe_alert_reads (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    change_id   uuid NOT NULL REFERENCES boe_changes(id) ON DELETE CASCADE,
    read_at     timestamptz NOT NULL DEFAULT now(),
    UNIQUE(user_id, change_id)
);

CREATE INDEX IF NOT EXISTS idx_boe_reads_user
    ON boe_alert_reads(user_id, change_id);

ALTER TABLE boe_alert_reads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "boe_reads_owner_all" ON boe_alert_reads;
CREATE POLICY "boe_reads_owner_all" ON boe_alert_reads
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ── Marcadores de cambios ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS boe_alert_bookmarks (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    change_id   uuid NOT NULL REFERENCES boe_changes(id) ON DELETE CASCADE,
    bookmarked_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(user_id, change_id)
);

CREATE INDEX IF NOT EXISTS idx_boe_bookmarks_user
    ON boe_alert_bookmarks(user_id, bookmarked_at DESC);

ALTER TABLE boe_alert_bookmarks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "boe_bookmarks_owner_all" ON boe_alert_bookmarks;
CREATE POLICY "boe_bookmarks_owner_all" ON boe_alert_bookmarks
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ── Resultados del mini-test ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS boe_mini_test_results (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    change_id       uuid NOT NULL REFERENCES boe_changes(id) ON DELETE CASCADE,
    score           integer NOT NULL CHECK (score >= 0),
    total           integer NOT NULL CHECK (total > 0),
    completed_at    timestamptz NOT NULL DEFAULT now(),
    -- Solo se guarda un resultado por (user, change); se sobreescribe si repite.
    UNIQUE(user_id, change_id)
);

CREATE INDEX IF NOT EXISTS idx_boe_mini_test_user
    ON boe_mini_test_results(user_id, completed_at DESC);

ALTER TABLE boe_mini_test_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "boe_mini_test_owner_all" ON boe_mini_test_results;
CREATE POLICY "boe_mini_test_owner_all" ON boe_mini_test_results
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ── Seed de demo ──────────────────────────────────────────────────────────────
-- 3 cambios detectados en la Ley 39/2015 para el usuario de prueba.
-- Sustituye '5c4f377c-a6dc-4158-acd0-7310efda78c7' por tu userId de Supabase auth.
-- Permite ver la pantalla 10.1 con novedades y probar el flujo completo.

-- Primero insertamos la norma seguida por el usuario de demo
INSERT INTO boe_watched_regulations
    (id, user_id, boe_identifier, title, followed_at, last_checked_at)
VALUES
    (
        '00000000-0000-0000-0010-000000000001',
        '5c4f377c-a6dc-4158-acd0-7310efda78c7',
        'BOE-A-2015-10565',
        'Ley 39/2015, de 1 de octubre, del Procedimiento Administrativo Común de las Administraciones Públicas',
        now() - interval '10 days',
        now() - interval '1 hour'
    )
ON CONFLICT (user_id, boe_identifier) DO NOTHING;

-- Cambio 1: Modificación del Art. 14 (obligados a relacionarse electrónicamente)
INSERT INTO boe_changes
    (id, boe_identifier, regulation_title, short_title, articulo, change_type, affected_questions, detected_at)
VALUES
    (
        '00000000-0000-0000-0010-000000000010',
        'BOE-A-2015-10565',
        'Ley 39/2015, de 1 de octubre, del Procedimiento Administrativo Común de las Administraciones Públicas',
        'Ley 39/2015 · Proc. Administrativo Común',
        'Art. 14',
        'modificacion',
        3,
        now() - interval '2 days'
    )
ON CONFLICT DO NOTHING;

INSERT INTO boe_change_fragments (change_id, frag_type, text) VALUES
(
    '00000000-0000-0000-0010-000000000010',
    'antes',
    'Estarán obligados a relacionarse electrónicamente con las Administraciones Públicas para la realización de cualquier trámite de un procedimiento administrativo, al menos, los sujetos siguientes: a) Las personas jurídicas. b) Las entidades sin personalidad jurídica. c) Quienes ejerzan una actividad profesional para la que se requiera colegiación obligatoria, para los trámites e actuaciones que realicen con las Administraciones Públicas en ejercicio de dicha actividad profesional.'
),
(
    '00000000-0000-0000-0010-000000000010',
    'despues',
    'Estarán obligados a relacionarse electrónicamente con las Administraciones Públicas para la realización de cualquier trámite de un procedimiento administrativo, al menos, los sujetos siguientes: a) Las personas jurídicas. b) Las entidades sin personalidad jurídica. c) Quienes ejerzan cualquier actividad profesional colegiada. d) Los empleados públicos en el ejercicio de sus funciones.'
)
ON CONFLICT (change_id, frag_type) DO NOTHING;

-- Cambio 2: Modificación del Art. 21 (plazo para resolver)
INSERT INTO boe_changes
    (id, boe_identifier, regulation_title, short_title, articulo, change_type, affected_questions, detected_at)
VALUES
    (
        '00000000-0000-0000-0010-000000000011',
        'BOE-A-2015-10565',
        'Ley 39/2015, de 1 de octubre, del Procedimiento Administrativo Común de las Administraciones Públicas',
        'Ley 39/2015 · Proc. Administrativo Común',
        'Art. 21',
        'modificacion',
        5,
        now() - interval '5 days'
    )
ON CONFLICT DO NOTHING;

INSERT INTO boe_change_fragments (change_id, frag_type, text) VALUES
(
    '00000000-0000-0000-0010-000000000011',
    'antes',
    'La Administración está obligada a dictar resolución expresa y a notificarla en todos los procedimientos, sin perjuicio de que en los casos previstos legalmente pueda producirse la terminación del procedimiento por otras causas. El plazo máximo en el que debe notificarse la resolución expresa será el fijado por la norma reguladora del correspondiente procedimiento. Este plazo no podrá exceder de seis meses salvo que una norma con rango de Ley establezca uno mayor o así venga previsto en el Derecho de la Unión Europea.'
),
(
    '00000000-0000-0000-0010-000000000011',
    'despues',
    'La Administración está obligada a dictar resolución expresa y a notificarla en todos los procedimientos. El plazo máximo en el que debe notificarse la resolución expresa será el fijado por la norma reguladora del correspondiente procedimiento. Este plazo no podrá exceder de tres meses salvo que una norma con rango de Ley establezca uno mayor o así venga previsto en el Derecho de la Unión Europea. Transcurrido el plazo máximo legal para resolver sin que se haya notificado resolución expresa, se podrá entender estimada la solicitud por silencio administrativo, salvo en los supuestos contemplados en el artículo 24.1.'
)
ON CONFLICT (change_id, frag_type) DO NOTHING;

-- Cambio 3: Corrección tipográfica en el Art. 58 (notificaciones)
INSERT INTO boe_changes
    (id, boe_identifier, regulation_title, short_title, articulo, change_type, affected_questions, detected_at)
VALUES
    (
        '00000000-0000-0000-0010-000000000012',
        'BOE-A-2015-10565',
        'Ley 39/2015, de 1 de octubre, del Procedimiento Administrativo Común de las Administraciones Públicas',
        'Ley 39/2015 · Proc. Administrativo Común',
        'Art. 58',
        'tipografica',
        0,
        now() - interval '7 days'
    )
ON CONFLICT DO NOTHING;

INSERT INTO boe_change_fragments (change_id, frag_type, text) VALUES
(
    '00000000-0000-0000-0010-000000000012',
    'antes',
    'Cuando el interesado o su representante rechace la notificación de una actuación administrativa, se hará constar en el expediente, especificándose las circumstancias del intento de notificación y se tendrá por efectuado el trámite siguiéndose el procedimiento.'
),
(
    '00000000-0000-0000-0010-000000000012',
    'despues',
    'Cuando el interesado o su representante rechace la notificación de una actuación administrativa, se hará constar en el expediente, especificándose las circunstancias del intento de notificación y se tendrá por efectuado el trámite siguiéndose el procedimiento.'
)
ON CONFLICT (change_id, frag_type) DO NOTHING;

-- El usuario de demo ya leyó el cambio 3 (tipográfico)
INSERT INTO boe_alert_reads (user_id, change_id, read_at)
VALUES (
    '5c4f377c-a6dc-4158-acd0-7310efda78c7',
    '00000000-0000-0000-0010-000000000012',
    now() - interval '6 days'
)
ON CONFLICT (user_id, change_id) DO NOTHING;

-- Y tiene marcado como favorito el cambio del Art. 14
INSERT INTO boe_alert_bookmarks (user_id, change_id)
VALUES (
    '5c4f377c-a6dc-4158-acd0-7310efda78c7',
    '00000000-0000-0000-0010-000000000010'
)
ON CONFLICT (user_id, change_id) DO NOTHING;
